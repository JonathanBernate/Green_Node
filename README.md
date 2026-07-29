# 🌱 GreenNode — Gestión Inteligente de Residuos Sólidos

Aplicación móvil React Native con clasificación de residuos mediante IA, comunicación IoT vía MQTT y monitoreo de contenedores inteligentes en tiempo real.

**Proyecto de Grado** — Universidad Distrital Francisco José de Caldas  
Ingeniería en Telecomunicaciones | Facultad Tecnológica

> *Diseño y evaluación de una arquitectura de red AD-HOC basada en IoT para un sistema de gestión inteligente de residuos sólidos con integración de una aplicación de asistencia al usuario*

---

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Módulos Principales](#módulos-principales)
- [Simulación IoT](#simulación-iot)
- [Configuración MQTT](#configuración-mqtt)
- [Equipo](#equipo)

---

## Descripción

GreenNode es una aplicación móvil que permite a los ciudadanos clasificar residuos sólidos mediante inteligencia artificial y consultar el estado de contenedores inteligentes en su zona. La app se integra con una red IoT simulada (LoRaWAN/NB-IoT) mediante el protocolo MQTT sobre TLS.

### Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| 📷 **Clasificación con IA** | Captura imagen → modelo MobileNetV2 (TFLite) → 6 categorías de residuo |
| 🗺️ **Mapa de contenedores** | Visualización en tiempo real del nivel de llenado vía MQTT |
| 📋 **Historial** | Registro de clasificaciones con confianza y estado de sincronización |
| 👤 **Perfil y gamificación** | Puntos, niveles, estadísticas del usuario |
| 🔗 **Red IoT** | Comunicación MQTT con broker central, publicación de datos |
| 📚 **Educación** | Micro-lecciones sobre separación de residuos (próximamente) |

---

## Arquitectura

El proyecto sigue **Clean Architecture** con organización Feature-First:

```
┌──────────────────────────────────────────────────────┐
│                   PRESENTATION                        │
│  Screens, Components, Stores (Zustand), Hooks         │
├──────────────────────────────────────────────────────┤
│                     DOMAIN                            │
│  Entities, Repository Interfaces, Use Cases, Errors   │
├──────────────────────────────────────────────────────┤
│                      DATA                             │
│  Repository Impls, MQTT Client, API Client, Mappers   │
├──────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE                         │
│  TensorFlow Lite, Camera, Location, Notifications     │
└──────────────────────────────────────────────────────┘
```

### Principios aplicados

- **SOLID** — Cada servicio tiene una responsabilidad; dependencias inyectadas vía interfaces
- **Clean Architecture** — El dominio no depende de frameworks; capas externas dependen del dominio
- **Offline-First** — Modelo IA local; datos se cachean y sincronizan
- **Feature-First** — Código organizado por funcionalidad, no por tipo de archivo

---

## Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Framework | React Native 0.86 + Expo |
| Lenguaje | TypeScript (strict) |
| Estado | Zustand con persist (AsyncStorage) |
| Navegación | React Navigation 7 (Stack + Bottom Tabs) |
| IA | TensorFlow Lite (MobileNetV2, 6 clases) |
| Comunicación IoT | MQTT v3.1.1 + TLS 1.3 |
| Backend simulado | Python (paho-mqtt, numpy) |
| Mapas | react-native-maps (Google Maps SDK) |
| Cámara | react-native-vision-camera |
| Plataforma | Android + iOS + Web (Vite) |

---

## Estructura del Proyecto

```
Green_Node/
├── src/
│   ├── domain/                  # Capa de dominio (lógica pura)
│   │   ├── entities/            # User, Container, WasteClassification, etc.
│   │   ├── repositories/        # Interfaces (contratos)
│   │   ├── usecases/            # Casos de uso (auth, classification)
│   │   └── errors/              # Errores tipados (Auth, MQTT, Network)
│   │
│   ├── data/                    # Capa de datos
│   │   ├── repositories/        # Implementaciones de interfaces
│   │   ├── datasources/remote/mqtt/  # Cliente MQTT, Topics, Parsers, IoTService
│   │   └── di/                  # Inyección de dependencias
│   │
│   ├── infrastructure/          # Servicios nativos
│   │   ├── ai/                  # TensorFlow, ModelManager, Preprocessor
│   │   └── camera/              # CameraService
│   │
│   ├── presentation/            # Capa de UI
│   │   ├── features/            # Módulos por funcionalidad
│   │   │   ├── auth/            # Login, Register, ForgotPassword
│   │   │   ├── scan/            # ScanScreen, Camera, Result
│   │   │   ├── map/             # MapScreen, ContainerDetail
│   │   │   ├── history/         # HistoryScreen
│   │   │   └── profile/         # ProfileScreen
│   │   ├── store/               # Zustand stores (auth, classification, container, iot)
│   │   └── components/          # UI kit reutilizable (Button, Card, Input, Typography)
│   │
│   ├── shared/                  # Utilidades compartidas
│   │   ├── config/              # environment.ts, mqtt.ts
│   │   ├── constants/           # colors, spacing, typography
│   │   ├── hooks/               # useIoTConnection
│   │   ├── utils/               # validate, logger
│   │   └── types/               # navigation.types.ts
│   │
│   └── main/                    # Entrada y navegación
│       ├── navigation/          # RootNavigator, AuthNavigator, Tabs, Stacks
│       └── providers/           # AppProviders, ThemeProvider
│
├── simulation/                  # Simulador Python de nodos IoT
│   ├── iot_node_simulator.py    # 50 contenedores virtuales en Bogotá
│   ├── requirements.txt
│   └── README.md
│
├── android/                     # Proyecto nativo Android (Kotlin)
├── ios/                         # Proyecto nativo iOS
├── web/                         # App web complementaria (Vite + React)
└── package.json
```

---

## Instalación

### Requisitos previos

- Node.js >= 22.11.0
- npm o yarn
- Android Studio (para Android) o Xcode (para iOS)
- Python 3.10+ (para simulación IoT)

### Pasos

```bash
# 1. Clonar repositorio
git clone <url-del-repo>
cd Green_Node

# 2. Instalar dependencias JS
npm install

# 3. (iOS) Instalar pods
cd ios && bundle exec pod install && cd ..

# 4. (Simulación) Instalar dependencias Python
cd simulation
pip install -r requirements.txt
cd ..
```

---

## Ejecución

### App Móvil

```bash
# Iniciar Metro bundler
npm start

# Android (en otra terminal)
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Simulador IoT

```bash
cd simulation

# Con broker local (Mosquitto)
python iot_node_simulator.py --broker localhost --port 1883 --nodes 50 --interval 30

# Solo logs (sin broker)
python iot_node_simulator.py --nodes 20 --interval 5
```

### Credenciales de prueba

| Email | Contraseña |
|-------|------------|
| demo@greennode.co | 123456 |

---

## Módulos Principales

### 1. Clasificación con IA

- **Modelo:** MobileNetV2 con transfer learning (TensorFlow Lite)
- **Clases:** Orgánico, Plástico, Papel/Cartón, Vidrio, Metal, Residuo Especial
- **Inferencia:** En dispositivo (offline), < 800ms
- **Precisión objetivo:** ≥ 92%

### 2. Comunicación MQTT

- **Broker:** Mosquitto / EMQX con TLS (puerto 8883)
- **QoS:** 1 para clasificaciones, 0 para fill levels, 2 para alertas
- **Reconexión:** Backoff exponencial (1s → 60s max)
- **Rate limiting:** 1 clasificación por minuto

**Topics:**
```
greennode/users/{userId}/classification    → Clasificaciones (QoS 1)
greennode/containers/{id}/fill             → Niveles de llenado (QoS 0)
greennode/containers/{id}/status           → Estado del nodo (QoS 1)
greennode/system/alerts                    → Alertas críticas (QoS 2)
greennode/network/metrics                  → Métricas de red (QoS 0)
```

### 3. Contenedores Inteligentes (Simulados)

- 8 contenedores pre-configurados en localidades de Bogotá
- Niveles de llenado actualizados cada 15s vía MQTT
- Estados: Activo, Lleno, Mantenimiento, Offline
- Alertas automáticas al superar 95% de capacidad

### 4. Simulador de Red IoT

- Python con paho-mqtt
- Genera datos de 50 nodos distribuidos en Bogotá
- Modela patrones de llenado por hora del día (picos 7-9am, 5-7pm)
- Simula consumo de batería y temperatura
- Genera alertas de desbordamiento

---

## Configuración MQTT

El archivo `src/shared/config/environment.ts` contiene la configuración por ambiente:

| Ambiente | Broker | Puerto | TLS |
|----------|--------|--------|-----|
| Development | localhost | 1883 | No |
| Staging | mqtt.greennode.co | 8883 | Sí |
| Production | mqtt.greennode.co | 8883 | Sí |

Para usar un broker local:
```bash
# Instalar Mosquitto
# Windows: https://mosquitto.org/download/
# Linux: sudo apt install mosquitto mosquitto-clients

# Iniciar
mosquitto -v
```

---

## Equipo

| Rol | Nombre | Código |
|-----|--------|--------|
| Investigador | Jonathan Steven Bernate Real | 20232373030 |
| Investigador | John Fredy Gómez González | 20231373017 |
| Director | Ing. Henry Alberto Hernández Martínez | — |

**Programa:** Ingeniería en Telecomunicaciones  
**Universidad:** Distrital Francisco José de Caldas — Facultad Tecnológica  
**Año:** 2026

---

## Licencia

Proyecto académico — Universidad Distrital Francisco José de Caldas.
