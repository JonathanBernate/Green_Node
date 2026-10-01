# Implementation Plan: MQTT IoT Integration

## Overview

Plan de implementación incremental para convertir la capa MQTT simulada de
GreenNode en una red IoT funcional local. Principio rector del diseño:
**activar, no reescribir**. Las tareas siguen este orden: primero el broker
(sin dependencias), luego el simulador Python (que puede probarse contra el
broker de forma aislada), después la activación del cliente MQTT real en la app
y el ajuste de `IoTService`, y finalmente las pruebas y el procedimiento de
verificación end-to-end.

Lenguajes: **Python** (`paho-mqtt`) para el simulador y **TypeScript**
(`sp-react-native-mqtt`) para la app, según se define en el diseño. No se
solicita selección de lenguaje porque el diseño ya los especifica.

Cada sub-tarea de test está marcada con `*` (opcional). Las sub-tareas que
requieren el entorno Android para ejecutar la app RN completa también se marcan
opcionales, ya que ese entorno está pendiente en el proyecto.

## Tasks

- [ ] 1. Crear los archivos del broker Mosquitto
  - [x] 1.1 Crear `mqtt/docker-compose.yml` y `mqtt/mosquitto.conf`
    - Definir el servicio `mosquitto` con imagen `eclipse-mosquitto:2`, mapeo de puerto `1883:1883` y montaje de `./mosquitto.conf` como volumen de solo lectura
    - Configurar `mosquitto.conf` con `listener 1883 0.0.0.0`, `allow_anonymous true`, `persistence false` y logs a stdout
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 1.2 Crear `mqtt/README.md` con el procedimiento de arranque y resolución de errores
    - Documentar el comando de arranque `docker compose up -d` desde la carpeta `mqtt/`
    - Documentar el mensaje de error esperado por puerto 1883 ocupado (`bind: address already in use`) y el procedimiento de resolución (`netstat -ano | findstr 1883` en Windows, detener el proceso o cambiar el mapeo de puerto)
    - Documentar el prerrequisito `npm install sp-react-native-mqtt` para la app
    - _Requirements: 1.5, 3.6_

- [x] 2. Ajustar el simulador de nodos IoT en Python
  - [x] 2.1 Ajustar los valores por defecto de los argumentos CLI del simulador
    - En `simulation/iot_node_simulator.py`, cambiar el defecto de `--nodes` de `50` a `5` para producir exactamente `c-001`..`c-005`
    - Confirmar que `--broker` (`localhost`), `--port` (`1883`) e `--interval` (`30`) conservan sus defectos
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Introducir el umbral de alerta y la función pura `alert_severity`
    - Definir la constante `ALERT_THRESHOLD = 90`
    - Implementar `alert_severity(fill_level)` que devuelva `high` si `fill_level >= 98` y `medium` en caso contrario (para valores en `[90, 97]`)
    - Reemplazar la condición del bucle principal de `fill_level >= 95` por `fill_level >= ALERT_THRESHOLD`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x]* 2.3 Escribir property test para `alert_severity`
    - **Property 4 (P4): Severidad por umbral** — `alert_severity` devuelve `medium` sii `90 <= fill <= 97` y `high` sii `fill >= 98`
    - Usar una librería PBT de Python (p. ej. Hypothesis), mínimo 100 iteraciones, generando `fill_level` en el rango `[0, 100]`
    - Tag: **Feature: mqtt-iot-integration, Property 4: Severidad por umbral**
    - **Validates: Requirements 6.2, 6.3**

  - [x] 2.4 Publicar status (QoS 1) y alerta (QoS 2) al cruzar el umbral
    - Implementar `build_alert(cycle, container)` con `alertId`, `type` (`overflow`), `containerId`, `message`, `severity` (vía `alert_severity`) y `timestamp`
    - En el bucle principal, cuando `fill_level >= ALERT_THRESHOLD`, publicar el payload de status (`containerId`, `status: "full"`, `reason`, `timestamp`) en `greennode/containers/{id}/status` con QoS 1
    - Publicar el payload de alerta en `greennode/system/alerts` con QoS 2
    - Confirmar que el mensaje de fill se sigue publicando cada ciclo con QoS 0 e incluye `containerId`, `fillLevel`, `temperature`, `batteryLevel` y `timestamp`
    - _Requirements: 2.4, 2.5, 2.6, 6.1_

  - [ ]* 2.5 Escribir property test para la condición de alerta
    - **Property 5 (P5): Alerta sii umbral** — se publica alerta para un contenedor sii `fill_level >= 90`
    - Aislar la decisión de publicación en una función pura testeable; generar `fill_level` en `[0, 100]`, mínimo 100 iteraciones
    - Tag: **Feature: mqtt-iot-integration, Property 5: Alerta sii umbral**
    - **Validates: Requirements 2.6, 6.1**

  - [ ]* 2.6 Escribir tests unitarios de conexión y desconexión ordenada del simulador
    - Verificar el mensaje de error descriptivo con host y puerto cuando la conexión al broker falla al iniciar
    - Verificar la desconexión ordenada (`loop_stop` + `disconnect`) ante `KeyboardInterrupt`
    - _Requirements: 2.7, 2.8_

- [ ] 3. Checkpoint - Broker y simulador aislados
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Activar el cliente MQTT real en `MqttClient.ts`
  - [ ] 4.1 Activar la conexión real y el registro de listeners en `connect()`
    - En `src/data/datasources/remote/mqtt/MqttClient.ts`, reemplazar `simulateConnect()` por la creación del cliente `sp-react-native-mqtt` con `uri` `${ENV.mqttBrokerUrl}:${ENV.mqttPort}`, `clientId`, `keepalive`, `reconnect: false` y `clean`
    - Registrar los listeners `connect`/`error` para resolver la promesa de conexión
    - Cablear `on('closed')` a `handleDisconnect()`, `on('error')` al logger y `on('message')` a `handleMessage()`
    - _Requirements: 3.1, 3.2, 5.1_

  - [ ] 4.2 Activar la publicación real en `publish()`
    - Reemplazar el bloque TODO por `this.client.publish(topic, payload, qos, false)`
    - Confirmar que el guard de estado `CONNECTED` que lanza `MqttPublishError(topic)` permanece intacto
    - _Requirements: 4.1, 4.4_

  - [ ] 4.3 Activar la suscripción real en `subscribe()` y `resubscribeAll()`
    - Reemplazar los bloques TODO por `this.client.subscribe(topic, qos)`
    - Confirmar que `resubscribeAll()` recorre `subscribedTopics` para re-suscribir tras una reconexión
    - _Requirements: 3.2, 5.4_

  - [ ] 4.4 Activar la desconexión real en `disconnect()`
    - Invocar `this.client.disconnect()` antes de anular `this.client`
    - Confirmar que `isManualDisconnect = true` impide programar reintentos de reconexión
    - _Requirements: 5.5_

  - [ ]* 4.5 Escribir property test del backoff de reconexión
    - **Property 6 (P6): Backoff acotado y monótono** — los retardos de reconexión son no decrecientes y están en `[1000, 60000]` ms para intentos 0..9
    - Librería PBT de TypeScript (p. ej. fast-check), mínimo 100 iteraciones sobre el número de intento
    - Tag: **Feature: mqtt-iot-integration, Property 6: Backoff acotado y monótono**
    - **Validates: Requirements 5.2**

  - [ ]* 4.6 Escribir property test del rate limit de clasificación
    - **Property 7 (P7): Rate limit de clasificación** — dos publicaciones con separación `< 60s` → la segunda retorna `false`; con `>= 60s` → ambas `true`
    - Generar intervalos de tiempo aleatorios alrededor del umbral de 60s, mínimo 100 iteraciones
    - Tag: **Feature: mqtt-iot-integration, Property 7: Rate limit de clasificación**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 4.7 Escribir property test de no reconexión tras desconexión manual
    - **Property 8 (P8): Sin reconexión tras desconexión manual** — tras `disconnect()` no se programa ningún reintento
    - Simular estados de conexión arbitrarios previos a la desconexión manual, mínimo 100 iteraciones
    - Tag: **Feature: mqtt-iot-integration, Property 8: Sin reconexión tras desconexión manual**
    - **Validates: Requirements 5.5**

- [ ] 5. Ajustar `IoTService.ts` para la suscripción de alertas
  - [ ] 5.1 Cambiar la suscripción al Topic_Alertas a QoS 2
    - En `src/data/datasources/remote/mqtt/IoTService.ts`, cambiar `mqttClient.subscribe(MqttTopics.systemAlerts(), 1)` a QoS `2`
    - Confirmar que `handleIncomingMessage()` enruta fills (vía `extractContainerIdFromTopic`) y alertas (comparando con `systemAlerts()`) y descarta payloads `null`
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ]* 5.2 Escribir property tests de los parsers de mensajes
    - **Property 1 (P1): Round-trip de fill** — `parseFillLevelMessage(serialize(msg))` conserva `containerId` y `fillLevel` para todo mensaje válido
    - **Property 2 (P2): Clamp de fill** — `parseFillLevelMessage` produce siempre `0 <= fillLevel <= 100`
    - **Property 3 (P3): Robustez del parser** — payload inválido produce `null`, nunca excepción
    - Librería PBT de TypeScript, un test por propiedad, mínimo 100 iteraciones cada uno
    - Tags: **Feature: mqtt-iot-integration, Property 1/2/3**
    - **Validates: Requirements 3.3, 3.5**

  - [ ]* 5.3 Escribir tests unitarios de enrutamiento y notificación de alertas
    - Verificar que al recibir una alerta en el Topic_Alertas se notifica a los handlers con `containerId` y `severity`
    - Verificar el descarte de un payload inválido sin interrumpir la conexión (traza `logger.warn`)
    - _Requirements: 3.5, 6.4_

- [ ] 6. Checkpoint - Cliente y servicio activados
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Procedimiento de verificación end-to-end
  - [ ] 7.1 Crear un script suscriptor de verificación en Python (`simulation/verify_e2e.py`)
    - Suscribirse a `greennode/#` con `paho-mqtt` e imprimir los mensajes recibidos por topic
    - Confirmar la recepción de fills de `c-001`..`c-005` y de alertas en `greennode/system/alerts` con `containerId` + `severity`
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ] 7.2 Documentar el procedimiento de verificación end-to-end
    - Escribir en `mqtt/README.md` (o `simulation/README.md`) la secuencia: arrancar broker → arrancar simulador → conectar suscriptor/app, con el resultado observable esperado en cada paso
    - _Requirements: 7.1, 7.4_

  - [ ]* 7.3 Validar el flujo completo con la app React Native (requiere entorno Android)
    - Ejecutar la app en el emulador/dispositivo Android, suscribir a `greennode/containers/+/fill` y confirmar que `onFillLevelUpdate` recibe actualizaciones dentro del intervalo del simulador y que `onAlert` recibe las alertas
    - _Requirements: 7.2, 7.3_

- [ ] 8. Checkpoint final - Verificación end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido; incluyen tests unitarios, property tests y la validación que requiere el entorno Android (7.3).
- Cada tarea referencia sub-requisitos específicos para trazabilidad.
- Los checkpoints aseguran validación incremental: broker+simulador aislados, cliente+servicio activados, y flujo end-to-end.
- Los property tests validan las propiedades de correctitud P1–P8 del diseño; los tests unitarios cubren ejemplos y casos borde.
- Principio del diseño: activar los bloques `TODO`/`SIMULACIÓN` existentes, no reescribir la lógica ya implementada (state machine, backoff, rate limiting, parser).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "4.1"] },
    { "id": 2, "tasks": ["2.3", "2.4", "4.2", "4.3", "4.4", "5.1"] },
    { "id": 3, "tasks": ["2.5", "2.6", "4.5", "4.6", "4.7", "5.2", "5.3"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["7.2"] },
    { "id": 6, "tasks": ["7.3"] }
  ]
}
```
