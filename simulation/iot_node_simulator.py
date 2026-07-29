"""
Simulador de Nodos IoT para GreenNode.

Simula contenedores inteligentes que reportan nivel de llenado,
temperatura, batería y generan alertas vía MQTT.

Modela el comportamiento de sensores ultrasónicos HC-SR04 en contenedores
conectados via LoRaWAN/NB-IoT → Gateway → Broker MQTT.

Uso:
    python iot_node_simulator.py [--broker HOST] [--port PORT] [--nodes N] [--interval S]
"""

import json
import time
import random
import argparse
import math
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("ERROR: Instala paho-mqtt con: pip install paho-mqtt")
    exit(1)

try:
    import numpy as np
except ImportError:
    np = None  # Funciona sin numpy, usa random estándar


# --- Configuración ---

BOGOTA_CENTER = (4.6486, -74.0653)  # Lat, Lng centro de Bogotá
TOPICS = {
    "fill_level": "greennode/containers/{container_id}/fill",
    "status": "greennode/containers/{container_id}/status",
    "alert": "greennode/system/alerts",
    "metrics": "greennode/network/metrics",
}

LOCALIDADES_BOGOTA = [
    "Kennedy", "Suba", "Engativá", "Bosa", "Usaquén",
    "Chapinero", "Fontibón", "Ciudad Bolívar", "Usme",
    "Barrios Unidos", "Teusaquillo", "Rafael Uribe",
]


@dataclass
class ContainerNode:
    """Representa un contenedor inteligente virtual."""
    id: str
    latitude: float
    longitude: float
    address: str
    capacity_liters: int
    fill_level: float = 0.0  # 0-100
    fill_rate: float = 0.5   # % por intervalo (varía por hora)
    temperature: float = 22.0
    battery_level: float = 100.0
    status: str = "active"
    last_emptied: Optional[str] = None
    waste_types: list = field(default_factory=lambda: ["organic", "plastic", "paper"])

    def update(self, hour_of_day: int) -> dict:
        """Simula un ciclo de actualización del sensor."""
        # Factor de llenado varía según hora del día (picos 7-9am y 5-7pm)
        hour_factor = self._get_hour_factor(hour_of_day)
        
        # Incrementar nivel de llenado
        noise = random.gauss(0, 0.3)
        increment = self.fill_rate * hour_factor + noise
        self.fill_level = max(0, min(100, self.fill_level + increment))

        # Simular temperatura (varía con el clima de Bogotá: 8-20°C)
        self.temperature = 14 + random.gauss(0, 3)

        # Consumo de batería (muy bajo: ~0.01% por lectura)
        self.battery_level = max(0, self.battery_level - 0.008)

        # Detectar si necesita recolección (>90%)
        if self.fill_level >= 90 and self.status != "full":
            self.status = "full"

        return self.to_mqtt_payload()

    def empty(self):
        """Simula el vaciado del contenedor (recolección)."""
        self.fill_level = random.uniform(0, 5)  # Nunca queda 100% vacío
        self.status = "active"
        self.last_emptied = datetime.now().isoformat()

    def to_mqtt_payload(self) -> dict:
        """Genera el payload MQTT para publicar."""
        return {
            "containerId": self.id,
            "fillLevel": round(self.fill_level, 1),
            "temperature": round(self.temperature, 1),
            "batteryLevel": round(self.battery_level, 1),
            "timestamp": datetime.now().isoformat(),
            "latitude": self.latitude,
            "longitude": self.longitude,
        }

    @staticmethod
    def _get_hour_factor(hour: int) -> float:
        """Factor de llenado según hora del día."""
        # Picos: 7-9am (desayuno/salida), 12-1pm (almuerzo), 5-7pm (cena/regreso)
        if 7 <= hour <= 9:
            return 2.0
        elif 12 <= hour <= 13:
            return 1.5
        elif 17 <= hour <= 19:
            return 2.5
        elif 0 <= hour <= 5:
            return 0.1
        else:
            return 1.0


def generate_containers(num_nodes: int) -> list:
    """Genera contenedores distribuidos en Bogotá."""
    containers = []
    for i in range(num_nodes):
        # Distribuir aleatoriamente en un radio de ~10km del centro
        lat_offset = random.gauss(0, 0.04)  # ~4.4km std dev
        lng_offset = random.gauss(0, 0.04)

        localidad = random.choice(LOCALIDADES_BOGOTA)
        capacity = random.choice([120, 240, 360])
        fill_rate = random.uniform(0.2, 1.5)  # Varía por zona

        container = ContainerNode(
            id=f"c-{i+1:03d}",
            latitude=BOGOTA_CENTER[0] + lat_offset,
            longitude=BOGOTA_CENTER[1] + lng_offset,
            address=f"Contenedor {i+1}, {localidad}",
            capacity_liters=capacity,
            fill_level=random.uniform(0, 60),
            fill_rate=fill_rate,
            battery_level=random.uniform(70, 100),
            waste_types=random.sample(
                ["organic", "plastic", "paper", "glass", "metal", "special"],
                k=random.randint(2, 5),
            ),
        )
        containers.append(container)

    return containers


def on_connect(client, userdata, flags, rc):
    """Callback de conexión MQTT."""
    if rc == 0:
        print(f"[MQTT] Conectado al broker exitosamente")
    else:
        print(f"[MQTT] Error de conexión, código: {rc}")


def main():
    parser = argparse.ArgumentParser(description="Simulador de Nodos IoT GreenNode")
    parser.add_argument("--broker", default="localhost", help="Dirección del broker MQTT")
    parser.add_argument("--port", type=int, default=1883, help="Puerto del broker")
    parser.add_argument("--nodes", type=int, default=50, help="Número de contenedores")
    parser.add_argument("--interval", type=int, default=30, help="Intervalo de reporte (seg)")
    parser.add_argument("--duration", type=int, default=0, help="Duración en segundos (0=infinito)")
    args = parser.parse_args()

    print(f"=" * 60)
    print(f"  GreenNode — Simulador de Red IoT")
    print(f"  Nodos: {args.nodes} | Intervalo: {args.interval}s")
    print(f"  Broker: {args.broker}:{args.port}")
    print(f"=" * 60)

    # Generar contenedores
    containers = generate_containers(args.nodes)
    print(f"\n[SIM] {len(containers)} contenedores generados en Bogotá")

    # Conectar al broker MQTT
    client = mqtt.Client(client_id=f"greennode_sim_{int(time.time())}")
    client.on_connect = on_connect

    try:
        client.connect(args.broker, args.port, keepalive=60)
        client.loop_start()
    except Exception as e:
        print(f"[ERROR] No se pudo conectar al broker: {e}")
        print("[INFO] Ejecutando en modo offline (solo logs)")
        client = None

    # Bucle principal de simulación
    start_time = time.time()
    cycle = 0

    try:
        while True:
            cycle += 1
            hour = datetime.now().hour
            
            print(f"\n--- Ciclo {cycle} | Hora simulada: {hour}:00 ---")

            metrics = {
                "packets_sent": 0,
                "packets_failed": 0,
                "avg_fill_level": 0,
                "containers_full": 0,
                "containers_active": 0,
            }

            for container in containers:
                payload = container.update(hour)
                topic = TOPICS["fill_level"].format(container_id=container.id)

                if client:
                    try:
                        result = client.publish(topic, json.dumps(payload), qos=0)
                        metrics["packets_sent"] += 1
                    except:
                        metrics["packets_failed"] += 1
                else:
                    metrics["packets_sent"] += 1

                metrics["avg_fill_level"] += container.fill_level
                if container.status == "full":
                    metrics["containers_full"] += 1
                else:
                    metrics["containers_active"] += 1

                # Generar alerta si contenedor lleno
                if container.fill_level >= 95:
                    alert = {
                        "alertId": f"alert-{cycle}-{container.id}",
                        "type": "overflow",
                        "containerId": container.id,
                        "message": f"Contenedor {container.id} al {container.fill_level:.0f}% - requiere recolección urgente",
                        "severity": "high" if container.fill_level >= 98 else "medium",
                        "timestamp": datetime.now().isoformat(),
                    }
                    if client:
                        client.publish(TOPICS["alert"], json.dumps(alert), qos=2)
                    print(f"  ⚠️  ALERTA: {alert['message']}")

            # Simular recolección aleatoria (10% de probabilidad por ciclo para llenos)
            for container in containers:
                if container.status == "full" and random.random() < 0.1:
                    container.empty()
                    print(f"  🚛 Contenedor {container.id} vaciado")

            metrics["avg_fill_level"] /= len(containers)

            # Publicar métricas de red
            if client:
                client.publish(
                    TOPICS["metrics"],
                    json.dumps({
                        **metrics,
                        "cycle": cycle,
                        "timestamp": datetime.now().isoformat(),
                        "total_nodes": len(containers),
                    }),
                    qos=0,
                )

            print(f"  📊 Enviados: {metrics['packets_sent']} | "
                  f"Nivel medio: {metrics['avg_fill_level']:.1f}% | "
                  f"Llenos: {metrics['containers_full']}/{len(containers)}")

            # Verificar duración
            if args.duration > 0 and (time.time() - start_time) >= args.duration:
                print(f"\n[SIM] Duración alcanzada ({args.duration}s). Finalizando.")
                break

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\n[SIM] Simulación interrumpida por usuario")
    finally:
        if client:
            client.loop_stop()
            client.disconnect()
        print(f"[SIM] Total ciclos: {cycle} | Tiempo: {time.time() - start_time:.0f}s")


if __name__ == "__main__":
    main()
