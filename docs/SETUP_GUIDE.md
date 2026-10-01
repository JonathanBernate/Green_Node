# Guía de Configuración — GreenNode

## Requisitos del Sistema

### Software necesario

| Herramienta | Versión mínima | Propósito |
|-------------|----------------|-----------|
| Node.js | 22.11.0 | Runtime JavaScript |
| npm | 10.x | Gestor de paquetes |
| Python | 3.10+ | Simulador IoT |
| Android Studio | 2024.x | Build Android |
| Xcode | 15+ | Build iOS (solo macOS) |
| JDK | 17 | Compilación Android |
| Git | 2.x | Control de versiones |

### Hardware recomendado (desarrollo)

- RAM: 16 GB mínimo
- Disco: 50 GB libres (SDKs + emuladores)
- CPU: 4+ cores para builds paralelos

---

## Instalación Paso a Paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/<usuario>/t_nvdt_core_fork.git
cd t_nvdt_core_fork/Green_Node
```

### 2. Instalar dependencias de Node.js

```bash
npm install
```

### 3. Configurar Android

1. Abrir Android Studio
2. Instalar SDK 34 (API Level 34)
3. Configurar variable de entorno `ANDROID_HOME`
4. Crear un emulador (API 34, x86_64)

### 4. Configurar iOS (solo macOS)

```bash
# Instalar bundler (una vez)
bundle install

# Instalar CocoaPods
cd ios
bundle exec pod install
cd ..
```

### 5. Configurar simulación Python

```bash
cd simulation
pip install -r requirements.txt
cd ..
```

---

## Variables de Entorno

Crear archivo `.env.development` en la raíz del proyecto:

```env
API_URL=http://localhost:3000/api
MQTT_BROKER_URL=mqtt://localhost
MQTT_PORT=1883
WS_URL=ws://localhost:3000
MAP_API_KEY=tu_google_maps_api_key
TF_MODEL_URL=
ENVIRONMENT=development
```

> Nota: Actualmente las variables están hardcodeadas en `src/shared/config/environment.ts`. Se migrarán a `react-native-config` cuando se instale.

---

## Configurar Broker MQTT Local

### Opción 1: Mosquitto (recomendado)

**Windows:**
1. Descargar de https://mosquitto.org/download/
2. Instalar con opciones por defecto
3. Iniciar servicio: `mosquitto -v`

**Linux/macOS:**
```bash
sudo apt install mosquitto mosquitto-clients  # Ubuntu
brew install mosquitto                         # macOS

# Iniciar
mosquitto -v
```

### Opción 2: Docker

```bash
docker run -d \
  --name mosquitto \
  -p 1883:1883 \
  -p 9001:9001 \
  eclipse-mosquitto:2
```

### Verificar conexión

```bash
# Terminal 1: Suscribir
mosquitto_sub -h localhost -t "greennode/#" -v

# Terminal 2: Publicar
mosquitto_pub -h localhost -t "greennode/test" -m "Hola IoT"
```

---

## Ejecutar la Aplicación

### Metro Bundler

```bash
npm start
```

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

### Web

```bash
npm run web
```

### Simulador IoT

```bash
cd simulation
python iot_node_simulator.py --broker localhost --nodes 50 --interval 30
```

---

## Dependencias Pendientes de Instalar

Estas dependencias se instalarán cuando se integren los módulos nativos correspondientes:

```bash
# Cámara
npm install react-native-vision-camera

# IA (TensorFlow Lite)
npm install react-native-fast-tflite

# MQTT
npm install sp-react-native-mqtt

# Mapas
npm install react-native-maps

# Firebase (auth + push)
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/messaging

# Almacenamiento seguro
npm install react-native-keychain

# Variables de entorno
npm install react-native-config

# Imágenes optimizadas
npm install react-native-fast-image

# Animaciones
npm install react-native-reanimated
```

Después de instalar dependencias nativas, re-ejecutar:
```bash
cd ios && bundle exec pod install && cd ..  # iOS
```

---

## Solución de Problemas

### Metro no inicia

```bash
# Limpiar cache
npx react-native start --reset-cache
```

### Build Android falla

```bash
# Limpiar build
cd android && ./gradlew clean && cd ..
```

### Error de path aliases (@/)

Verificar que `babel.config.js` tiene el plugin `module-resolver`:
```js
['module-resolver', { alias: { '@': './src' } }]
```

### MQTT no conecta

1. Verificar que Mosquitto está corriendo: `mosquitto -v`
2. Verificar puerto: `netstat -an | grep 1883`
3. Verificar firewall no bloquea el puerto

---

## Estructura de Branches

| Branch | Propósito |
|--------|-----------|
| `main` | Código estable, releases |
| `develop` | Integración de features |
| `feature/*` | Features individuales |
| `simulation/*` | Scripts de simulación y análisis |
