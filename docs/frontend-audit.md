# Auditoría del frontend React — GreenNode

> **Fase 1 · solo lectura.** Describe el estado **previo** a las fases 2–15 (fecha: 2026-09-30). Las mejoras posteriores están en `docs/frontend-architecture.md`, `docs/decisions.md` y `docs/testing.md`.
> Método: lectura de archivos, `tsc`, `vite build`, `npm test`. Lo que no se ejecutó se indica como tal.
> Convención de etiquetas: **REAL** (verificado en el código/ejecución) · **SIMULADO** · **ESTIMADO** · **REFERENCIAL**.

---

## 1. Qué es "la aplicación React existente"

El repositorio contiene **dos** clientes React distintos:

| Cliente | Ruta | Estado | Rol |
|---|---|---|---|
| **Web (React + Vite)** | `web/` | Funciona y compila | Es el que se evoluciona (la propia guía del repo lo describe como "lo que funciona hoy": `docs/GUIA_PENDIENTES.md`) |
| **Móvil (React Native + Expo)** | `src/`, `App.tsx`, `android/`, `ios/` | **No compila** (ver §6, P1) | Clean Architecture más completa, pero con conflictos de merge sin resolver |

Además hay componentes que no son React pero forman el sistema: `admin/` (Laravel + Sanctum + Filament), `simulation/` (Python, simulador y analizador), `ml/` (entrenamiento), `realtime/` (servicio FastAPI de clasificación en vivo, agregado en esta sesión).

**Decisión de alcance propuesta:** evolucionar `web/`. `src/` (React Native) se mantiene como referencia de dominio (entidades, topics, errores) y se documenta, pero no se toca hasta que se autorice (ver `docs/decisions.md`, a crear en Fase 2).

## 2. Stack detectado (cliente web)

| Elemento | Valor | Evidencia |
|---|---|---|
| React | 19.2.7 instalado (`^19.0.0` declarado) | `web/node_modules/react` |
| Bundler | Vite 6.4.3 + `@vitejs/plugin-react` | `web/package.json` |
| Lenguaje | TypeScript 5.9.3, `strict: true` | `web/tsconfig.json` |
| Gestor de paquetes | npm (`package-lock.json` en `web/` y en la raíz) | repo |
| Router | **Ninguno**: pestañas por `useState` en `MainTabs.tsx` | `web/src/screens/MainTabs.tsx` |
| Estado | React Context (`appStore.tsx`) con `useState` | `web/src/lib/appStore.tsx` |
| Server state / fetch | `fetch()` directo dentro de `LoginScreen.tsx`; sin capa de servicios | `LoginScreen.tsx` |
| Estilos | CSS plano único, mobile-first con breakpoints 768/1024/1500 | `web/src/styles.css` |
| Iconos | Componente SVG propio | `web/src/components/Icon.tsx` |
| Gráficos | Ninguna librería | — |
| Mapa | Cuadrícula esquemática propia (no coordenadas reales) | `MapTab.tsx` |
| IA en navegador | TFJS + tfjs-tflite **cargados desde CDN jsdelivr en tiempo de ejecución** (las dependencias de `package.json` no se empaquetan) | `web/src/lib/tfClassifier.ts` |
| IA en servidor | FastAPI + Hugging Face `watersplash/waste-classification`, vía WebSocket por proxy de Vite (`/live`) | `realtime/`, `web/vite.config.ts` |
| Tests | **Ninguno** en `web/` | — |
| Build | `vite build` OK (≈245 kB JS, ≈76 kB gzip) | ejecutado en esta auditoría |
| Typecheck | `tsc --noEmit` sin errores en `web/` | ejecutado |
| Variables de entorno | Solo `VITE_LIVE_API_URL` (opcional). URL del backend **hardcodeada** | `LoginScreen.tsx`, `liveClassifier.ts` |

## 3. Estructura actual (`web/src`)

```
web/src/
├── App.tsx                 # sesión desde localStorage; Login o MainTabs
├── main.tsx
├── styles.css              # sistema de diseño único (tokens + componentes + responsive)
├── components/Icon.tsx
├── lib/
│   ├── appStore.tsx        # Context: contenedores, historial, estado MQTT, alertas
│   ├── domain.ts           # tipos + MOCK de contenedores + MOCK de lecciones + clasificador simulado
│   ├── iotSimulator.ts     # "broker MQTT" falso en el navegador
│   ├── tfClassifier.ts     # TFLite por CDN
│   └── liveClassifier.ts   # cliente WebSocket del servicio de IA en vivo
└── screens/
    ├── LoginScreen.tsx · MainTabs.tsx · HomeScreen.tsx
    ├── ProfileScreen.tsx   # código muerto (no se importa en ningún lado)
    └── tabs/ ScanTab · LiveScanner · MapTab · HistoryTab · EducationTab · ProfileTab
```

Es una estructura "por tipo" mínima (`lib/` + `screens/`), adecuada para un prototipo pero sin separación entre dominio, servicios, mocks y UI.

## 4. Funcionalidades existentes

| Funcionalidad | Estado | Observación |
|---|---|---|
| Login con correo/contraseña | **REAL** parcial | Llama a `POST http://localhost:8000/api/login` (Laravel Sanctum); guarda token en `localStorage` |
| Registro / recuperar contraseña | No existe | Botones sin acción |
| Clasificación por foto (captura/galería) | Mixto | Usa TFLite si hay modelo; si no, **resultado aleatorio** (SIMULADO) |
| Clasificación en vivo (cámara continua) | **REAL** (agregado en esta sesión) | Modelo preentrenado de terceros; mapeo de 12 clases a 6 tipos; precisión **no medida** por el proyecto |
| Resultado + confianza + consejo de disposición | REAL | Falta mostrar nombre del modelo en la ruta TFLite |
| Validación del usuario (correcto/incorrecto) | REAL (local) | Se guarda solo en memoria |
| Historial y estadísticas | REAL (local) | Se pierde al recargar (no hay persistencia) |
| Lista y detalle de contenedores | **SIMULADO** | 5 nodos fijos en `domain.ts` |
| Nivel de llenado en tiempo real | **SIMULADO** | Lo genera `iotSimulator.ts` en el navegador |
| Mapa | SIMULADO / esquemático | No usa mapa geográfico real |
| Estado MQTT en Perfil | **SIMULADO y engañoso** | Muestra "Conectado · mqtt://localhost:1883" aunque no hay conexión real |
| Alertas | SIMULADO | Solo visibles en Perfil |
| Lecciones | Mock estático | |
| Responsive (móvil/tablet/escritorio) | REAL | Verificado con capturas a 390/820/1366 px |

## 5. Funcionalidades faltantes (respecto al alcance pedido)

1. **Rutas** (`/classification`, `/containers`, `/map`, `/reports`, `/network`, `/settings`) — hoy no hay router.
2. **Dashboard** con KPIs reales (contenedores activos/críticos, nivel promedio, eventos, mensajes, latencia, PDR). Hoy "Inicio" es gamificación, no un panel IoT.
3. **Reportes de incidencias** (formulario, validación, envío).
4. **Sección de red** (cobertura, latencia, PDR, pérdida, throughput, nodos/gateway, escalabilidad) con etiqueta SIMULACIÓN/REAL.
5. **Capa `services/api`** (apiClient, classificationService, containerService, telemetryService, networkService, reportService).
6. **Integración MQTT segura** (vía backend, WebSocket seguro) y tópicos documentados.
7. **Indicador global de conexión** (ONLINE / CONNECTING / OFFLINE / SIMULATION / ERROR).
8. **Eventos de clasificación hacia el sistema** (hoy `publishClassification` solo escribe en consola).
9. **Estados de contenedor** NORMAL/WARNING/CRITICAL/OFFLINE (hoy `active/maintenance/offline/full`).
10. **Gateways, batería, última comunicación** en el modelo de contenedor.
11. **Geolocalización opcional con consentimiento explícito** para el evento de clasificación.
12. **Persistencia** del historial y cola de eventos pendientes (offline-first).
13. **Pruebas** (unitarias, de componentes, de integración).
14. **Gráficos** (latencia en el tiempo, nodos por gateway, distribución de residuos).
15. **Endpoints de backend** para clasificaciones, contenedores, telemetría, reportes y métricas (hoy `admin/routes/api.php` solo tiene `/login`, `/user`, `/logout`).
16. **Configuración por entorno** (`VITE_API_URL`, `VITE_USE_MOCK_DATA`, `VITE_WS_URL`).

## 6. Problemas y deuda técnica

### Críticos

| # | Problema | Evidencia | Impacto |
|---|---|---|---|
| P1 | **Conflictos de merge sin resolver, commiteados** en 8 archivos del cliente móvil y en `README.md` | `src/shared/config/environment.ts`, `src/main/navigation/MainTabNavigator.tsx`, `src/data/repositories/AuthRepositoryImpl.ts`, `src/domain/repositories/IAuthRepository.ts`, `src/domain/entities/User.ts`, `LoginScreen.tsx`, `ProfileScreen.tsx` (móvil), `src/presentation/store/authStore.ts`; `tsc` en la raíz falla con `TS1185` | El cliente móvil no compila; el README muestra marcadores `<<<<<<<` |
| P2 | **Secretos y artefactos versionados**: `admin/.env` (contiene `APP_KEY`, `APP_DEBUG=true`, config de BD), `admin/database/database.sqlite`, ~14 800 archivos de `admin/vendor/`, `admin/storage/framework/views` y logs, `web/cf-tunnel.log`, `.expo/` | `git ls-files` | Riesgo de seguridad y repositorio inflado; el `.env` debe rotarse y sacarse del control de versiones |
| P3 | **Datos simulados presentados como reales** | Perfil: "Conectado", "Broker mqtt://localhost:1883"; Inicio: "Depósitos 0 / Racha 0" y puntos fijos | Viola la regla de honestidad académica |
| P4 | **Fallback silencioso a clasificación aleatoria** si falta el modelo TFLite | `ScanTab.handleClassify` → `classifyWasteSimulated()` | Un resultado inventado se registra en historial y se "publica" |

### Altos

| # | Problema | Evidencia |
|---|---|---|
| P5 | URL del backend hardcodeada (`http://localhost:8000`) y `fetch()` dentro de un componente visual | `LoginScreen.tsx` |
| P6 | CORS abierto (`allowed_origins: ['*']`) en el backend | `admin/config/cors.php` |
| P7 | El servicio de IA en vivo no tiene autenticación ni límites (CORS `*`) | `realtime/main.py` |
| P8 | Inconsistencia de clases del modelo: `labels.json` lista 6 clases (incl. `organic`) pero el README del modelo dice que se entrenó con 5 | `web/public/model/` |
| P9 | TFJS/TFLite se descargan desde un CDN externo en tiempo de ejecución (disponibilidad y cadena de suministro; no funciona sin internet) | `tfClassifier.ts` |
| P10 | Divergencia de tópicos: documentación usa `greennode/...`; el requerimiento propone `waste/{node_id}/...` | `docs/MQTT_PROTOCOL.md` |
| P11 | Sin pruebas en `web/`; el `jest` de la raíz está roto (`Preset @react-native/jest-preset not found`) | `npm test` |
| P12 | Sin router: no hay URLs navegables, ni "atrás" del navegador, ni enlaces profundos | `MainTabs.tsx` |

### Medios / bajos

- P13 Accesibilidad: `maximum-scale=1.0` en el viewport impide el zoom; modal sin `role="dialog"` ni trampa de foco; `label` sin `htmlFor`; pestañas sin `aria-current`.
- P14 Layout de Mapa/Historial en escritorio usa `:has()` (requiere navegadores recientes).
- P15 `web/src/screens/ProfileScreen.tsx` es código muerto.
- P16 Historial y validaciones solo en memoria (se pierden al recargar).
- P17 Duplicación de dominio entre `src/domain` (RN) y `web/src/lib/domain.ts`.
- P18 Errores técnicos: algunos `console.warn` con detalle; mensajes de error genéricos, pero sin clasificación central de errores.
- P19 La dependencia `react-native-web`/`vite` en el `package.json` raíz mezcla ambos clientes.

## 7. Estado de la simulación y del backend (contexto para la integración)

- **`simulation/iot_node_simulator.py`**: nodos virtuales con nivel de llenado, temperatura y batería, publicando a MQTT en claro (puerto 1883). **No modela gateways, cobertura, ni TLS** (SIMULADO, parcial).
- **`simulation/network_metrics_analyzer.py`**: genera reportes (latencia, throughput msg/s, PDR si el payload trae contadores) a archivos; **no expone una API** que el frontend pueda consumir.
- **`admin/` (Laravel)**: autenticación Sanctum + panel Filament; modelos `Classification` y `Deposit` existen pero **sin rutas API**.
- **Broker MQTT**: no hay evidencia de uno desplegado en el repositorio (solo documentación y comando Docker de ejemplo). **No se ejecutó ninguna prueba MQTT/TLS en esta auditoría.**
- **Contradicción conceptual a documentar** (sin ocultarla): el proyecto se titula "red AD-HOC", pero la documentación describe LoRaWAN/NB-IoT → gateway → broker, que es una topología **de estrellas con infraestructura**, no estrictamente ad-hoc. Debe registrarse como decisión técnica en `docs/decisions.md` (Fase 2) y presentarse como arquitectura **híbrida** con capas separadas.

## 8. Riesgos

| Riesgo | Prob. | Impacto | Mitigación propuesta |
|---|---|---|---|
| Que el jurado detecte datos simulados mostrados como reales | Alta (hoy ocurre) | Alto | Bandera `VITE_USE_MOCK_DATA` + insignia global "SIMULACIÓN" + mocks aislados en `src/mocks/` |
| Secretos en el repositorio (`admin/.env`) | Alta | Alto | Rotar `APP_KEY`, añadir a `.gitignore`, `git rm --cached` (requiere autorización) |
| Que el modelo de terceros tenga precisión inferior a la esperada | Media | Medio | Medir con un conjunto propio; hasta entonces no publicar cifras de exactitud |
| Latencia de aplicación confundida con latencia de red IoT | Media | Alto | Separar métricas en tipos y vistas distintas |
| Backend no preparado para los nuevos endpoints | Alta | Alto | Definir contrato (`docs/api.md`) y mocks antes de implementar |
| Cliente móvil roto desincronizado del web | Alta | Medio | Resolver conflictos P1 por separado, con autorización |
| Dependencia de CDN para TFJS | Media | Medio | Empaquetar localmente o usar el servicio del servidor |

## 9. Recomendaciones (resumen)

1. Mantener React + Vite + TypeScript; añadir `react-router-dom`.
2. Mantener Context para estado de UI; añadir **TanStack Query** solo para *server state* (una librería nueva, justificada en `decisions.md`).
3. Crear `services/api`, `src/mocks/`, `src/types/` y `src/config/` sin mover masivamente lo existente.
4. Introducir el estado global de conexión y la etiqueta de origen de datos (REAL/SIMULADO) como tipo transversal.
5. Resolver P1 y P2 antes de cualquier entrega o demostración.
6. Mantener el MQTT detrás del backend (no conectar el navegador al broker).
