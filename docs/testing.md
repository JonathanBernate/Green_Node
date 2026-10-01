# Pruebas

```bash
cd web
npm test            # vitest (jsdom + Testing Library)
npm run typecheck   # tsc --noEmit
npm run build
```

**Resultado de la última ejecución (2026-10-01):** 8 archivos, **46 pruebas aprobadas**; `tsc` sin errores; `vite build` correcto.

| Archivo | Cubre |
|---|---|
| `utils/status.test.ts` | Estados NORMAL/WARNING/CRITICAL/OFFLINE, formato de tiempo |
| `utils/alerts.test.ts` | Alertas derivadas de contenedores y red |
| `mocks/network.test.ts` | Determinismo y consistencia del modelo sintético |
| `services/api/apiClient.test.ts` | Traducción de errores, token, medición de latencia de aplicación |
| `services/api/reportService.test.ts` | Validación, sanitización, almacenamiento simulado |
| `services/api/classificationService.test.ts` | Esquema del evento, cola local, sin falso "enviado" |
| `components/common/common.test.tsx` | Indicador de conexión, etiqueta de origen, gráficos accesibles |
| `pages/pages.test.tsx` | Contenedores (filtro, diálogo), Reportes (validación y alta), Red, Dashboard |

## No cubierto todavía

- Cámara, WebSocket de IA en vivo y TFLite (requieren dispositivo/servicio).
- Pruebas end-to-end contra backend y broker reales.
- Accesibilidad automatizada (axe) y pruebas visuales.
- El cliente móvil (`src/`) y el `jest` de la raíz siguen rotos (conflictos de merge, ver `frontend-audit.md`).
