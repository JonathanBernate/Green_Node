"""
Analizador de Métricas de Red IoT — GreenNode.

Recolecta datos del broker MQTT y genera reportes de desempeño
para el Objetivo Específico 3 de la tesis:
  - Cobertura, tráfico, latencia, escalabilidad

Uso:
    python network_metrics_analyzer.py --broker localhost --duration 300

Requisitos:
    pip install paho-mqtt pandas matplotlib numpy seaborn
"""

import json
import time
import argparse
from datetime import datetime
from dataclasses import dataclass, field

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("ERROR: pip install paho-mqtt")
    exit(1)

try:
    import pandas as pd
    import matplotlib.pyplot as plt
    import numpy as np
    import seaborn as sns
except ImportError:
    print("ERROR: pip install pandas matplotlib numpy seaborn")
    exit(1)


# ============================================================
# Recolector de Datos
# ============================================================

@dataclass
class MetricsCollector:
    """Recolecta métricas de red en tiempo real via MQTT."""
    fill_level_messages: list = field(default_factory=list)
    classification_messages: list = field(default_factory=list)
    alert_messages: list = field(default_factory=list)
    network_metrics: list = field(default_factory=list)
    latencies: list = field(default_factory=list)
    start_time: float = 0.0

    def record_fill_level(self, payload: dict):
        payload["received_at"] = datetime.now().isoformat()
        self.fill_level_messages.append(payload)
        # Calcular latencia si hay timestamp en el mensaje
        if "timestamp" in payload:
            try:
                sent = datetime.fromisoformat(payload["timestamp"])
                received = datetime.now()
                latency_ms = (received - sent).total_seconds() * 1000
                self.latencies.append(latency_ms)
            except:
                pass

    def record_classification(self, payload: dict):
        payload["received_at"] = datetime.now().isoformat()
        self.classification_messages.append(payload)

    def record_alert(self, payload: dict):
        payload["received_at"] = datetime.now().isoformat()
        self.alert_messages.append(payload)

    def record_network_metric(self, payload: dict):
        payload["received_at"] = datetime.now().isoformat()
        self.network_metrics.append(payload)


# ============================================================
# Análisis y Reportes
# ============================================================

def generate_report(collector: MetricsCollector, output_dir: str = "reports"):
    """Genera reporte completo de métricas de red."""
    import os
    os.makedirs(output_dir, exist_ok=True)

    duration = time.time() - collector.start_time
    print(f"\n{'='*60}")
    print(f"  REPORTE DE MÉTRICAS DE RED IoT — GreenNode")
    print(f"{'='*60}")
    print(f"  Duración de captura: {duration:.0f} segundos")

    # --- Métricas de Tráfico ---
    total_fill = len(collector.fill_level_messages)
    total_class = len(collector.classification_messages)
    total_alerts = len(collector.alert_messages)
    total_msgs = total_fill + total_class + total_alerts

    print(f"\n📊 TRÁFICO")
    print(f"   Total mensajes recibidos: {total_msgs}")
    print(f"   Fill level updates: {total_fill}")
    print(f"   Clasificaciones: {total_class}")
    print(f"   Alertas: {total_alerts}")
    print(f"   Throughput: {total_msgs/duration:.2f} msg/s")

    # Erlang-B (tráfico ofrecido)
    msg_per_second = total_msgs / duration if duration > 0 else 0
    erlang = msg_per_second  # Simplificado: A = λ * T_servicio
    print(f"   Tráfico Erlang (aprox): {erlang:.4f} E")

    # --- Métricas de Latencia ---
    if collector.latencies:
        lats = np.array(collector.latencies)
        print(f"\n⏱️  LATENCIA End-to-End")
        print(f"   Media: {np.mean(lats):.1f} ms")
        print(f"   Mediana: {np.median(lats):.1f} ms")
        print(f"   P95: {np.percentile(lats, 95):.1f} ms")
        print(f"   P99: {np.percentile(lats, 99):.1f} ms")
        print(f"   Mínima: {np.min(lats):.1f} ms")
        print(f"   Máxima: {np.max(lats):.1f} ms")

    # --- PDR (Packet Delivery Ratio) ---
    if collector.network_metrics:
        df_net = pd.DataFrame(collector.network_metrics)
        if "packets_sent" in df_net.columns and "packets_failed" in df_net.columns:
            total_sent = df_net["packets_sent"].sum()
            total_failed = df_net["packets_failed"].sum()
            pdr = (total_sent - total_failed) / total_sent * 100 if total_sent > 0 else 0
            print(f"\n📡 CONFIABILIDAD")
            print(f"   Paquetes enviados: {total_sent}")
            print(f"   Paquetes fallidos: {total_failed}")
            print(f"   PDR: {pdr:.2f}%")

    # --- Escalabilidad (nodos activos) ---
    if collector.network_metrics:
        if "total_nodes" in df_net.columns:
            nodes = df_net["total_nodes"].iloc[-1]
            print(f"\n📈 ESCALABILIDAD")
            print(f"   Nodos activos: {nodes}")
            print(f"   Mensajes/nodo/ciclo: {total_fill/len(collector.network_metrics):.1f}")

    # --- Generar gráficos ---
    print(f"\n📈 Generando gráficos...")
    _plot_latency_distribution(collector.latencies, output_dir)
    _plot_traffic_timeline(collector, output_dir)
    _plot_fill_levels(collector, output_dir)

    print(f"\n✅ Reporte guardado en: {output_dir}/")
    print(f"{'='*60}\n")


def _plot_latency_distribution(latencies, output_dir):
    """Gráfico de distribución de latencia."""
    if not latencies:
        return
    plt.figure(figsize=(10, 5))
    plt.hist(latencies, bins=50, color="#2E7D32", alpha=0.7, edgecolor="white")
    plt.axvline(np.mean(latencies), color="red", linestyle="--", label=f"Media: {np.mean(latencies):.0f}ms")
    plt.axvline(np.percentile(latencies, 95), color="orange", linestyle="--", label=f"P95: {np.percentile(latencies, 95):.0f}ms")
    plt.xlabel("Latencia (ms)")
    plt.ylabel("Frecuencia")
    plt.title("Distribución de Latencia End-to-End — Red IoT GreenNode")
    plt.legend()
    plt.tight_layout()
    plt.savefig(f"{output_dir}/latency_distribution.png", dpi=150)
    plt.close()


def _plot_traffic_timeline(collector, output_dir):
    """Gráfico de tráfico en el tiempo."""
    if not collector.network_metrics:
        return
    df = pd.DataFrame(collector.network_metrics)
    if "packets_sent" not in df.columns:
        return
    plt.figure(figsize=(12, 5))
    plt.plot(df.index, df["packets_sent"], color="#2E7D32", linewidth=2, label="Enviados")
    if "packets_failed" in df.columns:
        plt.plot(df.index, df["packets_failed"], color="#F44336", linewidth=2, label="Fallidos")
    plt.xlabel("Ciclo de simulación")
    plt.ylabel("Paquetes")
    plt.title("Tráfico MQTT por Ciclo — Red IoT GreenNode")
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/traffic_timeline.png", dpi=150)
    plt.close()


def _plot_fill_levels(collector, output_dir):
    """Gráfico de niveles de llenado promedio en el tiempo."""
    if not collector.fill_level_messages:
        return
    df = pd.DataFrame(collector.fill_level_messages)
    if "fillLevel" not in df.columns:
        return
    plt.figure(figsize=(12, 5))
    avg_per_window = df.groupby(df.index // 10)["fillLevel"].mean()
    plt.plot(avg_per_window.index, avg_per_window.values, color="#FF9800", linewidth=2)
    plt.axhline(90, color="#F44336", linestyle="--", alpha=0.7, label="Umbral de recolección (90%)")
    plt.xlabel("Ventana temporal")
    plt.ylabel("Nivel de llenado promedio (%)")
    plt.title("Nivel de Llenado Promedio — Contenedores IoT")
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/fill_levels_timeline.png", dpi=150)
    plt.close()


# ============================================================
# MQTT Callbacks
# ============================================================

collector = MetricsCollector()


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[MQTT] Conectado — suscribiendo a topics...")
        client.subscribe("greennode/#", qos=0)
    else:
        print(f"[MQTT] Error de conexión: {rc}")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
    except:
        return

    topic = msg.topic

    if "/fill" in topic:
        collector.record_fill_level(payload)
    elif "/classification" in topic:
        collector.record_classification(payload)
    elif "alerts" in topic:
        collector.record_alert(payload)
    elif "metrics" in topic:
        collector.record_network_metric(payload)


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Analizador de Métricas IoT")
    parser.add_argument("--broker", default="localhost")
    parser.add_argument("--port", type=int, default=1883)
    parser.add_argument("--duration", type=int, default=300, help="Segundos de captura")
    parser.add_argument("--output", default="reports", help="Directorio de salida")
    args = parser.parse_args()

    print("📊 GreenNode — Analizador de Métricas de Red IoT")
    print(f"   Broker: {args.broker}:{args.port}")
    print(f"   Duración: {args.duration}s")
    print(f"   Output: {args.output}/")

    client = mqtt.Client(client_id=f"greennode_analyzer_{int(time.time())}")
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(args.broker, args.port, keepalive=60)
    except Exception as e:
        print(f"[ERROR] No se pudo conectar: {e}")
        return

    collector.start_time = time.time()
    client.loop_start()

    print(f"\n⏳ Recolectando datos por {args.duration} segundos...")
    try:
        time.sleep(args.duration)
    except KeyboardInterrupt:
        print("\n   Captura interrumpida por usuario")

    client.loop_stop()
    client.disconnect()

    # Generar reporte
    generate_report(collector, args.output)


if __name__ == "__main__":
    main()
