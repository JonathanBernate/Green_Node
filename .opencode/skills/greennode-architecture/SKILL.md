---
name: greennode-architecture
description: "Use ONLY when working on the GreenNode project: a React Native app for smart waste management with IoT, MQTT, TensorFlow Lite AI classification, and gamification. Applies Clean Architecture, SOLID, TypeScript strict typing, and Feature-First organization. Trigger on any code generation, refactoring, or architecture question about this project."
---

# GreenNode — Arquitectura del Proyecto

## Contexto del Proyecto

Aplicación React Native (0.86.0) para proyecto de grado:
**"Diseño y evaluación de una arquitectura de red AD-HOC basada en IoT para un sistema de gestión inteligente de residuos sólidos con integración de una aplicación de asistencia al usuario"**

La app forma parte de un sistema de gestión inteligente de residuos sólidos urbanos: contenedores inteligentes simulados, red IoT LoRaWAN/NB-IoT, broker MQTT sobre TLS.

### Funcionalidades Principales

1. **Captura y clasificación de residuos con IA** — Foto → MobileNetV2/YOLOv8-nano (TFLite en dispositivo) → tipo de material (orgánico, plástico, papel, vidrio, metal, residuo especial)
2. **Envío MQTT/TLS** — Publicación de clasificaciones hacia la red IoT simulada
3. **Mapa de contenedores** — Nivel de llenado en tiempo real via WebSocket/MQTT, SDK de mapas
4. **Historial de depósitos** — Fecha, tipo, contenedor, confianza de clasificación
5. **Módulo educativo** — Micro-lecciones 60-90s, feedback personalizado, notificaciones push
6. **Gamificación** — Puntos, niveles, insignias, rankings por barrio/zona
7. **Chatbot de asistencia** — Dominio cerrado para preguntas frecuentes
8. **Perfil con autenticación** — Login, registro, preferencias
9. **Modo offline** — Modelo IA local, sincronización cuando hay conexión

---

## Arquitectura: Feature-First (Modular)

Separación clara en capas:

- **`src/domain/`** — Entidades, interfaces de repositorios, casos de uso (lógica pura, sin dependencias de React Native)
- **`src/data/`** — Implementación de repositorios, fuentes de datos remotas (MQTT, REST) y locales (AsyncStorage)
- **`src/infrastructure/`** — Servicios nativos (cámara, TensorFlow, geolocalización, notificaciones)
- **`src/presentation/`** — Componentes React, pantallas, hooks personalizados, stores Zustand
- **`src/shared/`** — Utilidades, constantes, estilos, configuración por ambiente
- **`src/app/`** — Navegación, providers, App.tsx

### Principios Aplicados

| Principio | Aplicación |
|-----------|------------|
| **SOLID** | Cada servicio = 1 responsabilidad; dependencias de abstracciones (interfaces), no concretas |
| **Clean Architecture** | Dominio no depende de nada; data depende del dominio; presentation depende del dominio y data |
| **DRY** | Componentes/hooks reutilizables; utilidades compartidas |
| **Separación de Concerns** | Lógica de negocio en `use cases`, UI en pantallas, servicios en módulos aislados |
| **Offline-First** | Modelo IA local; datos se cachean y sincronizan |

---

## Diagrama de Carpetas

```
src/
├── app/
│   ├── App.tsx                          # Componente raíz
│   ├── navigation/
│   │   ├── RootNavigator.tsx            # Auth vs Main
│   │   ├── AuthNavigator.tsx            # Stack de autenticación
│   │   ├── MainTabNavigator.tsx         # Tabs principales (5 tabs)
│   │   ├── ScanStack.tsx                # Stack escaneo
│   │   ├── MapStack.tsx                 # Stack mapa
│   │   ├── HistoryStack.tsx             # Stack historial
│   │   ├── EducationStack.tsx           # Stack educación
│   │   └── ProfileStack.tsx             # Stack perfil
│   └── providers/
│       ├── AppProviders.tsx             # Wrapper de providers
│       └── ThemeProvider.tsx            # Tema claro/oscuro
│
├── domain/
│   ├── entities/                        # Entidades del negocio
│   │   ├── User.ts
│   │   ├── WasteClassification.ts       # WasteType, WASTE_TYPE_LABELS, WASTE_TYPE_COLORS
│   │   ├── Container.ts                 # FillLevel, FILL_LEVEL_COLORS, getFillLevelCategory
│   │   ├── GeoPoint.ts                  # GeoPoint, GeoPosition
│   │   ├── Deposit.ts
│   │   ├── Badge.ts                     # GamificationState
│   │   ├── Lesson.ts
│   │   └── ChatMessage.ts
│   ├── repositories/                    # Interfaces (contratos)
│   │   ├── IAuthRepository.ts           # AuthResult, TokenPair, RegisterData
│   │   ├── IClassificationRepository.ts # ClassificationFilter
│   │   ├── IContainerRepository.ts
│   │   ├── IDepositRepository.ts        # DepositStats, DepositFilter
│   │   ├── IGamificationRepository.ts   # LeaderboardEntry
│   │   └── IEducationRepository.ts
│   ├── usecases/                        # Casos de uso
│   │   ├── auth/                        # LoginUseCase, RegisterUseCase, LogoutUseCase
│   │   ├── classification/              # ClassifyWasteUseCase, GetClassificationHistoryUseCase
│   │   ├── container/                   # GetNearbyContainersUseCase, GetContainerFillLevelUseCase
│   │   ├── deposit/                     # RegisterDepositUseCase, GetDepositHistoryUseCase
│   │   ├── gamification/                # GetPointsUseCase, GetBadgesUseCase, GetLeaderboardUseCase
│   │   ├── education/                   # GetNextLessonUseCase, MarkLessonCompleteUseCase
│   │   └── chat/                        # SendMessageUseCase
│   └── errors/                          # Clases de error del dominio
│       ├── AppError.ts                  # Clase base
│       ├── ClassificationError.ts       # ModelNotLoaded, ModelLoad, ImagePreprocessing
│       ├── MqttError.ts                 # Connection, Publish, Subscribe
│       └── NetworkError.ts              # Offline, Timeout
│
├── data/
│   ├── repositories/                    # Implementaciones de interfaces
│   │   ├── AuthRepositoryImpl.ts
│   │   ├── ClassificationRepositoryImpl.ts
│   │   ├── ContainerRepositoryImpl.ts
│   │   └── DepositRepositoryImpl.ts
│   ├── datasources/
│   │   ├── remote/
│   │   │   ├── mqtt/
│   │   │   │   ├── MqttClient.ts        # Cliente MQTT singleton, reconexión backoff exponencial
│   │   │   │   ├── MqttTopics.ts        # Funciones para generar topics
│   │   │   │   └── MqttMessageParser.ts # parseClassificationMessage, parseFillLevelMessage
│   │   │   ├── api/
│   │   │   │   ├── apiClient.ts         # Cliente HTTP base con auth y timeout
│   │   │   │   └── authApi.ts
│   │   │   └── websocket/
│   │   │       └── WebSocketClient.ts
│   │   └── local/
│   │       ├── storage/
│   │       │   └── AsyncStorageWrapper.ts  # Wrapper tipado
│   │       └── cache/
│   │           └── ImageCache.ts
│   └── mappers/                         # DTO ↔ Entity
│       ├── UserMapper.ts
│       ├── ClassificationMapper.ts
│       ├── ContainerMapper.ts
│       └── DepositMapper.ts
│
├── infrastructure/
│   ├── ai/
│   │   ├── TensorFlowService.ts         # Servicio de inferencia TFLite
│   │   ├── ModelManager.ts              # Descarga, carga, caché del modelo
│   │   ├── ImagePreprocessor.ts         # Resize, normalize para el modelo
│   │   └── ClassificationLabels.ts      # LABEL_TO_INDEX, INDEX_TO_LABEL
│   ├── camera/
│   │   └── CameraService.ts            # Captura, permisos, optimización
│   ├── location/
│   │   └── LocationService.ts          # Geolocalización, distancia Haversine
│   ├── notifications/
│   │   ├── PushNotificationService.ts   # FCM, registro, tokens
│   │   └── NotificationHandler.ts       # Mapeo categoría → pantalla
│   └── background/
│       ├── BackgroundTaskService.ts     # Tareas programadas en background
│       └── SyncService.ts              # Sincronización offline → online
│
├── presentation/
│   ├── features/                        # Organizado por feature/módulo
│   │   ├── auth/
│   │   │   ├── screens/                 # LoginScreen, RegisterScreen, ForgotPasswordScreen
│   │   │   ├── components/
│   │   │   └── hooks/                   # useLogin, useRegister
│   │   ├── scan/
│   │   │   ├── screens/                 # ScanScreen, CameraPreviewScreen, ClassificationResultScreen
│   │   │   ├── components/              # CameraView, ClassificationOverlay, ConfidenceBar, ScanButton
│   │   │   └── hooks/                   # useCamera, useClassification
│   │   ├── map/
│   │   │   ├── screens/                 # MapScreen, ContainerDetailScreen
│   │   │   ├── components/              # MapView, ContainerMarker, FillLevelBadge, ContainerBottomSheet
│   │   │   └── hooks/                   # useContainers, useLocation, useContainerSubscription
│   │   ├── history/
│   │   │   ├── screens/                 # HistoryScreen, DepositDetailScreen
│   │   │   ├── components/              # DepositListItem, HistoryFilter, HistoryStats
│   │   │   └── hooks/                   # useDepositHistory
│   │   ├── education/
│   │   │   ├── screens/                 # LessonListScreen, LessonDetailScreen, FeedbackScreen
│   │   │   ├── components/              # LessonCard, LessonProgress, FeedbackCarousel
│   │   │   └── hooks/                   # useLessons
│   │   ├── gamification/
│   │   │   ├── screens/                 # GamificationScreen, LeaderboardScreen
│   │   │   ├── components/              # PointsDisplay, LevelProgressBar, BadgeGrid, LeaderboardItem
│   │   │   └── hooks/                   # useGamification, useLeaderboard
│   │   ├── chat/
│   │   │   ├── screens/                 # ChatScreen
│   │   │   ├── components/              # ChatBubble, ChatInput, QuickReplies, TypingIndicator
│   │   │   └── hooks/                   # useChat
│   │   └── profile/
│   │       ├── screens/                 # ProfileScreen, EditProfileScreen, SettingsScreen
│   │       ├── components/              # ProfileHeader, StatsCard, NotificationSettings
│   │       └── hooks/                   # useProfile, useSettings
│   ├── store/                           # Zustand stores
│   │   ├── index.ts                     # Re-exportación
│   │   ├── authStore.ts                 # persist middleware
│   │   ├── classificationStore.ts
│   │   ├── containerStore.ts
│   │   ├── depositStore.ts
│   │   ├── gamificationStore.ts
│   │   ├── educationStore.ts
│   │   ├── chatStore.ts
│   │   └── settingsStore.ts            # persist middleware
│   └── components/                      # Componentes globales reutilizables
│       ├── ui/
│       │   ├── Button/                  # ButtonPrimary, ButtonSecondary, ButtonIcon
│       │   ├── Card/                    # Card (default, elevated, outlined)
│       │   ├── Input/                   # TextInput, SearchInput
│       │   ├── Typography/              # Heading, Body, Caption
│       │   ├── Avatar/
│       │   ├── Badge/
│       │   ├── Icon/
│       │   ├── Loading/                 # Spinner, LoadingOverlay, SkeletonLoader
│       │   ├── EmptyState/
│       │   ├── ErrorState/
│       │   ├── Toast/
│       │   └── Modal/                   # BottomSheet, Dialog
│       ├── layout/
│       │   ├── ScreenContainer.tsx      # SafeAreaView wrapper
│       │   ├── Spacer.tsx
│       │   └── Header.tsx
│       └── feedback/
│           └── ClassificationFeedback.tsx
│
├── shared/
│   ├── constants/
│   │   ├── colors.ts                    # Paleta completa incluyendo waste colors
│   │   ├── typography.ts               # Estilos de texto
│   │   ├── spacing.ts                   # Espaciado (xs=4 a huge=48)
│   │   ├── dimensions.ts               # Screen size, borderRadius, iconSize
│   │   └── api.ts                       # Timeouts, límites
│   ├── theme/
│   │   ├── lightTheme.ts               # Theme type
│   │   └── darkTheme.ts
│   ├── hooks/
│   │   ├── useNetworkStatus.ts         # NetInfo
│   │   ├── useDebounce.ts
│   │   ├── useInterval.ts
│   │   ├── useAppState.ts              # Foreground/background
│   │   └── usePermissions.ts           # Permisos nativos
│   ├── utils/
│   │   ├── formatDate.ts               # formatDate, formatDateTime, formatRelativeTime
│   │   ├── formatNumber.ts             # formatPoints, formatConfidence, formatDistance
│   │   ├── validate.ts                 # isValidEmail, isValidPassword
│   │   ├── platform.ts                 # isIOS, isAndroid
│   │   └── logger.ts                   # Logger configurable por ambiente
│   ├── types/
│   │   ├── navigation.types.ts         # Todas las param list de navegación
│   │   └── environment.d.ts            # Tipos para react-native-config
│   └── config/
│       ├── environment.ts              # ENV por ambiente (dev/staging/prod)
│       └── mqtt.ts                      # Config MQTT
│
└── assets/
    ├── images/
    │   ├── onboarding/
    │   ├── badges/
    │   ├── empty-states/
    │   └── icons/
    ├── fonts/
    └── models/
        ├── waste_classifier_v1.tflite
        └── labels.json
```

---

## Listado de Pantallas

### Estructura de Navegación

```
RootNavigator
├── AuthStack (no autenticado)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ForgotPasswordScreen
│
└── MainTabs (autenticado) — 5 tabs
    ├── ScanTab → ScanStack
    │   ├── ScanScreen (Home)
    │   ├── CameraPreviewScreen
    │   └── ClassificationResultScreen
    │
    ├── MapTab → MapStack
    │   ├── MapScreen
    │   └── ContainerDetailScreen
    │
    ├── HistoryTab → HistoryStack
    │   ├── HistoryScreen
    │   └── DepositDetailScreen
    │
    ├── EducationTab → EducationStack
    │   ├── LessonListScreen
    │   ├── LessonDetailScreen
    │   └── FeedbackScreen
    │
    └── ProfileTab → ProfileStack
        ├── ProfileScreen
        ├── GamificationScreen
        ├── LeaderboardScreen
        ├── ChatScreen
        ├── EditProfileScreen
        └── SettingsScreen
```

### Descripción de Pantallas

| Pantalla | Descripción |
|----------|-------------|
| **LoginScreen** | Email + password, opción biometría |
| **RegisterScreen** | Nombre, email, password, barrio/zona |
| **ForgotPasswordScreen** | Recuperación por email |
| **ScanScreen** | Botón de escaneo grande, último resultado, estado de conexión |
| **CameraPreviewScreen** | Preview cámara con overlay rectangular de guía |
| **ClassificationResultScreen** | Imagen, tipo identificado, confianza, confirmar/corregir, consejo |
| **MapScreen** | Mapa con markers de contenedores, fill level color-coded, filtros |
| **ContainerDetailScreen** | Dirección, horario, nivel actual, capacidad |
| **HistoryScreen** | Lista cronológica de depósitos, filtros, stats resumen |
| **DepositDetailScreen** | Detalle: imagen, clasificación, puntos ganados |
| **LessonListScreen** | Micro-lecciones disponibles, progreso general |
| **LessonDetailScreen** | Reproductor de lección + quiz al final |
| **FeedbackScreen** | Feedback tras error de clasificación + lección recomendada |
| **GamificationScreen** | Puntos, nivel, barra progreso, insignias |
| **LeaderboardScreen** | Ranking por barrio/zona, top 10 |
| **ChatScreen** | Chatbot con burbujas, respuestas rápidas |
| **ProfileScreen** | Avatar, stats, accesos rápidos |
| **EditProfileScreen** | Formulario editable de perfil |
| **SettingsScreen** | Notificaciones, tema, idioma, modo offline, logout |

---

## Componentes UI Reutilizables

| Componente | Responsabilidad |
|------------|----------------|
| `Button` | Base con variantes (primary, secondary, outline, ghost), tamaños, loading state |
| `Card` | Contenedor con sombra, borde redondeado, variantes (default, elevated, outlined) |
| `TextInput` | Campo texto con label, error state, helper text, icono |
| `Heading/Body/Caption` | Tipografía consistente con soporte de tema |
| `Avatar` | Imagen perfil con fallback a iniciales |
| `Badge` | Badge para estados (nivel, completado) |
| `Spinner/LoadingOverlay` | Indicadores de carga |
| `SkeletonLoader` | Placeholder animado |
| `EmptyState` | Estado vacío con ilustración |
| `ErrorState` | Error con opción reintentar |
| `Toast` | Notificación flotante temporal |
| `BottomSheet/Dialog` | Modales reutilizables |
| `ScreenContainer` | SafeAreaView wrapper con fondo |
| `Spacer` | Espaciador basado en theme.spacing |

---

## Servicios y Módulos

### 1. Cámara (`infrastructure/camera/CameraService.ts`)

**Librería:** `react-native-vision-camera`
- Permiso de cámara
- Captura de imagen de alta resolución
- Control flash, zoom, autofocus
- Optimización de imagen para modelo

### 2. Inferencia IA (`infrastructure/ai/TensorFlowService.ts`)

**Librería:** `react-native-fast-tflite` o `@tensorflow/tfjs-react-native`
- Carga modelo TFLite (lazy loading, cache en memoria)
- Preprocesamiento: resize 224x224, normalize [0,1]
- Inferencia con softmax → vector de probabilidades
- 6 clases: organic, plastic, paper, glass, metal, special

### 3. MQTT/TLS (`data/datasources/remote/mqtt/MqttClient.ts`)

**Librería:** `sp-react-native-mqtt`
- Conexión con autenticación TLS
- Suscripción a topics de contenedores (fill levels)
- Publicación de clasificaciones
- Reconexión con backoff exponencial (1s → 2s → 4s → ... → 60s max)
- QoS: at-least-once (depósitos), at-most-once (fill levels)

**Topics:**
```
greennode/{userId}/classification     — Publicación de clasificación
greennode/containers/{id}/fill        — Suscripción nivel llenado
greennode/{userId}/events             — Eventos de usuario
```

### 4. Mapas y Geolocalización

**Librería:** `react-native-maps` (Google Maps Android, Apple Maps iOS)
**Geolocalización:** `@react-native-community/geolocation`
- Ubicación actual del usuario
- Cálculo distancia Haversine
- watchPosition con distanciaFilter y interval
- Pausar al ir a background (ahorro batería)

### 5. Notificaciones Push

**Librería:** `@react-native-firebase/messaging`
- Registro FCM/APNs
- Categorías: feedback, tips, badges, container alerts, reminders
- Deep linking desde notificaciones

### 6. Autenticación

**Implementación:** JWT con refresh tokens
**Almacenamiento seguro:** `react-native-keychain`
- Login/Register/Logout
- Refresh automático de tokens
- Biometría (Face ID / huella)

### 7. Almacenamiento Offline-First

**Librería:** `@react-native-async-storage/async-storage` (persist Zustand)
**SQLite (opcional):** `watermelondb` para datos relacionales
- Cola de sincronización (sync queue)
- Cache de contenedores con TTL
- Resolución de conflictos: última escritura gana

### 8. Gamificación

- Puntos: +10 clasificación correcta, +15 depósito, +50 racha 7 días
- Niveles con progreso
- Insignias por hitos
- Rankings por zona/barrio

---

## Gestión de Estado: Zustand

**Justificación sobre Redux/Context:**

| Criterio | Redux Toolkit | Zustand | Context API |
|----------|---------------|---------|-------------|
| Boilerplate | Alto (slices, actions) | Mínimo | Mínimo |
| Performance | Buena | Excelente (selectores granulares) | Mala (re-renders) |
| TypeScript | Excelente | Excelente | Moderado |
| Persistencia | redux-persist | Nativa (middleware) | No nativa |
| Complejidad | Alta | Baja | Baja |

**Stores definidos:**
- `authStore` — user, tokens, isAuthenticated, login/logout (persist)
- `classificationStore` — currentResult, isClassifying, history
- `containerStore` — containers, selectedContainer, fillLevels (persist parcial)
- `depositStore` — deposits, stats
- `gamificationStore` — points, badges, leaderboard
- `educationStore` — lessons, completedIds
- `chatStore` — messages, isTyping
- `settingsStore` — themeMode, notifications, language (persist)

---

## Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos componente | PascalCase | `ButtonPrimary.tsx` |
| Archivos servicio | camelCase | `mqttClient.ts` |
| Archivos hook | camelCase + `use` | `useClassification.ts` |
| Archivos util | camelCase | `formatDate.ts` |
| Archivos tipo | `*.types.ts` | `navigation.types.ts` |
| Archivos test | `*.test.ts` | `mqttClient.test.ts` |
| Constantes | SCREAMING_SNAKE en contenido | `API_URL` |
| Interfaces repositorio | Prefijo `I` | `IAuthRepository` |
| Errores | Prefijo descriptivo + `Error` | `MqttConnectionError` |
| Componentes UI | PascalCase, prefijo responsabilidad | `ButtonPrimary`, `LoadingOverlay` |
| Stores Zustand | sufijo `Store` | `useAuthStore` |

---

## Manejo de Errores

```typescript
// Clase base
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>,
  ) { super(message); this.name = this.constructor.name; }
}

// Errores específicos
class ClassificationError extends AppError { ... }
class MqttConnectionError extends MqttError { ... }
class OfflineError extends NetworkError { ... }

// Uso en servicios
async function classify(uri: string): Promise<ClassificationResult> {
  try {
    return await this.tfliteService.run(uri);
  } catch (error) {
    throw new ClassificationError('Failed to classify', error instanceof Error ? error : undefined);
  }
}
```

---

## Variables de Entorno

Usar `react-native-config` con archivos `.env.development`, `.env.staging`, `.env.production`.

```typescript
// shared/config/environment.ts
interface Environment {
  apiUrl: string;
  mqttBrokerUrl: string;
  mqttPort: number;
  wsUrl: string;
  mapApiKey: string;
  tfModelUrl: string;
  environment: 'development' | 'staging' | 'production';
}
```

---

## Estrategia de Pruebas

| Nivel | Cobertura | Herramientas |
|-------|-----------|-------------|
| Unitarias | >80% | Jest + React Native Testing Library |
| Integración | Flujos críticos | Jest + RNTL |
| E2E | Happy paths | Detox |

**Qué testear:**
- **Dominio:** Entidades, casos de uso (lógica pura)
- **Data:** Repositorios con mocks de datasources
- **Presentation:** Componentes con RNTL, hooks con `renderHook`
- **Shared:** Utilidades puras (formatDate, validate, formatNumber)

---

## Recomendaciones de Rendimiento

### Modelo de IA
- Lazy loading: solo cargar cuando el usuario va a ScanScreen
- Mostrar progreso de carga
- Modelo quantizado Float16/INT8 (~5-10MB)
- Pre-calentar con inferencia dummy

### Listas
- Siempre FlatList sobre ScrollView para >20 items
- `getItemLayout` para altura fija
- `removeClippedSubviews={true}`
- `React.memo` en items + `useCallback` en handlers

### Imágenes
- Redimensionar antes de enviar al modelo (224x224)
- JPEG quality 0.7-0.8 para upload
- `react-native-fast-image` con cache

### Geolocalización
- Pausar watchPosition al ir a background
- `distanceFilter: 50m`, `interval: 10000ms`
- `highAccuracy: false` para ubicación aproximada (ahorra batería)

### MQTT
- Reconexión con backoff exponencial
- Desuscribirse de fill-level topics al ir a background
- Límite: 1 mensaje de clasificación por minuto

---

## Dependencias Principales

| Paquete | Propósito |
|---------|-----------|
| `react-native-vision-camera` | Captura de imágenes |
| `react-native-fast-tflite` | Inferencia TFLite |
| `sp-react-native-mqtt` | Cliente MQTT TLS |
| `react-native-maps` | Mapas |
| `zustand` | Gestión de estado |
| `@react-navigation/*` | Navegación |
| `@react-native-async-storage/async-storage` | Storage clave-valor |
| `react-native-fast-image` | Imágenes optimizadas |
| `@react-native-firebase/messaging` | Notificaciones push |
| `react-native-keychain` | Credenciales seguras |
| `react-native-config` | Variables de entorno |
| `react-native-reanimated` | Animaciones 60fps |

---

## Ejemplo: Pantalla de Escaneo

```typescript
// src/presentation/features/scan/screens/ScanScreen.tsx
import React, { useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { ButtonPrimary } from '@/presentation/components/ui/Button/ButtonPrimary';
import { Card } from '@/presentation/components/ui/Card/Card';
import { useClassificationStore } from '@/presentation/store/classificationStore';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

type ScanStackParamList = {
  ScanScreen: undefined;
  CameraPreviewScreen: undefined;
  ClassificationResultScreen: { classificationId: string };
};

type ScanScreenNavProp = NativeStackNavigationProp<ScanStackParamList, 'ScanScreen'>;

export function ScanScreen() {
  const navigation = useNavigation<ScanScreenNavProp>();
  const { isOnline } = useNetworkStatus();
  const { currentResult, isClassifying } = useClassificationStore();

  const handleScanPress = useCallback(() => {
    navigation.navigate('CameraPreviewScreen');
  }, [navigation]);

  const handleResultPress = useCallback(() => {
    if (currentResult) {
      navigation.navigate('ClassificationResultScreen', {
        classificationId: currentResult.id,
      });
    }
  }, [currentResult, navigation]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Heading>GreenNode</Heading>
        <Body color="textSecondary">Clasifica tus residuos de forma inteligente</Body>
      </View>

      <View style={styles.content}>
        <ButtonPrimary
          onPress={handleScanPress}
          disabled={isClassifying}
          size="large"
          fullWidth
        >
          Escanear Residuo
        </ButtonPrimary>

        {!isOnline && (
          <Card style={styles.offlineCard}>
            <Body color="warning">Modo offline — La clasificación funcionará localmente</Body>
          </Card>
        )}

        {currentResult && (
          <Card style={styles.resultCard} onPress={handleResultPress}>
            <Body fontWeight="600">Último resultado</Body>
            <Body>{currentResult.wasteType}</Body>
            <Body color="textSecondary">
              Confianza: {(currentResult.confidence * 100).toFixed(1)}%
            </Body>
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 16 },
  content: { flex: 1, justifyContent: 'center', gap: 16, padding: spacing.xl },
  offlineCard: { backgroundColor: '#FFF3E0' },
  resultCard: { marginTop: 16 },
});
```

---

## Ejemplo: Cliente MQTT

```typescript
// src/data/datasources/remote/mqtt/MqttClient.ts
import { MqttConnectionError, MqttError } from '@/domain/errors/MqttError';
import { ENV } from '@/shared/config/environment';
import { logger } from '@/shared/utils/logger';

type MessageHandler = (topic: string, payload: string) => void;
type ConnectionHandler = (connected: boolean) => void;
export type Subscription = { unsubscribe: () => void };
export type QoS = 0 | 1 | 2;

export class MqttClient {
  private client: any = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false;

  async connect(config?: { clientId?: string; username?: string; password?: string }): Promise<void> {
    const Mqtt = require('sp-react-native-mqtt');
    const clientId = config?.clientId ?? `greennode_${Date.now()}`;

    return new Promise((resolve, reject) => {
      this.client = Mqtt.createClient({
        uri: `${ENV.mqttBrokerUrl}:${ENV.mqttPort}`,
        clientId,
        auth: config?.username ? { user: config.username, pass: config.password } : undefined,
        keepalive: 30,
        reconnect: false,
        clean: true,
        qos: 1,
      });

      this.client.on('closed', () => {
        this.notifyConnectionChange(false);
        if (!this.isManualDisconnect) this.scheduleReconnect();
      });

      this.client.on('error', (error: any) => {
        if (!this.client?.isConnected?.()) {
          reject(new MqttConnectionError(ENV.mqttBrokerUrl, error));
        }
      });

      this.client.on('message', (msg: { topic: string; data: any }) => {
        const payload = typeof msg.data === 'string' ? msg.data : String(msg.data);
        this.messageHandlers.forEach((handler) => {
          try { handler(msg.topic, payload); } catch (err) { logger.error('[MQTT] Handler error:', err); }
        });
      });

      this.client.on('connect', () => {
        this.reconnectAttempts = 0;
        this.notifyConnectionChange(true);
        resolve();
      });

      this.client.connect();
    });
  }

  async disconnect(): Promise<void> { /* ... */ }
  async subscribe(topic: string, qos: QoS = 1): Promise<void> { /* ... */ }
  async unsubscribe(topic: string): Promise<void> { /* ... */ }
  async publish(topic: string, payload: string, qos: QoS = 1): Promise<void> { /* ... */ }

  onMessage(callback: MessageHandler): Subscription {
    this.messageHandlers.add(callback);
    return { unsubscribe: () => { this.messageHandlers.delete(callback); } };
  }

  onConnectionChange(callback: ConnectionHandler): Subscription {
    this.connectionHandlers.add(callback);
    return { unsubscribe: () => { this.connectionHandlers.delete(callback); } };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts), 60000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => { this.connect().catch(() => {}); }, delay);
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => { try { handler(connected); } catch {} });
  }
}

export const mqttClient = new MqttClient();
```

---

## Suposiciones Explícitas

1. **Broker MQTT:** Mosquitto o EMQX con TLS en puerto 8883
2. **Modelo IA:** Entrenado aparte (MobileNetV2 o YOLOv8-nano), exportado a `.tflite`
3. **Notificaciones:** Firebase Cloud Messaging (puede reemplazarse)
4. **Mapas:** Google Maps SDK (puede reemplazarse por Mapbox)
5. **Backend:** Simulado para el proyecto de grado
