# Módulo de Evaluación de la Red IoT — GreenNode

Material cuantitativo para el capítulo **"Evaluación de la arquitectura de red IoT"**
de la monografía de GreenNode. El módulo compara tres tecnologías LPWAN / cellular-IoT
—**LoRaWAN**, **NB-IoT** y **LTE-M**— en un entorno urbano (Bogotá), estimando pérdida
de trayectoria, alcance máximo y capacidad de la red.

Los parámetros de cada tecnología provienen de [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Qué hace

A partir del presupuesto de enlace (*link budget*) de cada tecnología y de dos modelos
de propagación empíricos, calcula:

- La **pérdida de trayectoria** (*path loss*) en función de la distancia.
- La **pérdida máxima admisible** (MAPL, *Maximum Allowable Path Loss*).
- El **alcance máximo teórico** (distancia donde `path_loss(d) = MAPL`, por búsqueda binaria).
- Los **contenedores por celda** que puede atender cada tecnología, acotados por su
  capacidad de red.

## Cómo ejecutarlo

```bash
pip install numpy matplotlib
python network/network_evaluation.py
```

Opciones:

- `--density <valor>` — densidad de contenedores en cont/km² (por defecto `20`).
- `--show` — nota informativa; el backend es `Agg`, por lo que las figuras siempre
  se guardan como PNG.

## Qué genera

- **Dos tablas en consola:**
  1. Comparación de tecnologías: banda, MAPL, alcance calculado, alcance documentado
     y dispositivos por celda.
  2. Contenedores por celda: área de cobertura, cobertura por densidad, capacidad de
     red y valor efectivo (el mínimo de ambos).
- **Tres figuras PNG** en `network/figures/` (dpi 130):
  - `fig1_path_loss.png` — pérdida de trayectoria vs distancia (0.1–15 km).
  - `fig2_max_range.png` — alcance máximo por tecnología (barras etiquetadas).
  - `fig3_devices.png` — dispositivos por celda (barras, escala logarítmica).

## Modelos de propagación

Se selecciona el modelo según la frecuencia de operación:

### Okumura-Hata (urbano, f ≤ 1500 MHz)

```
L = 69.55 + 26.16·log10(f) − 13.82·log10(hb) − a(hm)
      + (44.9 − 6.55·log10(hb))·log10(d)
```

### COST-231 Hata (urbano, f > 1500 MHz)

```
L = 46.3 + 33.9·log10(f) − 13.82·log10(hb) − a(hm)
      + (44.9 − 6.55·log10(hb))·log10(d) + Cm
```

### Factor de corrección por altura de la antena móvil

```
a(hm) = (1.1·log10(f) − 0.7)·hm − (1.56·log10(f) − 0.8)
```

Donde `f` es la frecuencia en MHz, `d` la distancia en km, `hb` la altura de la
estación base y `hm` la altura de la antena móvil (ambas en metros). `Cm = 3 dB`
corresponde a un centro urbano denso.

## Supuestos del estudio

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `hb` | 30 m | Altura de la antena de la estación base / gateway |
| `hm` | 1.5 m | Altura de la antena del nodo / contenedor |
| `Gtx` | 3 dBi | Ganancia de la antena transmisora |
| `Grx` | 2 dBi | Ganancia de la antena receptora |
| Densidad | 20 cont/km² | Densidad urbana asumida (configurable con `--density`) |

**Presupuesto de enlace:** `MAPL = Potencia_TX + Gtx + Grx − Sensibilidad_RX`.

**Contenedores por celda:** `cobertura = π·r²·densidad`, acotado por la capacidad de
red documentada (dispositivos/celda) de cada tecnología; el valor efectivo es el
mínimo de ambos.

> Los modelos son empíricos: las cifras son estimaciones de orden de magnitud para
> fines comparativos y de diseño, no mediciones de campo.

## Referencias

- Hata, M. (1980). *Empirical Formula for Propagation Loss in Land Mobile Radio
  Services*. IEEE Transactions on Vehicular Technology, 29(3), 317–325.
- COST Action 231 (1999). *Digital mobile radio towards future generation systems —
  Final Report*. European Commission, EUR 18957.
