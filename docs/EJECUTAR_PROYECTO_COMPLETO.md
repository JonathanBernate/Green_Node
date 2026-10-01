# Ejecutar el proyecto completo — GreenNode

Guía maestra para poner en marcha **todo lo que funciona hoy** de GreenNode en otro computador, desde cero. Está pensada para alguien que **no tiene Kiro**, pero sí tiene los programas base instalados (o sabe instalarlos). Todo en español, autosuficiente y paso a paso.

> **Qué se ejecuta hoy:** el **dashboard web** con **IA real** (clasificación de residuos) + la **red IoT por MQTT real** (contenedores en tiempo real sobre un mapa).
>
> **Qué NO está listo:** la **app móvil React Native** todavía no se puede ejecutar (falta la parte de Android). Se menciona solo como pendiente; esta guía **no** incluye instrucciones para ella.

---

## 1. Panorama general

GreenNode, en su estado actual, se compone de cuatro piezas que trabajan juntas:

| # | Componente | Carpeta | Para qué sirve |
|---|------------|---------|----------------|
| 1 | **Dashboard web** | `web/` | Interfaz principal: mapa IoT en tiempo real + escáner de residuos con IA. Corre en `http://localhost:5173`. |
| 2 | **Modelo de IA** | `web/public/model/` + `web/public/tflite-wasm/` | Clasificador de residuos. **Ya viene incluido en el repo.** No hay que entrenar nada. |
| 3 | **Broker MQTT** | `mqtt/` | Mosquitto en Docker. Distribuye los mensajes de los contenedores. Puertos **1883** (TCP) y **9001** (WebSocket). |
| 4 | **Simulador IoT** | `simulation/` | Script Python que emula contenedores físicos (`c-001`..`c-005`) publicando su nivel de llenado. |

### Flujo de datos

```
Simulador Python  ──►  Broker Mosquitto (Docker)  ──►  WebSocket (9001)  ──►  Navegador (mapa en tiempo real)
```

Si el broker **no** está corriendo, la web **cae automáticamente a una simulación interna**, así que el mapa igual muestra movimiento (pero sin datos "reales" del simulador).

---

## 2. Requisitos previos

Instala y ten listo lo siguiente **antes** de empezar:

- **Node.js 18 o superior** (recomendado **20** o **22**).
  - Si usas **nvm** en Windows, recuerda ejecutar `nvm use 22` **en cada terminal nueva** que abras.
- **npm** (viene con Node.js).
- **Docker Desktop** — debe estar **abierto y corriendo** antes de levantar el broker.
- **Python 3.10 o superior** con **pip**.
- **Git** (para clonar el repositorio).
- Un **navegador moderno** (Chrome, Edge o Firefox actualizados).
- **Internet** la primera vez que uses la IA (TensorFlow.js se descarga desde un CDN).

### Verificar versiones

Abre una terminal y comprueba:

```powershell
node -v      # v18.x o superior (ideal v20 / v22)
npm -v
docker -v
python --version
git --version
```

---

## 3. Obtener el proyecto

Clona el repositorio (o copia la carpeta completa a la otra máquina) y entra en él:

```powershell
git clone <URL_DEL_REPOSITORIO> t_nvdt_core_fork
cd t_nvdt_core_fork
```

A partir de aquí, **todos los comandos asumen que estás dentro de la carpeta raíz del proyecto** (`t_nvdt_core_fork`), salvo cuando se indique `cd` a una subcarpeta.

---

## 4. Arranque con varias terminales

La forma más clara de ejecutar todo es usar **tres terminales** en paralelo. Si usas **nvm**, corre `nvm use 22` al inicio de cada terminal que ejecute Node/npm.

### Terminal 1 — Broker MQTT (Docker)

Asegúrate de que **Docker Desktop esté abierto**, luego:

```powershell
cd mqtt
docker compose up -d
```

Esto levanta Mosquitto en segundo plano, escuchando en el puerto **1883** (TCP) y **9001** (WebSocket, que usa el navegador).

Para comprobar que quedó arriba:

```powershell
docker compose ps
```

### Terminal 2 — Simulador IoT (Python)

Instala la dependencia (solo la primera vez) y lanza el simulador:

```powershell
pip install paho-mqtt
python simulation/iot_node_simulator.py --nodes 5 --interval 3
```

Esto crea 5 contenedores virtuales (`c-001` a `c-005`) que publican su nivel de llenado cada 3 segundos. Déjalo corriendo.

### Terminal 3 — Dashboard web

```powershell
cd web
npm install
npm run dev
```

Cuando termine de arrancar, abre en el navegador:

```
http://localhost:5173
```

> `npm install` solo hace falta la primera vez (o cuando cambien las dependencias). Después basta con `npm run dev`.

### (Opcional) Verificador de extremo a extremo

En una cuarta terminal puedes validar que todo el circuito funciona:

```powershell
python simulation/verify_e2e.py --seconds 20
```

Escucha el tráfico durante 20 segundos y confirma que los mensajes fluyen del simulador al broker.

---

## 5. Probar que todo funciona

### Probar la IA (clasificación de residuos)

1. En la web, abre la pestaña **Escanear**.
2. Adjunta una imagen o usa la **cámara**.
3. Pulsa **Clasificar**.
4. Debe aparecer un badge que dice **"modelo real"** y una de las **6 clases** posibles.

> **Importante:** la **primera** clasificación necesita **internet**, porque TensorFlow.js se descarga desde un CDN. Después queda en caché del navegador.

### Probar el IoT (mapa en tiempo real)

1. Abre la pestaña **Mapa**.
2. Deberías ver los contenedores **en vivo**, actualizándose.
3. Abre la **consola del navegador** (tecla **F12**). Verás mensajes como:

```
[GreenNode] [MQTT] RECV <- .../fill
```

Eso confirma que el navegador está recibiendo datos reales del broker.

---

## 6. Verlo desde el celular (misma red WiFi)

El PC y el celular deben estar en la **misma red WiFi**. Hay dos opciones y cada una tiene un **trade-off**:

| Quiero... | Opción | Cámara (IA) | Mapa IoT en vivo |
|-----------|--------|:-----------:|:----------------:|
| Ver el mapa IoT | **A — IP local (HTTP)** | ❌ | ✅ |
| Usar la cámara | **B — Túnel HTTPS** | ✅ | ❌ |

### Opción A — Mapa IoT por IP local (HTTP)

1. Averigua la **IP local** del PC con:

   ```powershell
   ipconfig
   ```

   Usa la dirección **IPv4** del adaptador de la **WiFi** (algo como `192.168.x.x`).

2. Abre el **firewall** de Windows para los puertos necesarios. En una terminal **PowerShell como Administrador**:

   ```powershell
   New-NetFirewallRule -DisplayName "GreenNode Web 5173" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Private
   New-NetFirewallRule -DisplayName "GreenNode MQTT WS 9001" -Direction Inbound -Protocol TCP -LocalPort 9001 -Action Allow -Profile Private
   ```

3. En el celular, abre en el navegador:

   ```
   http://IP_LOCAL:5173
   ```

   (reemplaza `IP_LOCAL` por la IPv4 que obtuviste).

> Por **HTTP** la **cámara NO funciona** en el celular (los navegadores exigen HTTPS para la cámara), pero el **mapa IoT SÍ** funciona.

### Opción B — Cámara por HTTPS (túnel)

Levanta un túnel HTTPS hacia tu web local con **cloudflared**:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Te dará una **URL `https://...`** que puedes abrir en el celular. Con HTTPS la **cámara sí funciona**.

> El trade-off: por el túnel, el **MQTT en vivo no llega** (necesitaría el broker expuesto por `wss://`). Es decir: **cámara → túnel; mapa IoT → IP local**.

---

## 7. Solución de problemas (troubleshooting)

**`node` no se reconoce / versión vieja**
- Instala Node.js 18+ (ideal 20/22). Si usas nvm: `nvm use 22` en la terminal actual (hay que hacerlo en cada terminal nueva).

**Docker no responde / error al hacer `docker compose up`**
- Abre **Docker Desktop** y espera a que diga que está corriendo. Luego reintenta.

**Puerto ocupado (5173, 1883 o 9001)**
- Busca qué proceso lo usa y libéralo, o cambia el puerto:

  ```powershell
  netstat -ano | findstr 5173
  taskkill /PID <NUMERO_DE_PID> /F
  ```

**El escáner dice "simulación" o da error `_malloc`**
- Falta la carpeta `web/public/tflite-wasm/`, o no hay **internet** para descargar el CDN la primera vez. Verifica que exista `web/public/tflite-wasm/` y que tengas conexión.

**La cámara no funciona**
- La cámara requiere **HTTPS**. En el PC funciona en `localhost` (se considera seguro); en el celular por IP (HTTP) **no**. Usa el túnel HTTPS (Opción B) si necesitas cámara en el celular.

**El mapa no muestra datos**
- Deben estar corriendo **ambos**: el **broker** (Docker, Terminal 1) y el **simulador Python** (Terminal 2). Sin ellos, la web cae a simulación interna o queda sin datos reales.

---

## 8. Resumen ultra-rápido

Secuencia mínima de comandos (una pieza por terminal; con nvm, `nvm use 22` primero en las de Node):

```powershell
# Terminal 1 — Broker (Docker Desktop debe estar abierto)
cd mqtt
docker compose up -d

# Terminal 2 — Simulador IoT
pip install paho-mqtt
python simulation/iot_node_simulator.py --nodes 5 --interval 3

# Terminal 3 — Web
cd web
npm install
npm run dev
```

Luego abre: **http://localhost:5173**

---

## 9. Documentos relacionados

- [`docs/COMO_EJECUTAR.md`](./COMO_EJECUTAR.md) — guía de ejecución.
- [`docs/GUIA_PENDIENTES.md`](./GUIA_PENDIENTES.md) — qué falta por hacer (incluye la app móvil).
- [`mqtt/README.md`](../mqtt/README.md) — detalles del broker Mosquitto.
- [`ml/README.md`](../ml/README.md) — detalles del modelo de IA.
