# Guía de Pruebas Locales y Simulación — GreenNode

## Resumen

Esta guía describe paso a paso cómo levantar todo el sistema localmente para
probar la aplicación móvil, el broker MQTT, el simulador de nodos IoT y el
analizador de métricas de red.

---

## Requisitos Previos

### Software necesario

| Software | Versión | Descarga |
|----------|---------|----------|
| Node.js | ≥ 22.11 | https://nodejs.org |
| Python | ≥ 3.10 | https://python.org |
| Android Studio | 2024.x | https://developer.android.com/studio |
| Mosquitto | ≥ 2.0 | https://mosquitto.org/download |
| Git | ≥ 2.x | https://git-scm.com |

### Verificar instalaciones

```cmd
node --version
python --version
mosquitto -h
adb devices
```

---

## Paso 1 — Instalar dependencias del proyecto

```cmd
cd Green_Node
npm install
```

Para la simulación Python:

```cmd
cd simulation
pip install paho-mqtt numpy pandas matplotlib seaborn
cd ..
```

---

## Paso 2 — Levantar la App Móvil (modo simulación interna)

La app funciona sin broker externo. Internamente simula MQTT y la IA.

### Terminal 1: Metro Bundler

```cmd
cd Green_Node
npm start
```

### Terminal 2: Emulador Android

```cmd
cd Green_Node
npm run android
```

### Probar la app

1. Esperar a que el emulador abra la app
2. Iniciar sesión: **demo@greennode.co** / **123456**
3. Pestaña **Escanear**: presionar "Escanear Residuo" → ver resultado simulado
4. Pestaña **Mapa**: ver contenedores con niveles que se actualizan cada 15s
5. Pestaña **Historial**: ver clasificaciones realizadas
6. Pestaña **Aprender**: ver micro-lecciones
7. Pestaña **Perfil**: ver estado IoT "Conectado" y estadísticas

> En este modo todo es simulado internamente. No necesitas broker ni Python.

---

## Paso 3 — Levantar Broker MQTT (Mosquitto)

Para conectar el simulador Python con la app, necesitas un broker real.

### Instalar Mosquitto en Windows

1. Descargar el instalador de https://mosquitto.org/download/
2. Ejecutar instalador con opciones por defecto
3. Crear archivo de configuración simple

Crear el archivo `C:\Program Files\Mosquitto\local.conf`:

```
# Configuración para desarrollo local
listener 1883
allow_anonymous true
```

### Terminal 3: Iniciar Mosquitto

```cmd
cd "C:\Program Files\Mosquitto"
mosquitto -v -c local.conf
```

Deberías ver:

```
mosquitto version 2.x.x starting
Opening ipv4 listen socket on port 1883
```

### Verificar que funciona

En otra ventana CMD:

```cmd
:: Suscribir a todos los topics de GreenNode
mosquitto_sub -h localhost -t "greennode/#" -v
```

En otra ventana CMD:

```cmd
:: Publicar un mensaje de prueba
mosquitto_pub -h localhost -t "greennode/test" -m "hola desde GreenNode"
```

Si ves el mensaje en la ventana de suscripción, el broker está listo.

---

## Paso 4 — Ejecutar Simulador de Nodos IoT

El simulador genera datos de 50 contenedores virtuales distribuidos en Bogotá
y los publica vía MQTT al broker local.

### Terminal 4: Simulador

```cmd
cd Green_Node\simulation
python iot_node_simulator.py --broker localhost --port 1883 --nodes 20 --interval 10
```

### Parámetros disponibles

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `--broker` | localhost | IP del broker MQTT |
| `--port` | 1883 | Puerto del broker |
| `--nodes` | 50 | Número de contenedores a simular |
| `--interval` | 30 | Segundos entre reportes |
| `--duration` | 0 | Duración total (0 = infinito) |

### Ejemplo de salida

```
==============================================================
  GreenNode — Simulador de Red IoT
  Nodos: 20 | Intervalo: 10s
  Broker: localhost:1883
==============================================================

[SIM] 20 contenedores generados en Bogotá
[MQTT] Conectado al broker exitosamente

--- Ciclo 1 | Hora simulada: 15:00 ---
  📊 Enviados: 20 | Nivel medio: 42.3% | Llenos: 2/20
  ⚠️  ALERTA: Contenedor c-007 al 96% - requiere recolección urgente

--- Ciclo 2 | Hora simulada: 15:00 ---
  📊 Enviados: 20 | Nivel medio: 43.1% | Llenos: 2/20
  🚛 Contenedor c-007 vaciado
```

### Ejecutar sin broker (solo logs)

Si no tienes Mosquitto instalado, el simulador funciona en modo offline:

```cmd
python iot_node_simulator.py --nodes 10 --interval 5
```

Verás los logs pero no se enviarán mensajes reales.

---

## Paso 5 — Ejecutar Analizador de Métricas de Red

Mientras el simulador está corriendo, el analizador captura todos los mensajes
MQTT y genera reportes con las métricas que necesitas para la tesis.

### Terminal 5: Analizador

```cmd
cd Green_Node\simulation
python network_metrics_analyzer.py --broker localhost --duration 120
```

### Parámetros

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `--broker` | localhost | IP del broker |
| `--port` | 1883 | Puerto |
| `--duration` | 300 | Segundos de captura |
| `--output` | reports | Carpeta de salida |

### Salida generada

Después de la duración especificada, genera:

```
reports/
├── latency_distribution.png     ← Histograma de latencia end-to-end
├── traffic_timeline.png         ← Tráfico MQTT por ciclo
└── fill_levels_timeline.png     ← Nivel de llenado promedio en el tiempo
```

Y en consola muestra:

```
============================================================
  REPORTE DE MÉTRICAS DE RED IoT — GreenNode
============================================================
  Duración de captura: 120 segundos

📊 TRÁFICO
   Total mensajes recibidos: 240
   Fill level updates: 230
   Clasificaciones: 5
   Alertas: 5
   Throughput: 2.00 msg/s
   Tráfico Erlang (aprox): 2.0000 E

⏱️  LATENCIA End-to-End
   Media: 12.3 ms
   Mediana: 8.1 ms
   P95: 45.2 ms
   P99: 78.5 ms

📡 CONFIABILIDAD
   Paquetes enviados: 240
   Paquetes fallidos: 0
   PDR: 100.00%

📈 ESCALABILIDAD
   Nodos activos: 20
   Mensajes/nodo/ciclo: 1.0
```

---

## Paso 6 — Conectar la App al Broker Real (Opcional)

Para que la app reciba datos del simulador Python en tiempo real:

### Editar configuración de entorno

Abrir `src/shared/config/environment.ts` y cambiar:

```typescript
const development: Environment = {
  apiUrl: 'http://localhost:3000/api',
  mqttBrokerUrl: 'mqtt://10.0.2.2',  // IP del host desde emulador Android
  mqttPort: 1883,
  wsUrl: 'ws://localhost:3000',
  mapApiKey: '',
  tfModelUrl: '',
  environment: 'development',
};
```

> **Nota sobre IPs:**
> - Emulador Android: usar `10.0.2.2` (apunta al localhost del host)
> - Dispositivo físico: usar la IP local de tu PC (ej: `192.168.1.100`)
> - Para ver tu IP: `ipconfig` en CMD

### Instalar librería MQTT

```cmd
npm install sp-react-native-mqtt
```

### Descomentar código real en MqttClient.ts

Abrir `src/data/datasources/remote/mqtt/MqttClient.ts` y descomentar las
secciones marcadas con `// TODO:` en el método `connect()`.

---

## Paso 7 — Entrenar Modelo de IA (Google Colab)

### Preparar dataset

1. Descargar TrashNet: https://github.com/garythung/trashnet
2. O usar un dataset propio con la estructura:
```
dataset/
├── organic/     ← imágenes de residuos orgánicos
├── plastic/     ← imágenes de plásticos
├── paper/       ← imágenes de papel/cartón
├── glass/       ← imágenes de vidrio
├── metal/       ← imágenes de metal
└── special/     ← imágenes de residuos especiales
```

### Ejecutar en Colab

1. Ir a https://colab.research.google.com
2. Subir `simulation/train_model.py`
3. Cambiar runtime a GPU: Runtime → Change runtime type → T4 GPU
4. Ejecutar el script
5. Descargar los archivos generados:
   - `waste_classifier_v1.tflite`
   - `labels.json`
   - `confusion_matrix.png`

### Integrar en la app

```cmd
:: Copiar modelo a la app
copy waste_classifier_v1.tflite Green_Node\src\assets\models\
copy labels.json Green_Node\src\assets\models\

:: Instalar librería TFLite
cd Green_Node
npm install react-native-fast-tflite
```

Luego descomentar TODOs en `src/infrastructure/ai/TensorFlowService.ts`.

---

## Resumen de Terminales

Para la demostración completa con todo conectado:

| # | Terminal | Comando | Función |
|---|----------|---------|---------|
| 1 | CMD | `mosquitto -v -c local.conf` | Broker MQTT |
| 2 | CMD | `npm start` | Metro bundler |
| 3 | CMD | `npm run android` | Emulador Android |
| 4 | CMD | `python iot_node_simulator.py --nodes 50 --interval 15` | Simular red IoT |
| 5 | CMD | `python network_metrics_analyzer.py --duration 300` | Capturar métricas |

### Orden de ejecución

1. Primero: Mosquitto (Terminal 1)
2. Segundo: Simulador IoT (Terminal 4)
3. Tercero: Analizador (Terminal 5)
4. Cuarto: Metro + App (Terminales 2 y 3)

---

## Escenarios de Prueba

### Escenario 1: Solo app (sin infraestructura)

- Solo Terminales 2 y 3
- Todo simulado internamente
- Para: desarrollo de UI, testing rápido

### Escenario 2: App + Broker + Simulador

- Terminales 1, 2, 3 y 4
- Datos reales vía MQTT
- Para: demostrar comunicación IoT

### Escenario 3: Demo completa (sustentación)

- Todas las terminales (1-5)
- Genera gráficos de métricas en tiempo real
- Para: sustentación del proyecto de grado

### Escenario 4: Análisis de escalabilidad

```cmd
:: Ejecutar con distintos números de nodos y medir métricas
python iot_node_simulator.py --nodes 50 --interval 30 --duration 300
python iot_node_simulator.py --nodes 100 --interval 30 --duration 300
python iot_node_simulator.py --nodes 200 --interval 30 --duration 300
python iot_node_simulator.py --nodes 500 --interval 30 --duration 300
```

Comparar los reportes generados para cada escala.

---

## Solución de Problemas

### Mosquitto no arranca

```cmd
:: Verificar si el puerto está ocupado
netstat -an | findstr 1883

:: Si hay otro proceso, matarlo
taskkill /F /PID <PID_del_proceso>
```

### Simulador no conecta al broker

```cmd
:: Verificar que Mosquitto está corriendo
mosquitto_pub -h localhost -t test -m "ping"

:: Si no funciona, revisar firewall de Windows
:: Agregar excepción para puerto 1883
```

### App no se conecta al broker desde emulador

- Verificar que usas `10.0.2.2` como IP (no `localhost`)
- Verificar que Mosquitto acepta conexiones externas (`allow_anonymous true`)
- Verificar que el firewall de Windows permite conexiones al puerto 1883

### Metro bundler no encuentra módulos

```cmd
:: Limpiar caché
npx react-native start --reset-cache

:: O reinstalar
rmdir /s /q node_modules
npm install
```

### Errores de build Android

```cmd
cd android
gradlew clean
cd ..
npm run android
```
