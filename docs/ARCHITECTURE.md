# Arquitectura del Sistema GreenNode

## Visión General

GreenNode implementa una arquitectura de tres capas que conecta una aplicación móvil con una red IoT simulada para la gestión inteligente de residuos sólidos urbanos.

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│   App Móvil     │────▶│ Broker MQTT  │◀────│ Nodos IoT        │
│ (React Native)  │◀────│ (Mosquitto)  │────▶│ (Simulador Python)│
└─────────────────┘     └──────────────┘     └──────────────────┘
        │                       │
        │                       ▼
        │               ┌──────────────┐
        └──────────────▶│  Dashboard   │
                        │ (Web/Grafana)│
                        └──────────────┘
```

## Capas de la Aplicación Móvil

### 1. Domain Layer (`src/domain/`)

Capa de lógica de negocio pura. No depende de ningún framework.

**Entidades:**
- `User` — Usuario con puntos, nivel y barrio
- `WasteClassification` — Tipo de residuo (6 clases), confianza, timestamp
- `Container` — Contenedor con ubicación, fill level, estado
- `GeoPoint` — Coordenadas + cálculo Haversine
- `Deposit` — Registro de un depósito en contenedor
- `Badge` — Insignias de gamificación
- `Lesson` — Micro-lecciones educativas

**Interfaces de Repositorio:**
- `IAuthRepository` — Login, registro, refresh token, reset password
- `IClassificationRepository` — Clasificar, historial, sincronizar
- `IContainerRepository` — Obtener cercanos, suscribir fill levels
- `IDepositRepository` — Registrar, historial, estadísticas
- `IGamificationRepository` — Puntos, badges, leaderboard
- `IEducationRepository` — Lecciones, progreso

**Casos de Uso:**
- `LoginUseCase` — Validar y ejecutar login
- `RegisterUseCase` — Validar datos y registrar
- `ClassifyWasteUseCase` — Ejecutar inferencia y evaluar confianza
- `ResetPasswordUseCase` — Enviar correo de recuperación

**Errores:**
- `AppError` — Clase base con code y context
- `AuthError` — InvalidCredentials, EmailInUse, WeakPassword
- `ClassificationError` — ModelNotLoaded, LowConfidence
- `MqttError` — Connection, Publish, Subscribe
- `NetworkError` — Offline, Timeout

### 2. Data Layer (`src/data/`)

Implementaciones concretas de los repositorios y fuentes de datos.

**MQTT (`datasources/remote/mqtt/`):**
- `MqttClient` — Cliente singleton con reconexión exponencial
- `MqttTopics` — Generadores de topics y extractores de IDs
- `MqttMessageParser` — Serialización/deserialización tipada
- `IoTService` — Servicio de alto nivel (publish/subscribe/simulate)

**Repositorios:**
- `AuthRepositoryImpl` — Implementación simulada (preparada para Firebase)

**DI:**
- `container.ts` — Inyección de dependencias centralizada

### 3. Infrastructure Layer (`src/infrastructure/`)

Servicios que dependen de APIs nativas del dispositivo.

**AI (`ai/`):**
- `TensorFlowService` — Carga modelo, ejecuta inferencia, softmax
- `ModelManager` — Ciclo de vida del modelo (load/release/status)
- `ImagePreprocessor` — Resize 224x224, validación URI
- `ClassificationLabels` — Mapeo índice ↔ WasteType

**Camera (`camera/`):**
- `CameraService` — Permisos, configuración, captura

### 4. Presentation Layer (`src/presentation/`)

UI con React Native, organizada por feature.

**Features:**
- `auth/` — Login, Register, ForgotPassword
- `scan/` — ScanScreen, CameraPreview, ClassificationResult
- `map/` — MapScreen (lista + mapa), ContainerDetail
- `history/` — HistoryScreen con stats
- `profile/` — ProfileScreen con estado IoT y logout

**Stores (Zustand):**
- `authStore` — User, tokens, isAuthenticated, acciones async
- `classificationStore` — Modelo, resultado actual, historial local
- `containerStore` — Lista de contenedores, fill levels en tiempo real
- `iotStore` — Estado de conexión MQTT, conteo de publicaciones

---

## Flujo de Datos

### Clasificación de Residuos

```
Usuario toma foto
    │
    ▼
CameraService.capturePhoto()
    │
    ▼
TensorFlowService.classify(imageUri)
    │  ← Inferencia local (offline-capable)
    ▼
ClassifyWasteUseCase.execute()
    │  ← Evalúa confianza, genera ID
    ▼
classificationStore.classifyImage()
    │  ← Actualiza UI + historial
    ▼
iotService.publishClassification()
    │  ← MQTT Publish QoS 1
    ▼
Broker MQTT → Dashboard/Red IoT
```

### Actualización de Contenedores

```
Simulador Python publica fill levels
    │
    ▼
Broker MQTT (topic: greennode/containers/{id}/fill)
    │
    ▼
MqttClient recibe mensaje
    │
    ▼
IoTService.handleIncomingMessage()
    │  ← Parsea payload JSON
    ▼
containerStore.updateFillLevel()
    │  ← Actualiza estado en memoria
    ▼
MapScreen/ContainerDetail re-renderiza
```

---

## Red IoT Simulada

### Topología

```
[Contenedor c-001] ─┐
[Contenedor c-002] ─┤
[Contenedor c-003] ─┼─── Gateway LoRaWAN ─── Broker MQTT ─── Cloud
[Contenedor c-004] ─┤
[Contenedor c-...] ─┘
```

### Tecnologías de comunicación evaluadas

| Tecnología | Banda | Alcance | Tasa | Dispositivos/celda |
|------------|-------|---------|------|--------------------|
| **LoRaWAN** | 915 MHz (ISM) | 2-15 km | 0.3-50 kbps | ~15,000 |
| **NB-IoT** | 700-1900 MHz (licenciada) | 1-10 km | 20-250 kbps | ~50,000 |
| **LTE-M** | LTE bands | 1-5 km | 1 Mbps | ~10,000 |

### Modelos de propagación

- **Okumura-Hata** — Para predicción de pérdida de trayectoria en entornos urbanos
- **COST-231** — Extensión de Hata para frecuencias > 1500 MHz

---

## Gestión de Estado

### Zustand vs alternativas

| Criterio | Redux Toolkit | **Zustand** | Context API |
|----------|---------------|-------------|-------------|
| Boilerplate | Alto | **Mínimo** | Mínimo |
| Performance | Buena | **Excelente** | Mala |
| Persistencia | redux-persist | **Nativa** | No nativa |
| TypeScript | Excelente | **Excelente** | Moderado |
| Tamaño bundle | ~12 KB | **~2 KB** | 0 KB |

### Stores definidos

```typescript
authStore        → user, tokens, isAuthenticated, login/logout
classificationStore → modelStatus, currentResult, history, classifyImage
containerStore   → containers[], updateFillLevel, selectContainer
iotStore         → connectionState, publishCount, alerts
```

---

## Seguridad

| Capa | Mecanismo |
|------|-----------|
| Transporte MQTT | TLS 1.3, cifrado AES-256-GCM |
| Autenticación broker | Certificados X.509 |
| Almacenamiento local | AsyncStorage + react-native-keychain |
| Tokens | JWT con refresh automático |
| Rate limiting | 1 clasificación/minuto por usuario |

---

## Rendimiento

| Operación | Objetivo | Actual |
|-----------|----------|--------|
| Inferencia IA | < 800 ms | Simulado |
| Conexión MQTT | < 2 s | ~500 ms (local) |
| Actualización fill level | < 100 ms | ~15 ms |
| Carga modelo TFLite | < 3 s | Simulado |
| Tamaño modelo | < 10 MB | ~8.5 MB (estimado) |
