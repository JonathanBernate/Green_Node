# Requirements Document

## Introduction

Esta feature reemplaza el cliente MQTT simulado de GreenNode por una red IoT
funcional en un entorno local de demostración (proyecto de grado). Corresponde a
la Tarea 2 de `docs/GUIA_PENDIENTES.md`.

El alcance cubre cinco piezas:

1. Un broker MQTT real (Mosquitto) ejecutándose en Docker en el puerto 1883, sin TLS.
2. Un simulador de nodos IoT en Python (paho-mqtt) que publica periódicamente
   niveles de llenado y estado de los contenedores `c-001` a `c-005`.
3. La activación del cliente MQTT real (`sp-react-native-mqtt`) en la app,
   reemplazando el modo simulado en `MqttClient.ts`.
4. El comportamiento de conexión en tiempo real: reconexión con backoff, QoS por
   tipo de mensaje, rate limiting de clasificaciones y emisión de alertas cuando
   un contenedor alcanza el 90% de llenado.
5. Una verificación de extremo a extremo que confirma el flujo simulador →
   broker → app.

Se respetan la infraestructura y convenciones existentes: URL del broker en
`src/shared/config/environment.ts`, cliente singleton en
`src/data/datasources/remote/mqtt/MqttClient.ts`, formatos de mensaje en
`MqttMessageParser.ts`, topics en `MqttTopics.ts`, y el servicio de alto nivel
`IoTService.ts`.

## Glossary

- **Broker**: Servidor Mosquitto que enruta mensajes MQTT entre publicadores y
  suscriptores, expuesto en `localhost:1883` sin TLS.
- **Simulador**: Script Python (`simulation/iot_node_simulator.py`) que usa
  `paho-mqtt` para publicar telemetría de contenedores virtuales al Broker.
- **Cliente_MQTT**: Cliente MQTT singleton de la app definido en
  `src/data/datasources/remote/mqtt/MqttClient.ts`, basado en
  `sp-react-native-mqtt`.
- **Servicio_IoT**: Servicio de alto nivel `IoTService.ts` que orquesta el
  Cliente_MQTT, la suscripción a topics y la distribución de mensajes a la app.
- **Contenedor**: Entidad `Container` con `fillLevel` (0-100) y `status`
  (`active`, `maintenance`, `offline`, `full`). Los identificadores de la demo son
  `c-001` a `c-005`.
- **Nivel_Llenado**: Valor entero de 0 a 100 que indica el porcentaje de
  ocupación de un Contenedor.
- **Umbral_Alerta**: Valor de Nivel_Llenado igual o superior a 90 que dispara una
  alerta de recolección.
- **QoS**: Nivel de calidad de servicio MQTT (0, 1 o 2) aplicado por tipo de topic.
- **Rate_Limit_Clasificacion**: Restricción de publicación de como máximo una
  clasificación cada 60 segundos.
- **Topic_Fill**: `greennode/containers/{id}/fill` (telemetría de llenado, QoS 0).
- **Topic_Status**: `greennode/containers/{id}/status` (estado del Contenedor, QoS 1).
- **Topic_Alertas**: `greennode/system/alerts` (alertas del sistema, QoS 2).
- **Topic_Clasificacion**: `greennode/users/{userId}/classification` (clasificación
  de residuos publicada por la app, QoS 1).
- **Wildcard_Fill**: `greennode/containers/+/fill`, suscripción de la app a la
  telemetría de todos los Contenedores.
- **Backoff_Reconexion**: Estrategia de reintento con retardo exponencial desde 1
  segundo hasta un máximo de 60 segundos, con un máximo de 10 intentos.

## Requirements

### Requirement 1: Broker MQTT en Docker

**User Story:** Como desarrollador de la demo, quiero un broker MQTT real
corriendo en Docker, para que la app y el simulador intercambien mensajes sin
depender del modo simulado.

#### Acceptance Criteria

1. THE Broker SHALL exponer el servicio MQTT en el puerto 1883 del host local sin
   cifrado TLS.
2. WHEN el desarrollador ejecuta el comando de arranque documentado del Broker,
   THE Broker SHALL aceptar conexiones MQTT v3.1.1 de clientes anónimos.
3. THE feature SHALL incluir un archivo de configuración de Docker versionado que
   arranca el Broker Mosquitto en el puerto 1883.
4. WHERE el desarrollador provee un archivo de configuración de Mosquitto, THE
   Broker SHALL cargar ese archivo al iniciar.
5. IF el puerto 1883 ya está en uso al arrancar el Broker, THEN THE feature SHALL
   documentar el mensaje de error esperado y el procedimiento de resolución.

### Requirement 2: Simulador de nodos IoT en Python

**User Story:** Como desarrollador de la demo, quiero un simulador en Python que
publique telemetría de contenedores al broker, para que la app reciba datos
realistas en tiempo real sin hardware físico.

#### Acceptance Criteria

1. THE Simulador SHALL conectarse al Broker usando la librería `paho-mqtt` en la
   dirección y puerto recibidos por parámetro, con valores por defecto `localhost`
   y `1883`.
2. THE Simulador SHALL modelar los Contenedores `c-001` a `c-005`.
3. WHILE el Simulador está en ejecución, THE Simulador SHALL publicar un mensaje
   de Nivel_Llenado por cada Contenedor en el Topic_Fill correspondiente con una
   periodicidad configurable cuyo valor por defecto es 30 segundos.
4. THE Simulador SHALL publicar cada mensaje de Nivel_Llenado con QoS 0 y un
   payload JSON que contenga los campos `containerId`, `fillLevel`, `temperature`,
   `batteryLevel` y `timestamp`.
5. WHEN el Nivel_Llenado de un Contenedor alcanza o supera el Umbral_Alerta, THE
   Simulador SHALL publicar un mensaje de estado en el Topic_Status con QoS 1 y
   `status` igual a `full`.
6. WHEN el Nivel_Llenado de un Contenedor alcanza o supera el Umbral_Alerta, THE
   Simulador SHALL publicar un mensaje de alerta en el Topic_Alertas con QoS 2 y
   un payload JSON que contenga `alertId`, `type`, `containerId`, `message`,
   `severity` y `timestamp`.
7. IF el Simulador no puede conectarse al Broker al iniciar, THEN THE Simulador
   SHALL registrar un mensaje de error descriptivo que indique la dirección y el
   puerto del Broker.
8. WHEN el desarrollador interrumpe el Simulador, THE Simulador SHALL desconectarse
   del Broker de forma ordenada.

### Requirement 3: Activación del cliente MQTT real en la app

**User Story:** Como desarrollador de la demo, quiero que la app use el cliente
MQTT real en lugar del simulado, para que consuma la telemetría publicada por el
simulador a través del broker.

#### Acceptance Criteria

1. THE Cliente_MQTT SHALL establecer la conexión al Broker mediante la librería
   `sp-react-native-mqtt` usando la URL y el puerto definidos en
   `src/shared/config/environment.ts`.
2. WHEN el Servicio_IoT se inicializa, THE Cliente_MQTT SHALL conectarse al Broker
   y suscribirse al Wildcard_Fill con QoS 0 y al Topic_Alertas con QoS 2.
3. WHEN el Broker entrega un mensaje en un Topic_Fill, THE Servicio_IoT SHALL
   convertir el payload en un objeto `FillLevelMessage` y notificar a los handlers
   de Nivel_Llenado registrados.
4. WHEN el Broker entrega un mensaje en el Topic_Alertas, THE Servicio_IoT SHALL
   convertir el payload en un objeto `SystemAlertMessage` y notificar a los
   handlers de alerta registrados.
5. IF el payload de un mensaje recibido no es JSON válido o carece de los campos
   requeridos, THEN THE Servicio_IoT SHALL descartar el mensaje y registrar una
   advertencia sin interrumpir la conexión.
6. WHERE el desarrollador no ha instalado la librería `sp-react-native-mqtt`, THE
   feature SHALL documentar el comando de instalación requerido.

### Requirement 4: Publicación de clasificaciones con rate limiting

**User Story:** Como usuario de la app, quiero que mis clasificaciones de residuos
se publiquen en la red IoT sin saturar el broker, para que el sistema registre mi
actividad de forma controlada.

#### Acceptance Criteria

1. WHEN la app solicita publicar una clasificación, THE Cliente_MQTT SHALL
   publicar el mensaje en el Topic_Clasificacion con QoS 1.
2. IF una solicitud de publicación de clasificación ocurre antes de que
   transcurran 60 segundos desde la última clasificación publicada, THEN THE
   Cliente_MQTT SHALL rechazar la publicación e informar que fue ignorada por el
   Rate_Limit_Clasificacion.
3. WHEN una clasificación se publica correctamente, THE Cliente_MQTT SHALL
   registrar el instante de la publicación como referencia para el
   Rate_Limit_Clasificacion.
4. IF el Cliente_MQTT no está conectado al Broker al intentar publicar, THEN THE
   Cliente_MQTT SHALL señalar un error de publicación identificando el topic
   afectado.

### Requirement 5: Reconexión con backoff exponencial

**User Story:** Como usuario de la app, quiero que la conexión IoT se restablezca
automáticamente tras una caída, para que la telemetría se reanude sin intervención
manual.

#### Acceptance Criteria

1. IF la conexión con el Broker se pierde de forma no solicitada, THEN THE
   Cliente_MQTT SHALL programar un reintento de conexión siguiendo el
   Backoff_Reconexion.
2. WHILE existan reintentos pendientes por debajo del máximo, THE Cliente_MQTT
   SHALL incrementar el retardo entre reintentos de forma exponencial desde 1
   segundo hasta un máximo de 60 segundos.
3. WHEN el Cliente_MQTT alcanza 10 intentos de reconexión consecutivos fallidos,
   THE Cliente_MQTT SHALL detener los reintentos y registrar el agotamiento de los
   intentos.
4. WHEN el Cliente_MQTT restablece la conexión con el Broker, THE Cliente_MQTT
   SHALL reiniciar el contador de reintentos y re-suscribirse a los topics
   previamente suscritos.
5. WHEN el desarrollador solicita una desconexión explícita, THE Cliente_MQTT
   SHALL cerrar la conexión sin programar reintentos de reconexión.
6. WHEN el estado de conexión del Cliente_MQTT cambia, THE Cliente_MQTT SHALL
   notificar a los handlers de estado de conexión registrados.

### Requirement 6: Alertas de contenedor lleno

**User Story:** Como operador de recolección, quiero recibir una alerta cuando un
contenedor alcanza el 90% de llenado, para poder programar su recolección a tiempo.

#### Acceptance Criteria

1. WHEN un Contenedor alcanza o supera el Umbral_Alerta, THE Simulador SHALL emitir
   una alerta en el Topic_Alertas con `type` igual a `overflow`.
2. WHEN el Nivel_Llenado de un Contenedor está entre 90 y 97 inclusive al momento
   de la alerta, THE Simulador SHALL asignar `severity` igual a `medium`.
3. WHEN el Nivel_Llenado de un Contenedor es igual o superior a 98 al momento de la
   alerta, THE Simulador SHALL asignar `severity` igual a `high`.
4. WHEN el Servicio_IoT recibe una alerta en el Topic_Alertas, THE Servicio_IoT
   SHALL notificar a los handlers de alerta con el `containerId` y la `severity`
   incluidos en el mensaje.

### Requirement 7: Verificación de extremo a extremo

**User Story:** Como desarrollador de la demo, quiero un procedimiento de
verificación de extremo a extremo, para confirmar que el simulador, el broker y la
app funcionan juntos antes de la presentación.

#### Acceptance Criteria

1. THE feature SHALL documentar un procedimiento que arranca el Broker, inicia el
   Simulador y conecta el Cliente_MQTT en secuencia.
2. WHEN el Simulador publica un mensaje de Nivel_Llenado para un Contenedor, THE
   Servicio_IoT SHALL exponer ese Nivel_Llenado actualizado a la app dentro del
   intervalo de publicación del Simulador.
3. WHEN un Contenedor supera el Umbral_Alerta en el Simulador, THE Servicio_IoT
   SHALL entregar la alerta correspondiente a la app.
4. THE procedimiento de verificación SHALL definir el resultado observable
   esperado en cada paso para confirmar el flujo Simulador → Broker → app.
