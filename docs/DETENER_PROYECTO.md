# Detener el proyecto — GreenNode

Guía para **apagar de forma ordenada** todo lo que queda corriendo después de una demo de GreenNode. Es el complemento de [`docs/EJECUTAR_PROYECTO_COMPLETO.md`](EJECUTAR_PROYECTO_COMPLETO.md): aquello explica cómo arrancar todo, esto explica cómo detenerlo sin dejar procesos ni puertos ocupados.

> **Importante:** detener estos procesos **no borra nada** del proyecto. El código, el modelo de IA, los documentos y la configuración quedan intactos. Solo se liberan los recursos que estaban en ejecución (contenedores, procesos y puertos).

---

## Qué puede estar corriendo durante una demo

Durante una demo es normal tener activos, al mismo tiempo, estos procesos:

| # | Proceso | Cómo se levantó | Puertos |
|---|---------|-----------------|---------|
| 1 | **Broker MQTT Mosquitto** (contenedor `greennode-mosquitto`) | `docker compose up -d` desde la carpeta `mqtt/` | 1883 y 9001 |
| 2 | **Simulador IoT** (Python) | `python simulation/iot_node_simulator.py ...` | — |
| 3 | **Dev server web** (Vite) | `npm run dev` desde la carpeta `web/` | 5173 |
| 4 | **Túnel HTTPS** (opcional) | `cloudflared tunnel --url http://localhost:5173` | — |
| 5 | **Reglas de firewall** (opcional) | creadas para probar desde el celular | 5173 y 9001 |

---

## Orden recomendado de apagado

### 1. Detener el broker MQTT (Docker)

Desde la carpeta `mqtt/`:

```powershell
cd mqtt
docker compose down
```

Esto **detiene y elimina** el contenedor `greennode-mosquitto` y su red. Verifica que ya no esté corriendo con:

```powershell
docker ps --filter name=greennode-mosquitto
```

No debe aparecer nada.

> **Nota:** `docker compose down` elimina el contenedor pero **NO** la imagen descargada (`eclipse-mosquitto:2` queda en caché para la próxima vez, lo cual es bueno). Si quisieras eliminar también los volúmenes: `docker compose down -v`. No es necesario aquí porque la persistencia está desactivada.

---

### 2. Detener el simulador Python

Si está en una terminal **en primer plano**: pulsa **`Ctrl + C`** (hace una desconexión ordenada del broker).

Si quedó **en segundo plano**, búscalo y detenlo:

```powershell
Get-Process python | Select-Object Id, StartTime
Stop-Process -Id <PID> -Force
```

Reemplaza `<PID>` por el identificador del proceso del simulador.

---

### 3. Detener el dev server web (Vite)

Si está en una terminal **en primer plano**: pulsa **`Ctrl + C`**.

Si quedó **en segundo plano**:

```powershell
Get-Process node | Select-Object Id
Stop-Process -Id <PID> -Force
```

> **Advertencia:** `Stop-Process` sobre `node` detiene **TODOS** los procesos Node. Si tienes otros proyectos Node abiertos, es mejor identificar el PID correcto por el puerto:
>
> ```powershell
> netstat -ano | findstr 5173
> ```
>
> La **última columna** es el PID. Detén ese en concreto:
>
> ```powershell
> Stop-Process -Id <PID> -Force
> ```

---

### 4. Detener el túnel (si se usó)

Pulsa **`Ctrl + C`** en la terminal de `cloudflared`. Es un proceso en primer plano, así que esto basta para cerrarlo.

---

### 5. Quitar las reglas de firewall de la demo (opcional, recomendado por seguridad)

Si creaste reglas de firewall para probar desde el celular, elimínalas cuando ya no las necesites. Abre **PowerShell como Administrador** y ejecuta:

```powershell
Remove-NetFirewallRule -DisplayName "GreenNode Web 5173"
Remove-NetFirewallRule -DisplayName "GreenNode MQTT WS 9001"
```

---

## Verificación de que todo quedó detenido

```powershell
docker ps --filter name=greennode-mosquitto    # vacío
netstat -ano | findstr "1883 9001 5173"          # sin LISTENING (los TIME_WAIT desaparecen solos)
Get-Process node,python -ErrorAction SilentlyContinue   # solo lo que no sea de la demo
```

- `docker ps ...` no debe listar nada.
- `netstat ...` no debe mostrar líneas en estado **LISTENING** para esos puertos. Si ves estados **TIME_WAIT**, es normal: desaparecen solos en unos segundos.
- `Get-Process node,python` solo debe mostrar procesos que **no** sean de la demo.

---

## Apagado rápido (todo de una)

Secuencia mínima para dejar todo detenido:

```powershell
cd mqtt; docker compose down; cd ..
# Ctrl+C en las terminales del simulador, dev server y túnel
```

---

## Notas

- Detener estos procesos **NO borra nada** del proyecto: el código, el modelo de IA, los documentos y la configuración permanecen intactos. Solo se liberan los recursos en ejecución.
- La próxima vez, para volver a arrancar todo, sigue [`docs/EJECUTAR_PROYECTO_COMPLETO.md`](EJECUTAR_PROYECTO_COMPLETO.md).
- Docker Desktop puede dejarse abierto o cerrarse; cerrarlo libera memoria.

---

## Documento relacionado

- [`docs/EJECUTAR_PROYECTO_COMPLETO.md`](EJECUTAR_PROYECTO_COMPLETO.md) — guía para **arrancar** todo el proyecto desde cero.
