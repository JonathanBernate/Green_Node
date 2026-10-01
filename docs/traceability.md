# Trazabilidad funcionalidad → objetivo

OE1: arquitectura de red IoT · OE2: aplicación de asistencia (clasificación y transmisión) · OE3: desempeño de la red.
"Evidencia": lo que existe hoy y lo que falta producir. Nada aquí es un resultado experimental.

| Funcionalidad | Objetivo | Entrada | Proceso | Salida | Evidencia actual / pendiente |
|---|---|---|---|---|---|
| Clasificación de residuos | OE2 | Imagen / frames | Inferencia (TFLite o servicio) | Clase, confianza, tiempo, modelo | Código + pruebas de servicio; **falta** medir precisión |
| Evento de clasificación | OE2 | Resultado de IA (+ ubicación opcional) | `buildEvent` → `sendEvent` | `WasteEvent` en cola/envío | `classificationService.test.ts`; **falta** envío real a broker |
| Contenedores | OE1 | Telemetría de nodos | `useContainers` + `deriveHealth` | Estado, llenado, batería, gateway | `/containers` + `status.test.ts`; datos SIMULADOS |
| Mapa | OE1 | Coordenadas | Proyección a plano | Posición, estado, gateways, cobertura de diseño | `/map`; datos SIMULADOS |
| Reportes | OE2 | Formulario | Validación → API | Incidencia registrada | `reportService.test.ts`; **falta** endpoint |
| Métricas de red | OE3 | Salidas del simulador | `networkService.snapshot` | Latencia, PDR, pérdida, throughput, tráfico, cobertura, escalabilidad | `/network`; hoy sintético — **falta** conectar al simulador |
| Métricas de aplicación | OE2 | Tiempos de API e inferencia | `appMetrics` | Media y p95 | REAL, medido en el navegador |
| Dashboard | OE2 y OE3 | API/estado | Agregación | KPIs con origen | `/` + `pages.test.tsx` |
| Alertas | OE1 y OE3 | Umbrales | `deriveAlerts` | Alertas | `alerts.test.ts` |
| Estado de conexión | OE1 y OE2 | `/up` + modo | `useConnectionStatus` | ONLINE/CONNECTING/OFFLINE/SIMULATION/ERROR | `common.test.tsx` |
