# Arquitectura de la aplicación — actual y propuesta

> **Fase 2 · propuesta.** Nada de lo descrito en "Propuesta" está implementado todavía; requiere aprobación.
> Etiquetas: **REAL** · **SIMULADO** · **ESTIMADO** · **REFERENCIAL**.

---

## 1. Arquitectura actual (verificada)

```
┌──────────────────────────── Navegador (web/, React 19 + Vite) ────────────────────────────┐
│  App.tsx ─ sesión en localStorage                                                          │
│   ├─ LoginScreen ──fetch──▶ Laravel :8000 /api/login  (Sanctum)                  [REAL]    │
│   └─ MainTabs (pestañas por useState, sin router)                                          │
│        ├─ Home · Map · History · Education · Profile                                       │
│        └─ Scan                                                                             │
│            ├─ Foto/Galería ─▶ TFLite (CDN) | clasificador aleatorio              [REAL | SIM]│
│            └─ En vivo ──WebSocket /live──▶ FastAPI :8765 (ViT de Hugging Face)    [REAL]   │
│  appStore (Context) ◀── iotSimulator.ts  (broker MQTT falso, en el navegador)    [SIMULADO]│
│  domain.ts (contenedores y lecciones fijos)                                      [MOCK]    │
└────────────────────────────────────────────────────────────────────────────────────────────┘

Fuera del navegador, sin conexión con el frontend hoy:
  simulation/iot_node_simulator.py ──MQTT 1883──▶ (broker no versionado)   [SIMULADO]
  simulation/network_metrics_analyzer.py ──▶ reportes en archivos           [SIMULADO]
```

**Idea clave:** hoy el frontend no recibe ningún dato del sistema IoT. Todo lo que parece telemetría se genera en el navegador.

## 2. Arquitectura propuesta

### 2.1 Flujo de extremo a extremo (el pedido como criterio de éxito)

```
USUARIO ─▶ REACT ─▶ clasificación IA ─▶ evento ─▶ API REST ─▶ BACKEND ─▶ BROKER MQTT ─▶ red IoT
                                                                  ▲            │
 SIMULADOR (nodos, gateways, métricas) ──MQTT/TLS──▶ BROKER ──────┘            ▼
                                                              BASE DE DATOS ─▶ API/WebSocket (wss) ─▶ REACT Dashboard ─▶ métricas ─▶ análisis
```

Reglas:
- **El navegador nunca habla con el broker MQTT directamente.** Consume una API REST y un canal `wss://` del backend; el backend es el único cliente MQTT del lado de la aplicación.
- **El frontend no contiene lógica de simulación de red.** Solo consume resultados.
- **Cada dato lleva su origen** (`REAL` / `SIMULATION` / `ESTIMATED`) desde la capa de servicios hasta la UI.

### 2.2 Capas del frontend (adaptadas a lo existente, sin mover archivos masivamente)

```
web/src/
├── app/            router, providers, config de entorno                (NUEVO)
├── components/     common/, layout/, containers/, waste/, alerts/, metrics/
├── pages/          Dashboard, WasteClassification, Containers, Map, Reports, Network, Settings
├── features/       classification, containers, telemetry, reports, network, auth
├── services/
│   ├── api/        apiClient, classificationService, containerService,
│   │               telemetryService, networkService, reportService
│   ├── realtime/   cliente WebSocket seguro (reemplaza iotSimulator en modo real)
│   └── storage/    persistencia local (historial, cola de eventos)
├── hooks/  stores/  types/  utils/  styles/
├── mocks/          ÚNICO lugar con datos simulados (activado por VITE_USE_MOCK_DATA)
└── lib/            (existente) se migra gradualmente; no se borra sin autorización
```

Mapeo de lo existente → destino (migración gradual, un módulo por fase):

| Existente | Destino | Fase |
|---|---|---|
| `lib/domain.ts` (tipos) | `types/` | 4 |
| `lib/domain.ts` (contenedores/lecciones fijos) | `mocks/` | 4 |
| `lib/iotSimulator.ts` | `mocks/` + `services/realtime` (adaptador) | 10 |
| `lib/appStore.tsx` | `stores/` (UI) + TanStack Query (servidor) | 4–5 |
| `lib/tfClassifier.ts`, `liveClassifier.ts` | `features/classification/` + `services/api/classificationService` | 6 |
| `screens/tabs/*` | `pages/*` con rutas | 5–9 |
| `screens/LoginScreen.tsx` (fetch directo) | `features/authentication/` + `services/api` | 3 |

### 2.3 Rutas

| Ruta | Página | Objetivo del proyecto |
|---|---|---|
| `/` | Dashboard | OE2 y OE3 |
| `/classification` | Clasificación (foto y en vivo) | OE2 |
| `/containers` | Contenedores | OE1 |
| `/map` | Mapa | OE1 |
| `/reports` | Reportes | OE2 (transmisión de información) |
| `/network` | Métricas de red | OE3 |
| `/settings` | Estado del sistema y configuración | Transversal |
| `/login` | Acceso | Transversal |

### 2.4 Estado

- **UI state:** Context API existente (sin librería nueva).
- **Server state:** **TanStack Query** (única adición; justificación: caché, reintentos, *polling* y estados de carga/error uniformes para 6 servicios). Se registrará en `docs/decisions.md`.
- Sin Zustand en el web (se evita duplicar con el móvil).

### 2.5 Indicador global de conexión

Tipo único `ConnectionStatus = 'ONLINE' | 'CONNECTING' | 'OFFLINE' | 'SIMULATION' | 'ERROR'`, calculado a partir de: salud de la API (`/health`), estado del canal `wss` y la bandera `VITE_USE_MOCK_DATA`. En modo mock el estado es **siempre `SIMULATION`**, visible en la barra.

### 2.6 Modelo de datos (tipos a crear en `types/`)

`Container`, `Telemetry`, `Classification`, `WasteEvent`, `NetworkMetric`, `Alert`, `Report`, `Gateway`, `SimulationScenario`, más:

```ts
type DataSource = 'REAL' | 'SIMULATION' | 'ESTIMATED' | 'REFERENCE';
type ContainerStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
interface Sourced<T> { data: T; source: DataSource; receivedAt: string; }
```

Regla de estados (a validar con el equipo): `NORMAL < 70 %`, `WARNING 70–89 %`, `CRITICAL ≥ 90 %`, `OFFLINE` si no hay comunicación por más de N intervalos de reporte. Los umbrales son **parámetros de diseño**, no resultados.

### 2.7 Contrato de API (borrador; se formaliza en `docs/api.md`)

| Método y ruta | Uso | Estado hoy |
|---|---|---|
| `POST /api/login`, `GET /api/user`, `POST /api/logout` | Autenticación | **Existe** (Laravel) |
| `POST /api/classification` (multipart) → `{class, confidence, model, inference_time_ms}` | Clasificación por imagen | Falta en backend (existe el servicio `realtime/` con WebSocket) |
| `POST /api/events` | Evento `waste_classification` | Falta |
| `GET /api/containers`, `GET /api/containers/{id}` | Contenedores | Falta |
| `GET /api/telemetry?container=&from=&to=` | Series de llenado | Falta |
| `GET /api/alerts` | Alertas | Falta |
| `POST /api/reports` | Incidencias | Falta |
| `GET /api/network/metrics?scenario=` | Métricas con `source` | Falta |
| `GET /health` | Estado de conexión | Falta en Laravel |
| `wss://…/ws/stream` | Telemetría y alertas en vivo | Falta |

### 2.8 Tópicos MQTT (decisión pendiente)

| Propuesto en el requerimiento | Existente en `docs/MQTT_PROTOCOL.md` |
|---|---|
| `waste/{node_id}/telemetry` | `greennode/containers/{id}/fill` |
| `waste/{node_id}/status` | `greennode/containers/{id}/status` |
| `waste/{node_id}/classification` | `greennode/users/{userId}/classification` |
| `waste/{node_id}/alerts` | `greennode/system/alerts` |
| `network/metrics`, `network/events` | `greennode/network/metrics` |

Recomendación: conservar el espacio `greennode/` ya usado por el simulador y mantener una tabla de equivalencias; migrar solo si se aprueba. Se documentará en `docs/mqtt.md`.

### 2.9 Seguridad y errores

- Variables: `VITE_API_URL`, `VITE_WS_URL`, `VITE_USE_MOCK_DATA`. **Ningún secreto en `VITE_*`** (se incrustan en el bundle).
- `apiClient` central: timeouts, reintentos acotados, traducción de errores técnicos a mensajes comprensibles; el detalle va a un `logger`.
- Validación de formularios en cliente (el servidor sigue siendo la autoridad).
- Geolocalización solo bajo acción explícita del usuario, con explicación y opción de continuar sin ella.
- Medición separada: **latencia de aplicación** (API/inferencia, medida en el navegador) frente a **latencia de red IoT** (viene del simulador/backend, vista `/network`). Nunca se mezclan en un mismo gráfico ni en un mismo tipo.

### 2.10 Arquitectura de red: lo que el documento académico debe aclarar

El sistema descrito (nodos → LoRaWAN/NB-IoT/LTE-M → gateway → backhaul → broker → aplicación) es una arquitectura **híbrida con infraestructura**. La parte genuinamente *ad-hoc* (si la hay, p. ej. enlaces multi-salto entre nodos) debe delimitarse y modelarse en el simulador. La interfaz mostrará las capas por separado: **acceso (nodos) · LPWAN · gateway · backhaul · broker · aplicación**. No se afirmará que todo el conjunto es ad-hoc. Queda registrado para `docs/decisions.md`.

## 3. Trazabilidad preliminar

| Funcionalidad | Objetivo | Entrada | Proceso | Salida | Evidencia (a producir) |
|---|---|---|---|---|---|
| Clasificación de residuos | OE2 | Imagen / frames | Inferencia (modelo) | Clase, confianza, tiempo, modelo | Capturas, registros de inferencia, pruebas |
| Evento de clasificación | OE2 | Resultado de IA | Publicación vía API → MQTT | Evento en el sistema IoT | Log backend + mensaje en broker |
| Contenedores | OE1 | Telemetría de nodos | Consulta/streaming | Estado, llenado, batería, gateway | Vista + datos del simulador |
| Mapa | OE1 | Coordenadas | Render georreferenciado | Posición y estado | Captura + datos |
| Reportes | OE2 | Formulario | Validación → API | Incidencia registrada | Registro en BD |
| Métricas de red | OE3 | Salidas del simulador | Agregación (backend) | Latencia, PDR, throughput, cobertura | Reportes del simulador + CSV |
| Dashboard | OE2 y OE3 | API | Agregación | KPIs con origen | Capturas con insignia SIMULACIÓN |
| Alertas | OE1 y OE3 | Umbrales/telemetría | Reglas | Alertas | Registro |
| Estado de conexión | OE1 y OE2 | `/health` + canal | Monitoreo | Indicador global | Capturas |
