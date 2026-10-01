# Requisitos del proyecto GreenNode

Este documento describe **exclusivamente los requisitos y requerimientos** necesarios para ejecutar el proyecto GreenNode.

> **Qué funciona hoy:** el **dashboard WEB** (React + Vite) con IA real (clasificación de residuos con TensorFlow.js / TFLite en el navegador) conectado a una **red IoT MQTT** real (broker MQTT en Docker + simulador IoT en Python).
>
> La **app móvil React Native NO está lista** (requiere Android). Sus requisitos se listan aparte en la [sección 8](#8-requisitos-adicionales-solo-si-se-quiere-la-app-móvil-pendiente-no-requerido-para-la-demo-web) como "pendiente".

---

## 1. Resumen de requisitos

| Software | Versión mínima | Versión recomendada / probada | Para qué se usa | Obligatorio / Opcional |
|---|---|---|---|---|
| Node.js | 18+ | 20 o 22 LTS (probado **22.23.2**) | Ejecutar el dashboard web | **Obligatorio** |
| npm | 9+ | 10+ (probado **10.9.8**) | Instalar dependencias web | **Obligatorio** (viene con Node) |
| Docker Desktop | — | 29.x (probado **29.6.1**) | Broker MQTT (red IoT) | **Obligatorio** para la red IoT real |
| Python | 3.10+ | 3.12 / 3.14 (probado **3.14.3**) | Simulador IoT y módulo de evaluación de red | **Obligatorio** para red IoT y métricas de red |
| pip | — | el que trae Python | Instalar librerías Python | **Obligatorio** (viene con Python) |
| Git | cualquiera | 2.45+ (probado **2.45.1**) | Clonar el repositorio | Recomendado |
| Navegador | Chrome / Edge / Firefox recientes | — | Abrir la app web | **Obligatorio** |
| Conexión a internet | — | — | 1ª vez: TensorFlow.js desde CDN; descargar imagen Docker; instalar dependencias | **Obligatorio la 1ª vez** |

---

## 2. Dependencias de software por componente

### 2.1 Dashboard web (carpeta `web/`) — se instalan con `npm install`

Dependencias principales declaradas en `web/package.json`:

| Dependencia | Versión | Para qué sirve |
|---|---|---|
| `react` | 19 | Librería de interfaz de usuario |
| `react-dom` | 19 | Renderizado de React en el navegador |
| `vite` | 6 | Servidor de desarrollo y empaquetado |
| `@vitejs/plugin-react` | — | Integración de React con Vite |
| `typescript` | — | Tipado estático del proyecto web |
| `@tensorflow/tfjs` | 4.22 | Motor de IA en el navegador |
| `mqtt` | 5.10 | Cliente MQTT sobre WebSocket (conexión con el broker) |

> **Nota:** `@tensorflow/tfjs-tflite` **NO** está en `package.json`. El runtime **WASM de TFLite ya viene incluido** en `web/public/tflite-wasm/`, y **TensorFlow.js se carga desde CDN** la primera vez (por eso hace falta internet la 1ª vez).

Comando de instalación:

```powershell
cd web
npm install
```

### 2.2 Simulador IoT y utilidades (Python) — se instalan con pip

| Librería | Para qué sirve | Obligatoria |
|---|---|---|
| `paho-mqtt` | Cliente MQTT del simulador y del verificador | Sí |
| `numpy` | Cálculos del módulo de evaluación de red (`network/network_evaluation.py`) | Sí |
| `matplotlib` | Gráficas del módulo de evaluación de red | Sí |
| `hypothesis` | Solo para los *property tests* | Opcional |

Comando de instalación:

```powershell
pip install paho-mqtt numpy matplotlib hypothesis
```

### 2.3 Broker MQTT

- Imagen Docker **`eclipse-mosquitto:2`**.
- Se descarga **automáticamente** al ejecutar `docker compose up` (requiere internet la 1ª vez).
- **No requiere instalación manual.**

---

## 3. Artefactos que YA vienen en el repositorio (no hay que generarlos)

| Artefacto | Ubicación |
|---|---|
| Modelo de IA | `web/public/model/waste_classifier_v1.tflite` + `labels.json` |
| Runtime WASM de TFLite | `web/public/tflite-wasm/` |
| Configuración del broker | `mqtt/docker-compose.yml` + `mqtt/mosquitto.conf` |

Por eso **NO hay que entrenar el modelo de IA** ni **configurar el broker MQTT a mano**: ambos vienen listos en el repositorio. El modelo ya fue entrenado (paso aparte, ya hecho) y la configuración del broker es la que se usa automáticamente al levantar Docker.

---

## 4. Puertos de red usados

| Puerto | Protocolo | Uso |
|---|---|---|
| 5173 | TCP | Dashboard web (servidor de desarrollo Vite) |
| 1883 | TCP | Broker MQTT nativo (simulador Python, app React Native) |
| 9001 | TCP | Broker MQTT sobre WebSocket (dashboard web / navegador) |

> **Nota:** estos puertos deben estar **libres**. Si se quiere acceder desde el **celular en la misma red WiFi**, hay que abrir los puertos **5173** y **9001** en el firewall. Ver [`docs/EJECUTAR_PROYECTO_COMPLETO.md`](EJECUTAR_PROYECTO_COMPLETO.md).

---

## 5. Requisitos de hardware (orientativos)

- **Web + IA en navegador:** cualquier PC moderno. La inferencia TFLite corre en **CPU vía WASM**. Se recomiendan **4+ GB de RAM**.
- **Docker Desktop:** requiere **virtualización habilitada** (WSL2 en Windows). **4+ GB de RAM**.
- **No requiere GPU** para ejecutar. La GPU solo se usó para **ENTRENAR** el modelo en Google Colab, que es un paso aparte y **ya está hecho**.

---

## 6. Comandos de verificación

Ejecuta este bloque en **PowerShell** para comprobar que tienes todo instalado:

```powershell
node -v
npm -v
python --version
pip --version
docker -v
git --version
```

Qué deberías ver como mínimo en cada uno:

| Comando | Resultado mínimo esperado | Probado con |
|---|---|---|
| `node -v` | v18 o superior | v22.23.2 |
| `npm -v` | 9 o superior | 10.9.8 |
| `python --version` | Python 3.10 o superior | Python 3.14.3 |
| `pip --version` | cualquier versión (viene con Python) | — |
| `docker -v` | cualquier versión reciente | 29.6.1 |
| `git --version` | cualquier versión (recomendado 2.45+) | 2.45.1 |

> **Nota (Windows con nvm):** si `node -v` muestra una versión vieja, ejecuta:
> ```powershell
> nvm use 22
> ```

---

## 7. Checklist rápido

- [ ] Node.js 18+ instalado (`node -v`)
- [ ] npm funcionando (`npm -v`)
- [ ] Python 3.10+ con pip (`python --version`)
- [ ] Docker Desktop instalado y **CORRIENDO** (`docker -v` y la app abierta)
- [ ] Git instalado (`git --version`)
- [ ] Dependencias web instaladas (`cd web && npm install`)
- [ ] Dependencias Python instaladas (`pip install paho-mqtt numpy matplotlib`)
- [ ] Puertos 5173, 1883, 9001 libres
- [ ] Navegador moderno disponible
- [ ] Internet disponible (1ª vez)

---

## 8. Requisitos adicionales SOLO si se quiere la app móvil (pendiente, no requerido para la demo web)

> ⚠️ Nada de esta sección hace falta para **ejecutar el dashboard web**, que es lo que funciona hoy. Se lista como referencia para el trabajo futuro de la app móvil React Native.

- **JDK 17**
- **Android Studio + SDK**: API 36, Build-Tools 36.0.0, NDK 27.1.12297006
- **Emulador Android** o **dispositivo físico** con depuración USB habilitada
- **Librerías nativas pendientes:**
  - `react-native-vision-camera`
  - `react-native-fast-tflite`
  - `sp-react-native-mqtt`

Estos requisitos **NO** son necesarios para la demo web actual.

---

## 9. Documentos relacionados

- [`docs/EJECUTAR_PROYECTO_COMPLETO.md`](EJECUTAR_PROYECTO_COMPLETO.md) — cómo arrancar todo
- [`docs/DETENER_PROYECTO.md`](DETENER_PROYECTO.md) — cómo detener todo
- [`docs/COMO_EJECUTAR.md`](COMO_EJECUTAR.md) — solo web
- [`docs/GUIA_PENDIENTES.md`](GUIA_PENDIENTES.md) — qué falta
