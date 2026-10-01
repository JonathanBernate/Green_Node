# MQTT: arquitectura y tópicos

## Regla de arquitectura

```
React ──(REST + wss)──▶ Backend ──(MQTT/TLS)──▶ Broker ──▶ Red IoT
```

El navegador **no** se conecta al broker. Hoy el frontend **no usa MQTT real**: en modo simulación,
`lib/iotSimulator.ts` genera telemetría ficticia en el propio navegador (**SIMULADO**) y la interfaz lo
indica ("MQTT: Simulado en el navegador"). Las credenciales del broker viven solo en el backend.

## Tópicos (decisión: se mantiene el espacio `greennode/` ya usado por el simulador Python)

| Tópico (vigente) | Equivalente propuesto | Dirección | QoS |
|---|---|---|---|
| `greennode/containers/{id}/fill` | `waste/{node_id}/telemetry` | Nodo → Broker | 0 |
| `greennode/containers/{id}/status` | `waste/{node_id}/status` | Nodo → Broker | 1 |
| `greennode/users/{userId}/classification` | `waste/{node_id}/classification` | App/Backend → Broker | 1 |
| `greennode/system/alerts` | `waste/{node_id}/alerts` | Nodo → Broker | 2 |
| `greennode/network/metrics` | `network/metrics` | Simulador → Broker | 0 |
| — | `network/events` | Simulador → Broker | 1 |

Especificación de payloads: `docs/MQTT_PROTOCOL.md`. La migración al esquema `waste/…` es opcional y
queda registrada en `docs/decisions.md` (D-02).

## Qué NO se afirma

- TLS cifra el transporte; **no** garantiza seguridad absoluta (autenticación, autorización y gestión de
  credenciales siguen siendo necesarias).
- No se ejecutaron pruebas contra un broker real en este trabajo.
