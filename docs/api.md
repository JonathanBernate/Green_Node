# Contrato de API (frontend ↔ backend)

Base: `VITE_API_URL` (por defecto `http://localhost:8000`). Autenticación: `Authorization: Bearer <token>` (Sanctum).

**Estado:** ✅ implementado en `admin/` (Laravel) · ⏳ definido aquí, **pendiente de implementar** en el backend.
Con `VITE_USE_MOCK_DATA=true` (por defecto) el frontend no llama a los endpoints ⏳ y usa `src/mocks` (SIMULACIÓN).

| Estado | Método y ruta | Servicio | Respuesta |
|---|---|---|---|
| ✅ | `POST /api/login` `{email,password}` | `authService.login` | `{user:{id,name,email,role,points,level,container}, token}` (`role`: `admin`\|`user`\|`contenedor`) |
| ✅ | `GET /api/user` · `POST /api/logout` | `authService` | — |
| ✅ | `GET /api/lessons` | `lessonService.list` | `Lesson[]` (solo publicadas, con `completed` y `score` del usuario) |
| ✅ | `GET /api/lessons/{id}` | `lessonService.get` | `Lesson` + `content` (Markdown) + `questions[]` (sin respuesta correcta) |
| ✅ | `POST /api/lessons/{id}/submit` `{answers:{<questionId>:<índice>}}` | `lessonService.submit` | `{score,passed,passScore,pointsEarned,results[],totalPoints,level}` |
| ✅ | `DELETE /api/lessons/{id}/progress` | `lessonService.reset` | `{message}` |
| ✅ | `GET /api/lesson-categories` | — | `{id,name,slug,icon}[]` |
| ✅ | `POST /api/webhooks/container-location` `{container_id,latitude,longitude,timestamp,accuracy?}` — **rol `contenedor`** | `containerLocationService.report` | `{updated, location}`; 403 si `container_id` no es el del token |
| ✅ | `POST /api/container/classifications` `{waste_type,confidence,model?,inference_time_ms?,simulated?,timestamp?}` — **rol `contenedor`** | `containerLocationService.submitClassification` | 201 `{id,container_id,waste_type}` |
| ✅ | `GET /api/containers/locations` — roles `admin`,`user` | `containerLocationService.list` | `{server_time,online_within_seconds,data:ContainerLocation[]}` (`status`: `online`\|`stale`\|`none`) |
| ✅ | `GET /api/containers/{code}/location` — roles `admin`,`user` | — | `ContainerLocation` |
| ⏳ | `GET /up` (health) | `useConnectionStatus` | 200 si el servidor está vivo |
| ⏳ | `POST /api/classification` (multipart `image`) | `classificationService.classifyImage` | `{class, confidence, model, inference_time_ms}` |
| ⏳ | `POST /api/events` | `classificationService.sendEvent` | 201 |
| ⏳ | `GET /api/containers` | `containerService.list` | `Container[]` |
| ⏳ | `GET /api/gateways` | `containerService.gateways` | `Gateway[]` |
| ⏳ | `GET /api/telemetry?container=` | `telemetryService.series` | `Telemetry[]` |
| ⏳ | `GET /api/network/scenarios` | `networkService.scenarios` | `SimulationScenario[]` |
| ⏳ | `GET /api/network/metrics?scenario=` | `networkService.snapshot` | `{source, data: NetworkSnapshot}` |
| ⏳ | `GET /api/reports` · `POST /api/reports` | `reportService` | `Report[]` / `Report` |

## Esquemas principales

```jsonc
// Container
{ "id":"c-001","address":"…","latitude":4.60,"longitude":-74.07,"fillLevel":32,
  "status":"active|maintenance|offline|full","capacity":240,"lastUpdated":"ISO-8601",
  "batteryLevel":94,"gatewayId":"gw-01","wasteTypes":["plastic"],"virtual":true }

// WasteEvent (POST /api/events)
{ "event_type":"waste_classification","event_id":"ev_…","user_id":"1",
  "classification":"plastic","confidence":0.94,"model":"…","inference_time_ms":120,
  "timestamp":"ISO-8601","location":{"lat":4.6,"lng":-74.07},"source":"REAL|SIMULATION" }

// Report (POST /api/reports)
{ "type":"full|damaged|litter|access|anomaly|other","description":"≥10 y ≤500 car.",
  "container_id":"c-001","timestamp":"ISO-8601","location":"texto opcional" }
```

`/api/network/metrics` **debe** informar `source` (`REAL` o `SIMULATION`); si falta, el frontend asume `SIMULATION`.

## Errores

El backend debe responder JSON con `message` y, en 422, `errors`. El frontend traduce el código HTTP a
un mensaje comprensible (`toUserMessage`) y registra el detalle técnico solo en consola.

## Recomendaciones para el backend (pendientes)

- Restringir CORS (`allowed_origins`) al origen del frontend; hoy es `*`.
- `APP_DEBUG=false` fuera de desarrollo.
- Validar y autorizar todos los endpoints nuevos (no confiar en datos del cliente).

## Aprendizaje (lecciones)

CRUD de contenido en el panel **Filament** (`/admin` → *Aprendizaje*: Lecciones, Categorías y Preguntas del cuestionario).
Tablas: `lesson_categories`, `lessons`, `quiz_questions`, `lesson_progress`. Aprueba con ≥ 70 %; los puntos de la
lección se otorgan **una sola vez** y se suman a los 10 pts por depósito (`User::totalPoints()`).
Instalación: `php artisan migrate && php artisan db:seed --class=LessonSeeder`.
