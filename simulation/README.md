# Simulación de Red IoT — GreenNode

## Descripción

Este módulo contiene los scripts de simulación de la red IoT para el proyecto de grado.
Genera datos sintéticos de contenedores inteligentes (niveles de llenado, alertas, estados)
y los publica vía MQTT hacia el broker central.

## Requisitos

```bash
pip install paho-mqtt numpy
```

## Ejecución

```bash
# Iniciar simulador de nodos IoT (contenedores virtuales)
python iot_node_simulator.py

# Opciones:
#   --broker localhost     Dirección del broker MQTT
#   --port 1883           Puerto del broker
#   --nodes 50            Número de contenedores a simular
#   --interval 30         Intervalo de reporte en segundos
```

## Arquitectura del Simulador

```
Nodo IoT Virtual (contenedor)
    │
    ├── Genera nivel de llenado (distribución probabilística)
    ├── Reporta temperatura y batería
    ├── Detecta anomalías (desbordamiento)
    │
    └── Publica vía MQTT → greennode/containers/{id}/fill
```

## Topics MQTT

| Topic | Dirección | QoS | Descripción |
|-------|-----------|-----|-------------|
| `greennode/containers/{id}/fill` | Nodo → Broker | 0 | Nivel de llenado periódico |
| `greennode/containers/{id}/status` | Nodo → Broker | 1 | Cambio de estado |
| `greennode/system/alerts` | Nodo → Broker | 2 | Alertas críticas |
| `greennode/users/{id}/classification` | App → Broker | 1 | Clasificación de residuos |
| `greennode/network/metrics` | Broker → Dashboard | 0 | Métricas de red |
