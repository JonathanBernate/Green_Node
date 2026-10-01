# GreenNode - Guía de lo que falta por hacer


## 1. ¿Qué es GreenNode?

Es un sistema para la **gestión inteligente de residuos sólidos** compuesto por:

1. Una **app móvil** (React Native) que clasifica residuos con la cámara usando IA.
2. Una **red IoT** de contenedores que reportan su nivel de llenado por MQTT.
3. Un **dashboard web** (React + Vite) que replica la app para demos en navegador.

Tiene 5 secciones: **Escanear** (clasificar residuo), **Mapa** (contenedores),
**Historial**, **Aprender** (lecciones) y **Perfil** (estado del sistema).

---

## 2. Estructura del proyecto (dónde está cada cosa)

```
Green_Node/
├── src/                    App móvil React Native (Clean Architecture)
│   ├── domain/             Entidades y lógica de negocio (tipos de residuo, etc.)
│   ├── data/               MQTT, repositorios (login, etc.)
│   ├── infrastructure/     IA (TensorFlow) y cámara
│   ├── presentation/       Pantallas y estado (stores)
│   └── shared/             Config, constantes, hooks
├── android/                Proyecto nativo Android
├── web/                    Dashboard web (React + Vite) -- LO QUE FUNCIONA HOY
│   ├── src/                Pantallas web, lógica y simuladores
│   └── public/model/       AQUÍ va el modelo de IA entrenado (web)
├── ml/                     Entrenamiento del modelo de IA (Python/Colab)
└── docs/                   Documentación (este archivo, arquitectura, etc.)
```

---

## 3. Estado actual: ¿qué funciona y qué está simulado?

**La versión WEB funciona completa** (con datos simulados) y es la más fácil de mostrar.

Casi todos los componentes "inteligentes" están **simulados** porque las piezas
reales (modelo de IA, broker MQTT, backend) aún no existen. Esto es normal: el
código ya está preparado con comentarios `TODO` en los lugares exactos donde se
conectan las piezas reales.

| Componente | Estado hoy | Dónde está en el código |
|------------|------------|-------------------------|
| Modelo de IA (clasificación) | ✅ LISTO en web (modelo real de 6 clases) · simulado aún en móvil | `web/src/lib/tfClassifier.ts` (web) / `src/infrastructure/ai/TensorFlowService.ts` (móvil) |
| Red IoT / MQTT | ✅ Infraestructura LISTA y verificada (broker + simulador) · falta activar cliente en la app móvil (requiere Android) | `mqtt/` (broker Docker), `simulation/iot_node_simulator.py`, `src/data/datasources/remote/mqtt/MqttClient.ts` |
| Contenedores | ✅ Simulador IoT real publicando c-001..c-005 vía MQTT | `simulation/iot_node_simulator.py` |
| Cámara móvil | Simulada | `src/infrastructure/camera/CameraService.ts` |
| Autenticación (login) | Simulada (en memoria) | `src/data/repositories/AuthRepositoryImpl.ts` |
| Backend / base de datos | No existe | - |

---

## 4. LO QUE FALTA POR HACER (ordenado por prioridad)

### TAREA 1 — Entrenar el modelo de IA ✅ HECHO (en web)

**Estado:** COMPLETADA para la web. El modelo ya está entrenado con las 6
clases (incluida orgánico) y funcionando en el escáner web con clasificación
real. Falta solo integrarlo en la app móvil (ver TAREA 4).

**Qué se hizo:**
1. Se entrenó en Google Colab con `ml/GreenNode_Entrenamiento.ipynb`.
2. Dataset: `mostafaabla/garbage-classification` (12 clases, ~15.150 imágenes)
   mapeadas a las 6 del proyecto.
3. Se exportó a `waste_classifier_v1.tflite` + `labels.json`.
4. Se copiaron a `web/public/model/`.

**El modelo ya está en:** `web/public/model/waste_classifier_v1.tflite`

**Para re-entrenar (si quieres mejorarlo):**
1. Sube `ml/GreenNode_Entrenamiento.ipynb` a Colab.
2. Activa GPU (T4) y ejecuta todas las celdas (~15-25 min).
3. Descarga `waste_classifier_v1.tflite` y `labels.json` (paso 13).
4. Cópialos a `web/public/model/` (sobrescribe) y recarga la web.
   El código lee `labels.json` y se adapta solo al número de clases.

- **Móvil:** copia `waste_classifier_v1.tflite` a `src/assets/models/`
  (ver TAREA 4).

---

### TAREA 2 — Red IoT / MQTT  🔶 PARCIAL (infraestructura lista y verificada)

**Estado:** La infraestructura MQTT está IMPLEMENTADA Y VERIFICADA funcionando de forma aislada (sin necesidad de Android). Solo falta activar el cliente MQTT dentro de la app React Native, que requiere el entorno Android (ver TAREA 4/5).

**Lo que YA está hecho y probado:**
- Broker MQTT (Eclipse Mosquitto) en Docker: `mqtt/docker-compose.yml` + `mqtt/mosquitto.conf`. Arranca con `cd mqtt && docker compose up -d` (puerto 1883, sin TLS, anónimo). Guía completa en `mqtt/README.md`.
- Simulador de nodos IoT en Python: `simulation/iot_node_simulator.py`. Publica telemetría de los contenedores c-001..c-005 (fill QoS 0, status QoS 1, alertas QoS 2). Umbral de alerta 90% (severidad medium en [90,97], high en >=98).
- Script de verificación end-to-end: `simulation/verify_e2e.py`. Confirmado en vivo: el suscriptor recibió los 5 mensajes de contenedores vía el broker → "Flujo Simulador → Broker → suscriptor CONFIRMADO".
- Ajuste en `src/data/datasources/remote/mqtt/IoTService.ts` (suscripción a alertas con QoS 2).
- Spec completo del trabajo en `.kiro/specs/mqtt-iot-integration/` (requirements, design, tasks).

**Cómo probar la red IoT (sin Android):**
1. `cd mqtt && docker compose up -d`  (requiere Docker Desktop corriendo)
2. En otra terminal: `pip install paho-mqtt` y `python simulation/verify_e2e.py --seconds 20`
3. En otra terminal: `python simulation/iot_node_simulator.py --nodes 5 --interval 3`
4. El verificador imprime los mensajes fill de c-001..c-005 y un resumen.

**Lo que FALTA (requiere entorno Android):**
- Instalar `npm install sp-react-native-mqtt` y activar los bloques TODO en `src/data/datasources/remote/mqtt/MqttClient.ts` para que la app use el cliente MQTT real en lugar del simulado. Está detallado en el spec (`.kiro/specs/mqtt-iot-integration/design.md`, sección MqttClient).

---

### TAREA 3 — Autenticación real

**Qué es:** hoy cualquier correo con contraseña de 6+ caracteres entra. No hay
usuarios reales.

**Cómo hacerlo (opción rápida: Firebase Auth):**
1. Crea un proyecto en https://console.firebase.google.com
2. Activa Authentication (correo/contraseña).
3. Instala: `npm install @react-native-firebase/app @react-native-firebase/auth`

**Dónde conectar:**
- `src/data/repositories/AuthRepositoryImpl.ts` → reemplaza la simulación en
  memoria por llamadas a `firebase/auth`. Los métodos ya están definidos
  (login, register, etc.), solo cambia su implementación interna.

---

### TAREA 4 — Cámara real en la app móvil

**Qué es:** en móvil la captura de foto está simulada (la web sí usa cámara real).

**Cómo hacerlo:**
1. Instala: `npm install react-native-vision-camera`
2. Instala también para IA: `npm install react-native-fast-tflite`

**Dónde conectar:**
- `src/infrastructure/camera/CameraService.ts` → descomenta los bloques
  `TODO: Descomentar con react-native-vision-camera`.
- `src/infrastructure/ai/TensorFlowService.ts` → descomenta los bloques
  `TODO: Descomentar cuando se instale react-native-fast-tflite` y coloca el
  `.tflite` en `src/assets/models/`.

---

### TAREA 5 — Poder ejecutar la app móvil (Android)

**Qué es:** hoy solo corre la versión web. Para la app móvil falta el entorno.

**Cómo hacerlo (requisitos):**
- Node.js >= 22.11.0  (ya instalado: v22.23.2 ✓)
- **JDK 17** (hay JDK 25 instalado, que puede dar problemas con Gradle;
  instalar el 17 en paralelo con `winget install EclipseAdoptium.Temurin.17.JDK`)
- **Android Studio + SDK**: API 36, Build-Tools 36.0.0, NDK 27.1.12297006
- Un emulador o un celular con depuración USB

**Comandos:**
```
npm install
npm start           # arranca Metro (en una terminal)
npm run android     # compila y corre en Android (en otra terminal)
```

---

### TAREA 6 — Backend y base de datos (opcional / avanzado)

**Qué es:** no hay servidor para guardar historial, usuarios, puntos ni las
correcciones del usuario. Hoy todo vive en memoria (se borra al recargar).

**Cómo hacerlo:**
- Crear una API REST (Node.js/Express, o usar Firebase Firestore).
- Guardar: historial de clasificaciones, feedback de usuarios (correcto/incorrecto
  + tipo real), usuarios y puntos.
- Esto habilita el ciclo de mejora del modelo: las correcciones de los usuarios
  se acumulan y sirven para reentrenar una versión mejor (ver sección 6).

---

## 5. Cómo ejecutar el dashboard web (lo que funciona hoy)

```
cd web
npm install
npx vite --port 5173 --host
```
Abre http://localhost:5173 en el navegador.

Para probarlo desde el **celular** (y usar la cámara), se necesita HTTPS.
Se puede exponer con un túnel:
```
cloudflared tunnel --url http://localhost:5173
```
Eso da una URL `https://...trycloudflare.com` que sí permite cámara en móvil.

---

## 6. Cómo mejora el modelo con el tiempo (contexto útil)

La app **no entrena el modelo**. El entrenamiento siempre es aparte (Colab).
Pero la pantalla de Escanear pide al usuario validar cada clasificación
(correcta/incorrecta + tipo real). Ese feedback:

```
Usuario corrige  →  se guarda (predicción, tipo_real, imagen)
                 →  se acumula en el backend (TAREA 6)
                 →  se reentrena el modelo en Colab con esos datos nuevos
                 →  se genera un nuevo .tflite / tfjs_model
                 →  se vuelve a cargar (TAREA 1)
```

Esto se llama "human-in-the-loop": los usuarios etiquetan datos reales y el
modelo mejora en la siguiente versión.

---

## 7. Resumen rápido (checklist)

- [x] **TAREA 1** — Modelo de IA entrenado (6 clases) y funcionando en la web.
      Falta solo integrarlo en móvil (parte de TAREA 4).
- [~] **TAREA 2** — Red IoT/MQTT: infraestructura (broker + simulador + verificación) LISTA y probada. Falta activar el cliente en la app móvil (requiere Android).
- [ ] **TAREA 3** — Autenticación real (Firebase)
- [ ] **TAREA 4** — Cámara e IA reales en la app móvil (librerías nativas)
- [ ] **TAREA 5** — Entorno Android (JDK 17 + Android Studio + SDK) para correr en móvil
- [ ] **TAREA 6** — Backend/base de datos (opcional)

**Prioridad mínima para una demo con IA real:** solo la TAREA 1 sobre la web.
Con eso el escáner web ya clasifica de verdad, sin necesidad de Android ni backend.

---

## 8. Documentos relacionados

- `docs/ARCHITECTURE.md` — arquitectura completa del sistema
- `docs/AI_MODEL.md` — especificación del modelo de IA
- `ml/README.md` — detalle del entrenamiento y preprocesamiento
- `ml/GreenNode_Entrenamiento.ipynb` — notebook listo para Colab
