# Protocolo MQTT — Especificación de Comunicación IoT

## Resumen

La comunicación entre la aplicación móvil, los nodos IoT simulados y la plataforma central se realiza mediante **MQTT v3.1.1** sobre **TLS 1.3** (puerto 8883 en producción, 1883 en desarrollo).

---

## Topics

### Estructura de topics

```
greennode/{scope}/{identifier}/{action}
```

### Tabla completa de topics

| Topic | Dirección | QoS | Payload | Frecuencia |
|-------|-----------|-----|---------|------------|
| `greennode/users/{userId}/classification` | App → Broker | 1 | ClassificationMessage | Por evento |
| `greennode/users/{userId}/events` | App → Broker | 1 | EventMessage | Por evento |
| `greennode/containers/{id}/fill` | Nodo → Broker | 0 | FillLevelMessage | Cada 30s-5min |
| `greennode/containers/{id}/status` | Nodo → Broker | 1 | StatusMessage | Por evento |
| `greennode/containers/+/fill` | Broker → App | 0 | FillLevelMessage | Wildcard sub |
| `greennode/system/alerts` | Nodo → Broker | 2 | AlertMessage | Por evento |
| `greennode/network/metrics` | Sim → Broker | 0 | MetricsMessage | Por ciclo |

---

## Payloads (JSON)

### ClassificationMessage

Publicado por la app cuando el usuario clasifica un residuo.

```json
{
  "userId": "user-123",
  "wasteType": "plastic",
  "confidence": 0.94,
  "timestamp": "2026-07-28T15:30:00.000Z",
  "location": {
    "latitude": 4.6486,
    "longitude": -74.0653
  },
  "imageHash": "a1b2c3d4..."
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| userId | string | ✓ | ID del usuario |
| wasteType | enum | ✓ | organic, plastic, paper, glass, metal, special |
| confidence | float | ✓ | 0.0 - 1.0 |
| timestamp | ISO 8601 | ✓ | Fecha/hora UTC |
| location | object | ✗ | Coordenadas GPS |
| imageHash | string | ✗ | SHA-256 de la imagen |

### FillLevelMessage

Publicado por los nodos IoT periódicamente.

```json
{
  "containerId": "c-001",
  "fillLevel": 67.3,
  "temperature": 18.5,
  "batteryLevel": 94.2,
  "timestamp": "2026-07-28T15:30:00.000Z"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| containerId | string | ✓ | ID del contenedor |
| fillLevel | float | ✓ | 0-100 (porcentaje) |
| temperature | float | ✗ | °C ambiente |
| batteryLevel | float | ✗ | 0-100% batería |
| timestamp | ISO 8601 | ✓ | Fecha/hora UTC |

### ContainerStatusMessage

Publicado cuando un contenedor cambia de estado.

```json
{
  "containerId": "c-003",
  "status": "maintenance",
  "reason": "Sensor descalibrado",
  "timestamp": "2026-07-28T15:30:00.000Z"
}
```

| Campo | Tipo | Valores |
|-------|------|---------|
| status | enum | active, full, maintenance, offline |

### SystemAlertMessage

Publicado cuando se detecta una condición crítica.

```json
{
  "alertId": "alert-001",
  "type": "overflow",
  "containerId": "c-003",
  "message": "Contenedor c-003 al 98% - requiere recolección urgente",
  "severity": "high",
  "timestamp": "2026-07-28T15:30:00.000Z"
}
```

| Campo | Tipo | Valores |
|-------|------|---------|
| type | enum | overflow, maintenance, anomaly, battery_low |
| severity | enum | low, medium, high, critical |

---

## Configuración del Cliente

### Parámetros de conexión

| Parámetro | Valor |
|-----------|-------|
| Protocolo | MQTT v3.1.1 |
| Puerto (dev) | 1883 (sin TLS) |
| Puerto (prod) | 8883 (TLS) |
| Keep Alive | 30 segundos |
| Clean Session | true |
| Client ID | `greennode_app_{userId}` |

### Reconexión (backoff exponencial)

```
Intento 1: 1s
Intento 2: 2s
Intento 3: 4s
Intento 4: 8s
Intento 5: 16s
Intento 6: 32s
Intento 7+: 60s (máximo)
```

Máximo 10 intentos antes de detenerse.

### Rate Limiting

- Clasificaciones: máximo 1 mensaje por minuto por usuario
- Fill levels (recepción): sin límite
- Alertas: sin límite

---

## Seguridad (TLS)

### Producción

- TLS 1.3 con cifrado AES-256-GCM
- Autenticación por certificados X.509
- Verificación mutua (mTLS) entre nodos y broker
- Sin almacenar credenciales en texto plano

### Desarrollo

- Sin TLS (puerto 1883)
- Sin autenticación
- Broker Mosquitto local con configuración por defecto

---

## Métricas de Red

El simulador publica métricas agregadas por ciclo:

```json
{
  "cycle": 42,
  "packets_sent": 50,
  "packets_failed": 0,
  "avg_fill_level": 54.3,
  "containers_full": 3,
  "containers_active": 47,
  "total_nodes": 50,
  "timestamp": "2026-07-28T15:30:00.000Z"
}
```

Estas métricas alimentan el análisis de desempeño de la red (Objetivo Específico 3 de la tesis).
