# Arquitectura del frontend web (`web/`)

Implementación de las fases 2–12 sobre el cliente React + Vite existente. Las pantallas que ya
funcionaban (escaneo, historial, aprender, login) se **conservaron y mejoraron**; lo nuevo se añadió
alrededor. Etiquetas: **REAL** · **SIMULADO** · **ESTIMADO** · **REFERENCIAL**.

## Mapa de carpetas (`web/src`)

| Carpeta | Contenido |
|---|---|
| `app/` | `AuthProvider` (sesión) y `routes.tsx` (React Router) |
| `config/env.ts` | Variables `VITE_*`, umbrales de diseño (70/90 %, 15 min, latencia 500 ms, pérdida 5 %) |
| `types/` | `DataSource`, `ConnectionStatus`, `ContainerHealth`, `Telemetry`, `Gateway`, `WasteEvent`, `Alert`, `Report`, `NetworkSnapshot`, `SimulationScenario`… |
| `services/api/` | `apiClient` (timeout, token, errores traducidos, medición de latencia de **aplicación**), `authService`, `containerService`, `telemetryService`, `networkService`, `reportService`, `classificationService`, `appMetrics` |
| `mocks/` | **Único** lugar con datos simulados (`containers`, `network`, `lessons`) |
| `hooks/useData.ts` | `useContainers`, `useGateways`, `useNetworkSnapshot`, `useConnectionStatus`, `useAlerts`, `useAppMetrics` |
| `lib/` | (existente) dominio de residuos, store Context, simulador de telemetría, clasificadores TFLite y en vivo |
| `components/` | `layout/` (AppLayout, navegación), `common/` (ConnectionBadge, DataSourceTag, Kpi, Modal), `metrics/` (gráficos SVG), `containers/`, `waste/` (EventPanel) |
| `pages/` | Dashboard, Containers, Reports, Network, Settings, More |
| `screens/` | (existente, mejoradas) Login, Scan, LiveScanner, Map, History, Education |

## Flujo de datos

```
Componente ── hook (useData) ── servicio ── apiClient ── fetch ──▶ Backend (REAL)
                                  └─ si VITE_USE_MOCK_DATA ≠ 'false' ──▶ src/mocks (SIMULATION)
```

- Ningún componente visual llama a `fetch()`; todo pasa por `services/api`.
- **Estado de UI:** Context (`appStore`, `AuthProvider`). **Estado de servidor:** TanStack Query.
- **Origen del dato:** cada respuesta de servicio lleva `source`; la interfaz muestra
  `DATOS DE SIMULACIÓN` junto a todo lo que no sea REAL.
- **Modo simulación** (por defecto): el estado global de conexión es `SIMULATION` y el simulador de
  telemetría del navegador (`lib/iotSimulator.ts`) actualiza los contenedores virtuales.

## Rutas

`/` Dashboard · `/classification` · `/containers` · `/map` · `/network` · `/reports` · `/history` ·
`/learn` · `/settings` · `/more` (menú móvil) · `/profile` → `/settings`.
Móvil: barra inferior con 5 destinos (Inicio, Escanear, Contenedores, Mapa, Más). Tablet/escritorio: barra lateral con todos.

## Estados del contenedor

`deriveHealth()` (`utils/status.ts`): `OFFLINE` si el estado reportado es offline/mantenimiento o no hay
comunicación por más de 15 min; `CRITICAL` ≥ 90 %; `WARNING` ≥ 70 %; si no, `NORMAL`.
Los umbrales son **parámetros de diseño**, no resultados.

## Métricas: aplicación vs. red IoT

| | Latencia de aplicación | Latencia de red IoT |
|---|---|---|
| Qué mide | Tiempo de respuesta de la API y de la inferencia, en este navegador | Retardo nodo → gateway → broker |
| Origen | **REAL** (`appMetrics`) | Simulador/backend (hoy **SIMULADO**, sintético) |
| Dónde | `/network` → "Métricas de la aplicación" y `/settings` | `/network` (KPIs y gráficos) |

## Seguridad

- Sin secretos en el repositorio del frontend; `VITE_*` es público por diseño.
- El navegador **no** se conecta al broker MQTT: lo hace el backend (ver `docs/mqtt.md`).
- Errores técnicos solo a consola (`utils/logger.ts`); al usuario, mensajes comprensibles.
- Entradas: validación de formularios + `sanitizeText`; el servidor sigue siendo la autoridad.
- Geolocalización: solo con casilla marcada por el usuario; se puede continuar sin ella.

## Limitaciones conocidas

- El backend Laravel solo expone `/login`, `/user`, `/logout`; los demás endpoints están **definidos pero
  no implementados** (`docs/api.md`). Por eso el modo por defecto es simulación.
- El mapa es un plano esquemático (sin teselas) construido con coordenadas reales.
- El layout multicolumna de Mapa/Historial usa `:has()` (navegadores recientes).
