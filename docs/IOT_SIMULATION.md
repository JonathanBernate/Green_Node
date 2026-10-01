# Simulación de Red IoT — Documentación Técnica

## Objetivo

Simular una red de contenedores inteligentes distribuidos en Bogotá D.C. que reportan su nivel de llenado periódicamente mediante protocolo MQTT, emulando una comunicación LoRaWAN/NB-IoT a través de gateways hacia un broker central.

---

## Componentes del Simulador

### `iot_node_simulator.py`

Script principal que modela el comportamiento de N contenedores inteligentes.

### Modelo del Contenedor (ContainerNode)

Cada nodo simula:

| Parámetro | Rango | Descripción |
|-----------|-------|-------------|
| fill_level | 0-100% | Nivel de llenado, incrementa según patrón temporal |
| temperature | 8-25°C | Temperatura ambiente (clima de Bogotá) |
| battery_level | 0-100% | Decrece ~0.008% por lectura |
| fill_rate | 0.2-1.5%/ciclo | Velocidad de llenado (varía por zona) |
| status | active/full | Cambia a "full" cuando fill_level ≥ 90% |

### Distribución Geográfica

Los contenedores se distribuyen aleatoriamente en un radio de ~10 km desde el centro de Bogotá (4.6486, -74.0653) usando distribución gaussiana.

**Localidades cubiertas:**
Kennedy, Suba, Engativá, Bosa, Usaquén, Chapinero, Fontibón, Ciudad Bolívar, Usme, Barrios Unidos, Teusaquillo, Rafael Uribe.

---

## Modelo Temporal

El nivel de llenado varía según la hora del día, modelando patrones de generación de residuos:

| Hora | Factor | Descripción |
|------|--------|-------------|
| 0:00 - 5:00 | 0.1 | Madrugada (mínima actividad) |
| 6:00 - 6:59 | 1.0 | Mañana temprana |
| 7:00 - 9:00 | **2.0** | Pico AM (desayuno, salida) |
| 10:00 - 11:59 | 1.0 | Media mañana |
| 12:00 - 13:00 | **1.5** | Pico almuerzo |
| 14:00 - 16:59 | 1.0 | Tarde |
| 17:00 - 19:00 | **2.5** | Pico PM (cena, regreso) |
| 20:00 - 23:59 | 1.0 | Noche |

Fórmula de incremento:
```
Δfill = fill_rate × hour_factor + noise(μ=0, σ=0.3)
```

---

## Ejecución

### Parámetros de línea de comandos

```bash
python iot_node_simulator.py [opciones]
```

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `--broker` | localhost | Dirección IP/hostname del broker MQTT |
| `--port` | 1883 | Puerto del broker |
| `--nodes` | 50 | Número de contenedores a simular |
| `--interval` | 30 | Segundos entre reportes |
| `--duration` | 0 | Duración total en segundos (0 = infinito) |

### Ejemplos

```bash
# Simulación estándar: 50 nodos, 30s intervalo
python iot_node_simulator.py

# Simulación rápida para demo
python iot_node_simulator.py --nodes 10 --interval 5 --duration 300

# Simulación a escala con broker remoto
python iot_node_simulator.py --broker mqtt.greennode.co --port 8883 --nodes 200 --interval 60

# Solo logs (sin broker disponible)
python iot_node_simulator.py --nodes 20 --interval 5
```

---

## Métricas Generadas

En cada ciclo de simulación se calculan:

| Métrica | Descripción | Unidad |
|---------|-------------|--------|
| packets_sent | Paquetes MQTT enviados exitosamente | count |
| packets_failed | Paquetes que fallaron | count |
| avg_fill_level | Promedio de llenado de todos los nodos | % |
| containers_full | Contenedores con fill ≥ 90% | count |
| containers_active | Contenedores operativos (< 90%) | count |

Estas métricas se publican en `greennode/network/metrics` para ser consumidas por el dashboard.

---

## Eventos Especiales

### Alertas de desbordamiento

Cuando `fill_level ≥ 95%`:
- Se publica alerta en `greennode/system/alerts` con QoS 2
- Severidad: "medium" (95-97%) o "high" (≥ 98%)

### Recolección simulada

- Probabilidad: 10% por ciclo para contenedores en estado "full"
- Al vaciarse: fill_level = random(0, 5%), status = "active"
- Simula la llegada del camión de recolección

---

## Relación con la Tesis

### Objetivo Específico 1
> Proponer una arquitectura de red inalámbrica con enfoque IoT

El simulador valida la arquitectura propuesta al demostrar que:
- N nodos pueden reportar periódicamente sin colisiones
- El broker MQTT maneja la carga de tráfico esperada
- Los topics siguen la jerarquía definida

### Objetivo Específico 3
> Analizar el desempeño de la red IoT utilizando indicadores de cobertura, tráfico, latencia y escalabilidad

Métricas extraíbles del simulador:
- **Tráfico:** packets_sent × tamaño_payload × frecuencia = Erlang-B
- **Latencia:** timestamp_publish - timestamp_receive (medir con suscriptor)
- **Escalabilidad:** Ejecutar con 50, 100, 200, 500, 1000 nodos
- **PDR (Packet Delivery Ratio):** packets_sent / (packets_sent + packets_failed)

---

## Integración con NS-3 (Análisis Avanzado)

Para métricas de capa física (propagación, SNR, BER), se complementa con simulación en NS-3:

```
Simulador Python (capa aplicación) → Genera tráfico realista
NS-3 (capa física/red) → Modela LoRaWAN/NB-IoT con Okumura-Hata
```

Scripts NS-3 a desarrollar:
1. Modelo de propagación Okumura-Hata para Bogotá (868/915 MHz)
2. Despliegue de gateways LoRaWAN en ubicaciones reales
3. Evaluación de cobertura con mapa de calor
4. Análisis de capacidad vs. número de nodos
