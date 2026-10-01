# Broker MQTT — GreenNode (demo local)

Broker MQTT **Eclipse Mosquitto** ejecutándose en **Docker** para la red IoT de
GreenNode. Escucha en el puerto **1883**, **sin TLS**, con acceso **anónimo**. Es
un entorno de demostración local (proyecto de grado): no usar en producción.

- Puerto: `1883` (MQTT v3.1.1, sin cifrado)
- Autenticación: anónima (`allow_anonymous true`)
- Persistencia: desactivada

## Prerrequisito

- **Docker Desktop** instalado y en ejecución.

## Arranque del broker

Desde la carpeta `mqtt/`:

```bash
cd mqtt
docker compose up -d
```

Ver los logs en vivo:

```bash
docker compose logs -f
```

Detener el broker:

```bash
docker compose down
```

## Verificar que está corriendo

```bash
docker ps --filter name=greennode-mosquitto
```

Debe aparecer el contenedor `greennode-mosquitto` con estado `Up` y el mapeo
`0.0.0.0:1883->1883/tcp`. En los logs (`docker compose logs -f`) verás una línea
del tipo `mosquitto version 2.x running`.

## Resolución de error: puerto 1883 ocupado (Req 1.5)

Si otro proceso ya usa el puerto 1883, `docker compose up` falla con un mensaje
del tipo:

```
bind: address already in use
```

Procedimiento en **Windows** para resolverlo:

1. Identificar el proceso que ocupa el puerto:

   ```powershell
   netstat -ano | findstr 1883
   ```

   La última columna de la salida es el **PID** del proceso.

2. Detener ese proceso (por ejemplo con el Administrador de tareas, o
   `taskkill /PID <PID> /F`), **o bien**

3. Cambiar el mapeo de puerto en `docker-compose.yml`. Por ejemplo, exponer el
   broker en el puerto `1884` del host:

   ```yaml
   ports:
     - "1884:1883"   # host:contenedor
   ```

   Si cambias el puerto del host, recuerda ajustar la configuración del cliente
   (URL/puerto del broker) y del simulador (`--port`) en consecuencia.

## Prerrequisito de la app React Native (Req 3.6)

El cliente MQTT real de la app usa la librería `sp-react-native-mqtt`. Instálala
antes de compilar la app:

```bash
npm install sp-react-native-mqtt
```

## Correr el simulador contra el broker

El simulador de nodos IoT publica telemetría de los contenedores `c-001`..`c-005`
al broker. Requiere `paho-mqtt`:

```bash
pip install paho-mqtt
python simulation/iot_node_simulator.py --nodes 5 --interval 30
```

Parámetros por defecto: `--broker localhost`, `--port 1883`, `--nodes 5`,
`--interval 30` (segundos entre ciclos de publicación).

## Nota

La infraestructura (broker + simulador) ya fue verificada funcionando de forma
aislada. La integración completa con la app React Native requiere el entorno
Android (JDK 17 + SDK), pendiente en el proyecto. Para validar el flujo MQTT sin
Android puede usarse MQTT Explorer o un script suscriptor `paho-mqtt`.

## Verificación end-to-end

Procedimiento para confirmar el flujo **Simulador → Broker → suscriptor** antes
de la presentación (Req 7.1, 7.4). Usa el script `simulation/verify_e2e.py`, que
se suscribe a `greennode/#` y clasifica los mensajes por tipo (fill, status,
alert, metrics). Requiere tres terminales.

**Prerrequisito:** `pip install paho-mqtt`.

1. **(Terminal 1) Arrancar el broker.**

   ```bash
   cd mqtt && docker compose up -d
   ```

   *Resultado esperado:* `docker ps --filter name=greennode-mosquitto` muestra el
   contenedor `greennode-mosquitto` con estado `Up`.

2. **(Terminal 2) Arrancar el suscriptor de verificación.**

   ```bash
   python simulation/verify_e2e.py --seconds 20
   ```

   *Resultado esperado:* imprime `[MQTT] Conectado. Suscribiendo a 'greennode/#'`
   y queda a la escucha 20 segundos.

3. **(Terminal 3) Arrancar el simulador.**

   ```bash
   python simulation/iot_node_simulator.py --nodes 5 --interval 3
   ```

   *Resultado esperado:* por cada ciclo imprime `Enviados: 5` y publica la
   telemetría de `c-001`..`c-005`.

4. **Resultado observable final.** En la Terminal 2, el suscriptor imprime líneas
   `[FILL]` de `c-001`..`c-005` y, al agotarse el tiempo, un resumen donde
   `fills > 0`. Si algún contenedor supera el umbral del 90%, aparecen además
   líneas `[STATUS]` con `status=full` y `[ALERT]` con `severity` (Req 6.4, 7.3).

> El flujo ya fue verificado con éxito de forma aislada: se recibieron 5 mensajes
> `fill` (uno por contenedor) más las `metrics` de red. La lógica de alertas usa
> el umbral 90 con severidad `medium` en el rango `[90, 97]` y `high` a partir de
> `>= 98`. La integración con la app React Native completa requiere el entorno
> Android (JDK 17 + SDK), pendiente en el proyecto; este suscriptor cubre la
> verificación del transporte MQTT sin depender de la UI.
