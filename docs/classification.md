# Clasificación de residuos

## Rutas disponibles

| Ruta | Dónde corre | Modelo | Origen del resultado |
|---|---|---|---|
| Foto / Galería (TFLite) | Navegador | MobileNetV2 entrenado por el proyecto (`web/public/model/`), si existe | REAL |
| Foto / Galería (sin modelo) | Navegador | **Ninguno** — resultado aleatorio de demostración | **SIMULADO** (se marca "RESULTADO SIMULADO", no se envía como evento y no cuenta en los KPI) |
| En vivo | Servicio FastAPI (`realtime/`) | `watersplash/waste-classification` (ViT, 12 clases, terceros) | REAL (modelo de terceros) |
| `POST /api/classification` | Backend | A definir | ⏳ pendiente |

## Mapeo a las categorías del sistema

El modelo en vivo devuelve 12 clases; `realtime/labels.py` las agrupa en `organico | reciclable |
no_reciclable | peligroso` y en el `WasteType` de la app cuando existe equivalencia.

## Qué muestra la interfaz

Clase, confianza, **tiempo de inferencia** y **modelo utilizado**. La interfaz **no muestra exactitud
(accuracy)**: no se ha medido con un conjunto de prueba propio. Hasta entonces no debe citarse ninguna cifra.

## De clasificación a evento IoT

`EventPanel` construye un `WasteEvent` (ver `docs/api.md`), con ubicación **opcional y con consentimiento**,
y lo envía con `classificationService.sendEvent`. En simulación queda guardado solo en el navegador
(`stored-local`); con backend, si falla el envío, queda `pending` en cola local y se reintenta desde Ajustes.

## Pendientes

- Verificar la inconsistencia `labels.json` (6 clases) vs. README del modelo (5 clases).
- Medir precisión del modelo con un conjunto de validación propio antes de reportarla.
