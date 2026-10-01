"""
GreenNode — Módulo de Evaluación de la Red IoT
==============================================

Propósito académico
--------------------
Este módulo da soporte cuantitativo al capítulo de "Evaluación de la arquitectura
de red IoT" de la monografía de GreenNode. Compara tres tecnologías de comunicación
de área amplia y bajo consumo (LPWAN/cellular-IoT) —LoRaWAN, NB-IoT y LTE-M— en un
entorno urbano (Bogotá), estimando:

  * la pérdida de trayectoria (path loss) en función de la distancia,
  * la pérdida máxima admisible (MAPL, Maximum Allowable Path Loss) a partir del
    presupuesto de enlace (link budget),
  * el alcance máximo teórico de cada tecnología,
  * la densidad de contenedores que una celda puede cubrir.

Modelos de propagación empleados
---------------------------------
  * Okumura-Hata (urbano) para frecuencias f <= 1500 MHz.
  * COST-231 Hata (urbano) como extensión de Hata para f > 1500 MHz.

Ambos modelos son estándar en la literatura de planificación de redes celulares y
LPWAN para estimar la atenuación media en entornos urbanos.

Referencias
-----------
  * Hata, M. (1980). "Empirical Formula for Propagation Loss in Land Mobile Radio
    Services". IEEE Transactions on Vehicular Technology, 29(3), 317-325.
  * COST Action 231 (1999). "Digital mobile radio towards future generation
    systems — Final Report". European Commission, EUR 18957.

Nota: los modelos son empíricos y las cifras resultantes son estimaciones de
orden de magnitud para fines comparativos y de diseño, no mediciones de campo.
"""

import argparse
import math
import os

import numpy as np

import matplotlib
matplotlib.use("Agg")  # backend sin interfaz: permite generar PNG sin display
import matplotlib.pyplot as plt


# ---------------------------------------------------------------------------
# Constantes físicas y de despliegue (supuestos del estudio)
# ---------------------------------------------------------------------------
HB_M = 30     # Altura de la antena de la estación base / gateway [m]
HM_M = 1.5    # Altura de la antena del nodo móvil / contenedor [m]
G_TX_DBI = 3  # Ganancia de la antena transmisora [dBi]
G_RX_DBI = 2  # Ganancia de la antena receptora [dBi]

# Tecnologías evaluadas. Parámetros tomados de docs/ARCHITECTURE.md.
#   freq_mhz   : frecuencia central de operación [MHz]
#   tx_dbm     : potencia de transmisión [dBm]
#   sens_dbm   : sensibilidad del receptor [dBm]
#   rate       : tasa de datos documentada
#   devices    : dispositivos por celda (capacidad de red documentada)
#   range_doc  : alcance documentado (referencia)
#   band       : banda de operación
TECHNOLOGIES = {
    "LoRaWAN": {
        "freq_mhz": 915.0,
        "tx_dbm": 14.0,
        "sens_dbm": -137.0,
        "rate": "0.3-50 kbps",
        "devices": 15000,
        "range_doc": "2-15 km",
        "band": "915 MHz (ISM)",
    },
    "NB-IoT": {
        "freq_mhz": 900.0,
        "tx_dbm": 23.0,
        "sens_dbm": -141.0,
        "rate": "20-250 kbps",
        "devices": 50000,
        "range_doc": "1-10 km",
        "band": "700-1900 MHz (licenciada)",
    },
    "LTE-M": {
        "freq_mhz": 900.0,
        "tx_dbm": 23.0,
        "sens_dbm": -120.0,
        "rate": "1 Mbps",
        "devices": 10000,
        "range_doc": "1-5 km",
        "band": "LTE bands",
    },
}


# ---------------------------------------------------------------------------
# Modelos de propagación
# ---------------------------------------------------------------------------
def _a_hm(f, hm):
    """Factor de corrección por altura de la antena móvil (ciudad pequeña/mediana).

    f  : frecuencia [MHz]
    hm : altura de la antena móvil [m]
    """
    return (1.1 * math.log10(f) - 0.7) * hm - (1.56 * math.log10(f) - 0.8)


def okumura_hata_urban(f, d, hb, hm):
    """Pérdida de trayectoria según Okumura-Hata (entorno urbano), f <= 1500 MHz.

    f  : frecuencia [MHz]
    d  : distancia [km]
    hb : altura de la antena de la estación base [m]
    hm : altura de la antena móvil [m]
    Devuelve la pérdida de trayectoria en dB.
    """
    a_hm = _a_hm(f, hm)
    return (
        69.55
        + 26.16 * math.log10(f)
        - 13.82 * math.log10(hb)
        - a_hm
        + (44.9 - 6.55 * math.log10(hb)) * math.log10(d)
    )


def cost231_hata_urban(f, d, hb, hm, cm=3):
    """Pérdida de trayectoria según COST-231 Hata (urbano), f > 1500 MHz.

    cm : factor de corrección metropolitano (3 dB para centros urbanos densos).
    Resto de parámetros como en okumura_hata_urban. Devuelve dB.
    """
    a_hm = _a_hm(f, hm)
    return (
        46.3
        + 33.9 * math.log10(f)
        - 13.82 * math.log10(hb)
        - a_hm
        + (44.9 - 6.55 * math.log10(hb)) * math.log10(d)
        + cm
    )


def path_loss(f, d, hb=HB_M, hm=HM_M):
    """Pérdida de trayectoria seleccionando el modelo según la frecuencia.

    Usa Okumura-Hata para f <= 1500 MHz y COST-231 Hata para f > 1500 MHz.
    """
    if f <= 1500:
        return okumura_hata_urban(f, d, hb, hm)
    return cost231_hata_urban(f, d, hb, hm)


# ---------------------------------------------------------------------------
# Presupuesto de enlace y alcance
# ---------------------------------------------------------------------------
def max_allowable_path_loss(tech):
    """MAPL [dB] = Potencia TX + Ganancia TX + Ganancia RX - Sensibilidad RX.

    tech : clave del diccionario TECHNOLOGIES.
    """
    t = TECHNOLOGIES[tech]
    return t["tx_dbm"] + G_TX_DBI + G_RX_DBI - t["sens_dbm"]


def max_range_km(tech):
    """Alcance máximo [km] donde path_loss(d) == MAPL, por búsqueda binaria.

    La pérdida de trayectoria crece monótonamente con la distancia, por lo que
    una búsqueda binaria en [0.1, 100] km converge a la distancia de cruce.
    """
    mapl = max_allowable_path_loss(tech)
    f = TECHNOLOGIES[tech]["freq_mhz"]

    lo, hi = 0.1, 100.0
    for _ in range(100):
        mid = (lo + hi) / 2.0
        if path_loss(f, mid) < mapl:
            lo = mid
        else:
            hi = mid
    return round((lo + hi) / 2.0, 2)


# ---------------------------------------------------------------------------
# Tablas
# ---------------------------------------------------------------------------
def print_tables(density=20.0):
    """Imprime las tablas comparativas en consola.

    density : densidad de contenedores asumida [contenedores/km^2].

    Supuesto de densidad: se asume una densidad uniforme de `density`
    contenedores por km^2 (valor por defecto 20 cont/km^2, representativo de
    un entorno urbano denso como Bogotá). El número de contenedores que una
    celda puede atender se calcula como el área de cobertura (pi * r^2) por la
    densidad, acotado por la capacidad de red (dispositivos/celda) de cada
    tecnología.
    """
    print("=" * 78)
    print("GreenNode — Evaluación de la red IoT (entorno urbano, Bogotá)")
    print("=" * 78)
    print(f"Supuestos: hb={HB_M} m, hm={HM_M} m, "
          f"Gtx={G_TX_DBI} dBi, Grx={G_RX_DBI} dBi")
    print(f"Modelos: Okumura-Hata (f<=1500 MHz), COST-231 Hata (f>1500 MHz)")
    print()

    # --- Tabla 1: comparación de propagación / alcance ---
    print("Tabla 1. Comparación de tecnologías y alcance estimado")
    print("-" * 78)
    header = (f"{'Tecnología':<10} {'Banda':<24} {'MAPL(dB)':>9} "
              f"{'Alc.calc':>9} {'Alc.doc':>9} {'Disp/celda':>11}")
    print(header)
    print("-" * 78)
    for tech, t in TECHNOLOGIES.items():
        mapl = max_allowable_path_loss(tech)
        rng = max_range_km(tech)
        print(f"{tech:<10} {t['band']:<24} {mapl:>9.1f} "
              f"{rng:>7.2f}km {t['range_doc']:>9} {t['devices']:>11,}")
    print("-" * 78)
    print()

    # --- Tabla 2: contenedores por celda ---
    print(f"Tabla 2. Contenedores por celda (densidad = {density:.1f} cont/km^2)")
    print("-" * 78)
    header2 = (f"{'Tecnología':<10} {'Alcance(km)':>12} {'Área(km^2)':>12} "
               f"{'Por densidad':>13} {'Cap.red':>10} {'Efectivo':>10}")
    print(header2)
    print("-" * 78)
    for tech, t in TECHNOLOGIES.items():
        rng = max_range_km(tech)
        area = math.pi * rng ** 2
        by_density = int(area * density)
        cap = t["devices"]
        effective = min(by_density, cap)
        limiter = "densidad" if by_density <= cap else "capacidad"
        print(f"{tech:<10} {rng:>12.2f} {area:>12.1f} "
              f"{by_density:>13,} {cap:>10,} {effective:>10,}  [{limiter}]")
    print("-" * 78)
    print("Nota: 'Efectivo' = min(cobertura por densidad, capacidad de red).")
    print()


# ---------------------------------------------------------------------------
# Figuras
# ---------------------------------------------------------------------------
def make_figures():
    """Genera las tres figuras del estudio en network/figures/ (PNG, dpi=130)."""
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figures")
    os.makedirs(out_dir, exist_ok=True)

    techs = list(TECHNOLOGIES.keys())

    # --- Figura 1: pérdida de trayectoria vs distancia ---
    distances = np.linspace(0.1, 15.0, 200)
    plt.figure(figsize=(8, 5))
    for tech in techs:
        f = TECHNOLOGIES[tech]["freq_mhz"]
        losses = [path_loss(f, d) for d in distances]
        plt.plot(distances, losses, label=f"{tech} ({f:.0f} MHz)")
    plt.xlabel("Distancia [km]")
    plt.ylabel("Pérdida de trayectoria [dB]")
    plt.title("Figura 1. Pérdida de trayectoria vs distancia (urbano)")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    fig1 = os.path.join(out_dir, "fig1_path_loss.png")
    plt.savefig(fig1, dpi=130)
    plt.close()

    # --- Figura 2: alcance máximo ---
    ranges = [max_range_km(t) for t in techs]
    plt.figure(figsize=(8, 5))
    bars = plt.bar(techs, ranges, color=["#2a9d8f", "#e76f51", "#264653"])
    for bar, r in zip(bars, ranges):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(),
                 f"{r:.2f} km", ha="center", va="bottom")
    plt.ylabel("Alcance máximo [km]")
    plt.title("Figura 2. Alcance máximo estimado por tecnología")
    plt.grid(True, axis="y", alpha=0.3)
    plt.tight_layout()
    fig2 = os.path.join(out_dir, "fig2_max_range.png")
    plt.savefig(fig2, dpi=130)
    plt.close()

    # --- Figura 3: dispositivos por celda (escala log) ---
    devices = [TECHNOLOGIES[t]["devices"] for t in techs]
    plt.figure(figsize=(8, 5))
    bars = plt.bar(techs, devices, color=["#2a9d8f", "#e76f51", "#264653"])
    for bar, d in zip(bars, devices):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(),
                 f"{d:,}", ha="center", va="bottom")
    plt.yscale("log")
    plt.ylabel("Dispositivos por celda (escala log)")
    plt.title("Figura 3. Capacidad de red por tecnología")
    plt.grid(True, axis="y", alpha=0.3, which="both")
    plt.tight_layout()
    fig3 = os.path.join(out_dir, "fig3_devices.png")
    plt.savefig(fig3, dpi=130)
    plt.close()

    print(f"Figuras generadas en: {out_dir}")
    for p in (fig1, fig2, fig3):
        print(f"  - {os.path.basename(p)}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Evaluación de la red IoT de GreenNode "
                    "(propagación, alcance y capacidad)."
    )
    parser.add_argument("--show", action="store_true",
                        help="Mostrar las figuras de forma interactiva "
                             "(requiere backend gráfico).")
    parser.add_argument("--density", type=float, default=20.0,
                        help="Densidad de contenedores [cont/km^2] "
                             "(por defecto 20).")
    args = parser.parse_args()

    print_tables(density=args.density)
    make_figures()

    if args.show:
        print("Nota: backend 'Agg' activo; las figuras se guardaron como PNG.")


if __name__ == "__main__":
    main()
