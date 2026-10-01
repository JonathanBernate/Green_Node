"""
Suscriptor de verificación end-to-end para GreenNode (Req 7).

Confirma el flujo Simulador -> Broker -> suscriptor: se conecta al broker
Mosquitto local, se suscribe al wildcard `greennode/#` y escucha durante un
tiempo configurable, imprimiendo cada mensaje agrupado por tipo de topic
(fill, status, alert, metrics). Al terminar imprime un resumen con el conteo
de mensajes por tipo y de qué contenedores (c-001..c-005) se recibió telemetría.

Este script NO reemplaza a la app React Native: es una herramienta de
verificación aislada del transporte MQTT (broker + simulador + topics +
payloads) sin depender del entorno Android.

Cómo usarlo (tres terminales):

    # Terminal 1 — arrancar el broker
    cd mqtt && docker compose up -d

    # Terminal 2 — arrancar este suscriptor de verificación
    python simulation/verify_e2e.py --seconds 20

    # Terminal 3 — arrancar el simulador de nodos IoT
    python simulation/iot_node_simulator.py --nodes 5 --interval 3

Resultado esperado: el suscriptor imprime mensajes `fill` de c-001..c-005 y,
al terminar, el resumen muestra `fills > 0`. Si algún contenedor supera el
umbral (90%), aparecen también mensajes `status` (full) y `alert` con severity.

Uso:
    python verify_e2e.py [--broker HOST] [--port PORT] [--seconds S]
"""

import json
import time
import argparse
from collections import defaultdict

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("ERROR: Instala paho-mqtt con: pip install paho-mqtt")
    raise SystemExit(1)


WILDCARD = "greennode/#"


def classify_topic(topic: str) -> str:
    """Clasifica un topic en uno de los tipos conocidos.

    Reglas (coinciden con los topics que publica iot_node_simulator.py):
      - '/fill'   -> greennode/containers/{id}/fill
      - '/status' -> greennode/containers/{id}/status
      - 'alerts'  -> greennode/system/alerts
      - 'metrics' -> greennode/network/metrics
    """
    if topic.endswith("/fill"):
        return "fill"
    if topic.endswith("/status"):
        return "status"
    if "alerts" in topic:
        return "alert"
    if "metrics" in topic:
        return "metrics"
    return "other"


class Verifier:
    """Acumula el estado observado durante la verificación."""

    def __init__(self):
        self.counts = defaultdict(int)                 # tipo -> nº de mensajes
        self.containers = defaultdict(set)             # tipo -> {containerId}

    def record(self, topic: str, payload: dict):
        kind = classify_topic(topic)
        self.counts[kind] += 1

        container_id = payload.get("containerId")
        if container_id:
            self.containers[kind].add(container_id)

        if kind == "fill":
            print(
                f"  [FILL]   {container_id} "
                f"fill={payload.get('fillLevel')}% "
                f"temp={payload.get('temperature')} "
                f"bat={payload.get('batteryLevel')}%"
            )
        elif kind == "status":
            print(
                f"  [STATUS] {container_id} "
                f"status={payload.get('status')} "
                f"reason={payload.get('reason')}"
            )
        elif kind == "alert":
            # Para las alertas mostramos containerId y severity (Req 6.4, 7.3)
            print(
                f"  [ALERT]  {container_id} "
                f"severity={payload.get('severity')} "
                f"type={payload.get('type')} "
                f"msg={payload.get('message')}"
            )
        elif kind == "metrics":
            print(
                f"  [METRIC] ciclo={payload.get('cycle')} "
                f"enviados={payload.get('packets_sent')} "
                f"llenos={payload.get('containers_full')} "
                f"nivel_medio={payload.get('avg_fill_level')}"
            )
        else:
            print(f"  [OTRO]   {topic} -> {payload}")

    def print_summary(self, seconds: int):
        print("\n" + "=" * 60)
        print("  RESUMEN DE VERIFICACION END-TO-END")
        print(f"  Escucha: {seconds}s | Topic: {WILDCARD}")
        print("=" * 60)

        total = sum(self.counts.values())
        for kind in ("fill", "status", "alert", "metrics", "other"):
            count = self.counts.get(kind, 0)
            ids = sorted(self.containers.get(kind, set()))
            ids_str = ", ".join(ids) if ids else "-"
            print(f"  {kind:8s}: {count:4d}   contenedores: {ids_str}")

        print("-" * 60)
        print(f"  TOTAL mensajes recibidos: {total}")

        if self.counts.get("fill", 0) > 0:
            print("  [OK] Flujo Simulador -> Broker -> suscriptor CONFIRMADO (fills > 0)")
        else:
            print("  [FALLO] No se recibieron mensajes fill. Esta corriendo el simulador?")
        print("=" * 60)


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Conectado. Suscribiendo a '{WILDCARD}'...")
        client.subscribe(WILDCARD)
    else:
        print(f"[MQTT] Error de conexion, codigo: {rc}")


def on_message(client, userdata, msg):
    verifier: Verifier = userdata
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        print(f"  [WARN]  payload no-JSON en {msg.topic}")
        return
    verifier.record(msg.topic, payload)


def main():
    parser = argparse.ArgumentParser(
        description="Suscriptor de verificacion end-to-end GreenNode (greennode/#)"
    )
    parser.add_argument("--broker", default="localhost", help="Direccion del broker MQTT")
    parser.add_argument("--port", type=int, default=1883, help="Puerto del broker")
    parser.add_argument(
        "--seconds", type=int, default=15,
        help="Tiempo de escucha antes de imprimir el resumen (por defecto 15)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("  GreenNode - Verificacion end-to-end (suscriptor)")
    print(f"  Broker: {args.broker}:{args.port} | Escucha: {args.seconds}s")
    print("=" * 60)

    verifier = Verifier()
    client = mqtt.Client(client_id=f"greennode_verify_{int(time.time())}")
    client.user_data_set(verifier)
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(args.broker, args.port, keepalive=60)
    except Exception as e:
        print(f"[ERROR] No se pudo conectar al broker {args.broker}:{args.port}: {e}")
        print("[INFO] Verifica que el broker este corriendo: cd mqtt && docker compose up -d")
        raise SystemExit(1)

    client.loop_start()
    try:
        time.sleep(args.seconds)
    except KeyboardInterrupt:
        print("\n[VERIFY] Interrumpido por el usuario.")
    finally:
        client.loop_stop()
        client.disconnect()

    verifier.print_summary(args.seconds)


if __name__ == "__main__":
    main()
