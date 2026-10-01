# GreenNode · Cómo ejecutar en tu propio computador

Guía paso a paso para clonar el proyecto y levantarlo desde cero, escrita para
alguien que no conoce el proyecto. La versión que funciona hoy es el
**dashboard web** (incluye el clasificador de residuos con IA real).

---

## Requisitos previos

| Herramienta | Versión | Para qué |
|-------------|---------|----------|
| **Node.js** | 18 o superior (recomendado 20/22 LTS) | Ejecutar la web |
| **npm** | viene con Node | Instalar dependencias |
| **Git** | cualquiera | Clonar el repositorio |
| Navegador | Chrome/Edge/Firefox reciente | Abrir la app |

Verifica que tienes Node y npm:
```bash
node -v
npm -v
```
Si `node -v` muestra una versión menor a 18, actualiza Node desde
https://nodejs.org (instala la versión LTS).

> Solo la app **móvil** (Android) necesita JDK 17 + Android Studio. Para la
> versión web NO hace falta nada de eso.

---

## Paso 1 — Clonar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd t_nvdt_core_fork
```

(Si te pasaron el proyecto como carpeta comprimida, solo descomprímela y entra
a la carpeta.)

---

## Paso 2 — Instalar dependencias de la web

La web vive en la subcarpeta `web/`. Instala sus dependencias ahí:

```bash
cd web
npm install
```

Esto descarga todo lo necesario (React, Vite, TensorFlow.js). Tarda 1-3 min la
primera vez.

---

## Paso 3 — Ejecutar el servidor de desarrollo

Desde la carpeta `web/`:

```bash
npm run dev
```

Verás algo como:
```
VITE v6.x  ready
➜  Local:   http://localhost:5173/
```

Abre **http://localhost:5173** en el navegador. Inicia sesión con cualquier
correo válido y una contraseña de 6+ caracteres (la autenticación es simulada).

---

## Paso 4 — Verificar que la IA funciona

Ve a la pestaña **Escanear**:
- Arriba debe decir **"· modelo real"** en verde.
- Adjunta una imagen o usa la cámara y pulsa **Clasificar**.
- Debe mostrar el tipo de residuo con su confianza y el desglose de 6 clases.

Si aparece un banner rojo de error o dice "simulación", revisa la sección de
Problemas comunes más abajo.

---

## ¿Qué archivos hacen que la IA funcione?

Estos archivos **ya vienen en el repositorio** (no hay que generarlos):

```
web/public/model/
├── waste_classifier_v1.tflite   ← el modelo entrenado (6 clases)
└── labels.json                  ← orden de las clases

web/public/tflite-wasm/          ← runtime WebAssembly de TFLite
├── tflite_web_api_cc.wasm
├── tflite_web_api_cc.js
└── ... (otros binarios)
```

- El modelo se carga desde `/model/waste_classifier_v1.tflite`.
- El runtime WASM se sirve **localmente** desde `/tflite-wasm/` (no de un CDN),
  para funcionar en redes que bloquean CDNs externos.
- TensorFlow.js sí se carga desde CDN (necesita internet la primera vez).

> **Importante:** la primera clasificación necesita **conexión a internet**
> porque descarga TensorFlow.js desde un CDN. El modelo y el WASM son locales.

---

## Cómo probarlo desde el CELULAR

La cámara del celular requiere **HTTPS**, y `localhost` no sirve desde otro
dispositivo. Usa un túnel HTTPS. La opción más fiable es **Cloudflare Tunnel**:

1. Descarga `cloudflared` (un solo ejecutable):
   https://github.com/cloudflare/cloudflared/releases
2. Con el servidor web corriendo (`npm run dev`), en otra terminal:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
3. Te da una URL `https://algo.trycloudflare.com`. Ábrela en el celular.

El proyecto ya permite estos dominios de túnel en `web/vite.config.ts`
(`allowedHosts`). Si usas otro servicio de túnel, agrégalo ahí.

---

## Cómo entrenar / re-entrenar el modelo (opcional)

Solo si quieres generar un modelo nuevo. Se hace en Google Colab (gratis, con
GPU), no en tu PC. Ver `ml/README.md` y `ml/GreenNode_Entrenamiento.ipynb`.

Resumen:
1. Sube `ml/GreenNode_Entrenamiento.ipynb` a Colab, activa GPU y ejecútalo.
2. Descarga `waste_classifier_v1.tflite` y `labels.json`.
3. Cópialos a `web/public/model/` (sobrescribe) y recarga la web.

---

## Problemas comunes

**"node no se reconoce" / versión vieja de Node**
Instala Node LTS desde nodejs.org. En Windows con `nvm`, ejecuta
`nvm use 20` (o 22) en cada terminal, o fíjalo como predeterminado.

**El escáner dice "simulación" o sale banner rojo `_malloc`**
Significa que el runtime WASM no cargó. Verifica que exista la carpeta
`web/public/tflite-wasm/` con los archivos `.wasm`. Si falta, cópiala desde
`web/node_modules/@tensorflow/tfjs-tflite/wasm/` (tras un `npm install`), o
pídela a quien te compartió el proyecto.

**La primera clasificación falla sin internet**
TensorFlow.js se carga desde CDN. Conéctate a internet al menos la primera vez.

**La cámara no funciona en el celular**
Necesita HTTPS. Usa un túnel (ver sección del celular). En `localhost` (PC) sí
funciona sin HTTPS.

**El puerto 5173 está ocupado**
Cambia el puerto: `npm run dev -- --port 5174`.

---

## Resumen ultra-rápido

```bash
git clone <URL> && cd t_nvdt_core_fork/web
npm install
npm run dev
# abre http://localhost:5173
```

Eso es todo para la web. El modelo de IA ya viene incluido en el repositorio.
