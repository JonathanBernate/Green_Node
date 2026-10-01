# GreenNode · frontend web

React 19 + Vite + TypeScript. Interfaz del sistema IoT de gestión de residuos del proyecto de grado.

```bash
cd web
npm install --legacy-peer-deps      # conflicto previo de tfjs-tflite (ver docs/decisions.md D-10)
cp .env.example .env.local
npm run dev                         # http://localhost:5173
npm test && npm run typecheck && npm run build
```

- **Modo simulación** (por defecto, `VITE_USE_MOCK_DATA=true`): contenedores, red y reportes son datos de
  `src/mocks` y la interfaz los rotula como **DATOS DE SIMULACIÓN**.
- **Clasificación en vivo:** `cd ../realtime && uvicorn main:app --port 8765` (Vite la expone en `/live`).
- Login: backend Laravel en `admin/` (`php artisan serve`, puerto 8000).

Documentación: `docs/frontend-architecture.md`, `docs/api.md`, `docs/mqtt.md`, `docs/classification.md`,
`docs/testing.md`, `docs/decisions.md`, `docs/traceability.md`, `docs/frontend-audit.md`.
