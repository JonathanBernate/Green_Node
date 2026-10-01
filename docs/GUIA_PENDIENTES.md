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
| Modelo de IA (clasificación) | Simulado (resultados aleatorios) | `src/infrastructure/ai/TensorFlowService.ts` |
| Cliente MQTT | Simulado | `src/data/datasources/remote/mqtt/MqttClient.ts` |
| Cámara móvil | Simulada | `src/infrastructure/camera/CameraService.ts` |
| Autenticación (login) | Simulada (en memoria) | `src/data/repositories/AuthRepositoryImpl.ts` |
| Contenedores | Datos de ejemplo (mock) | `src/presentation/store/containerStore.ts` |
| Backend / base de datos | No existe | - |

---

## 4. LO QUE FALTA POR HACER (ordenado por prioridad)

### TAREA 1 — Entrenar el modelo de IA (lo más importante)

**Qué es:** generar el modelo que clasifica los residuos. Sin esto, la app
inventa los resultados.

**Cómo hacerlo (Google Colab, gratis):**
1. Entra a https://colab.research.google.com e inicia sesión con Google.
2. `Archivo → Subir cuaderno` → sube `ml/GreenNode_Entrenamiento.ipynb`.
3. `Entorno de ejecución → Cambiar tipo de entorno → GPU (T4)`.
4. `Entorno de ejecución → Ejecutar todas`. Tarda ~10-20 minutos.
5. Al final se descargan 3 archivos:
   - `waste_classifier_v1.tflite`  (para la app móvil)
   - `tfjs_model.zip`              (para la web)
   - `labels.json`                 (orden de las clases)

**Dónde cargar el resultado:**
- **Web:** descomprime `tfjs_model.zip` y copia su contenido
  (`model.json` + archivos `.bin`) dentro de:
  ```
  web/public/model/
  ```
  Al recargar la web, el escáner detecta el modelo solo y pasa de
  "simulación" a "modelo real". No hay que tocar código.

- **Móvil:** copia `waste_classifier_v1.tflite` a `src/assets/models/`
  (ver TAREA 4).

> Detalle importante: el dataset TrashNet **no trae la clase "orgánico"**.
> El modelo se entrenará con 5 clases. Para tener orgánico, sube imágenes de
> comida/compost a la carpeta `greennode_dataset/organic/` en Colab antes de
> ejecutar el paso 5 del notebook. Está explicado en `ml/README.md`.

---

### TAREA 2 — Montar el broker MQTT (red IoT real)

**Qué es:** el servidor que conecta los contenedores con la app. Hoy los datos
de llenado son inventados.

**Cómo hacerlo:**
1. Instala un broker MQTT. La opción más simple es **Mosquitto** con Docker:
   ```
   docker run -it -p 1883:1883 eclipse-mosquitto
   ```
2. Crea un **simulador de contenedores** en Python que publique niveles de
   llenado al broker (un script que cada X segundos envíe un mensaje al topic
   `greennode/containers/{id}/fill`).

**Dónde conectar en el código:**
- `src/data/datasources/remote/mqtt/MqttClient.ts` → busca los comentarios
  `TODO: Descomentar cuando se instale sp-react-native-mqtt` y activa el código
  real (está justo debajo, comentado).
- Instala la librería: `npm install sp-react-native-mqtt`
- La dirección del broker se configura en `src/shared/config/environment.ts`
  (campo `mqttBrokerUrl`).

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

- [ ] **TAREA 1** — Entrenar modelo en Colab (`ml/GreenNode_Entrenamiento.ipynb`)
      y copiar resultado a `web/public/model/` (web) y `src/assets/models/` (móvil)
- [ ] **TAREA 2** — Montar broker MQTT + simulador Python de contenedores
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
