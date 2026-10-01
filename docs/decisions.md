# Decisiones técnicas

| ID | Decisión | Motivo | Estado |
|---|---|---|---|
| D-01 | Evolucionar `web/` (React + Vite + TS); no tocar `src/` (React Native), `admin/` ni `simulation/` sin autorización | La guía del repo lo describe como lo que funciona hoy; el móvil tiene conflictos de merge | Vigente |
| D-02 | Mantener tópicos `greennode/…` (ya usados por el simulador); equivalencias `waste/…` en `docs/mqtt.md` | Evitar romper el simulador | Vigente — revisar con el equipo |
| D-03 | Umbrales de estado: advertencia 70 %, crítico 90 %, offline tras 15 min | Parámetros de diseño razonables; son configurables en `config/env.ts` | **Por confirmar por el equipo** |
| D-04 | `VITE_USE_MOCK_DATA` por defecto `true` | El backend no expone aún los endpoints; así la interfaz siempre rotula "SIMULACIÓN" | Vigente hasta implementar la API |
| D-05 | Añadir `react-router-dom` y `@tanstack/react-query` (únicas dependencias de runtime nuevas) | Rutas navegables y *server state* (caché, reintentos, polling) | Vigente |
| D-06 | Gráficos con SVG propio, sin librería | Pocos tipos de gráfico; evita dependencia | Vigente |
| D-07 | Mapa esquemático sin teselas | Sin dependencia de servicios externos ni claves | Vigente — evaluar Leaflet |
| D-08 | El navegador no se conecta al broker MQTT; lo hace el backend | Seguridad (credenciales, TLS, ACL) | Vigente |
| D-09 | Los resultados "simulados" de clasificación no se envían ni cuentan en KPI | Honestidad de datos | Vigente |
| D-10 | Se instaló con `--legacy-peer-deps` por un conflicto previo de `@tensorflow/tfjs-tflite` | El paquete exige `tfjs-core@4.9.0`; el repo usa 4.22 | Deuda técnica |

## Contradicción a resolver en el documento académico

El título habla de una red **AD-HOC**, pero la arquitectura descrita (nodos → LoRaWAN/NB-IoT/LTE-M →
gateway → backhaul → broker → aplicación) es **híbrida y con infraestructura**. La interfaz presenta las
capas por separado (`/network`, "Capas de la arquitectura", etiqueta REFERENCIAL) y **no** afirma que todo
el conjunto sea ad-hoc. Debe delimitarse qué parte lo es (p. ej. multi-salto entre nodos) y modelarla en el simulador.
