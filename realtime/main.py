"""Servicio de clasificación de residuos en tiempo real.

Ejecutar:  uvicorn main:app --host 0.0.0.0 --port 8000
"""
import asyncio
import base64
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from classifier import WasteClassifier

state: dict = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    state["clf"] = WasteClassifier()  # el modelo se carga una sola vez
    print(f"[GreenNode] Modelo {state['clf'].model_id} listo en {state['clf'].device}")
    yield


app = FastAPI(title="Green Node - Clasificador en vivo", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    clf = state["clf"]
    return {"status": "ok", "model": clf.model_id, "device": clf.device}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    try:
        t0 = time.perf_counter()
        result = await asyncio.to_thread(state["clf"].predict_bytes, data)
    except Exception:
        raise HTTPException(status_code=400, detail="Imagen inválida")
    return {**result, "inference_ms": round((time.perf_counter() - t0) * 1000), "model": state["clf"].model_id}


@app.websocket("/ws/predict")
async def ws_predict(ws: WebSocket):
    """Recibe frames JPEG binarios (o data-URL base64 en texto) y responde JSON.

    El cliente envía un frame y espera la respuesta antes de enviar el siguiente,
    así nunca se acumula latencia.
    """
    await ws.accept()
    try:
        while True:
            msg = await ws.receive()
            if msg.get("type") == "websocket.disconnect":
                break
            data = msg.get("bytes")
            if data is None and msg.get("text"):
                data = base64.b64decode(msg["text"].split(",")[-1])
            if not data:
                continue
            try:
                t0 = time.perf_counter()
                result = await asyncio.to_thread(state["clf"].predict_bytes, data)
                result["inference_ms"] = round((time.perf_counter() - t0) * 1000)
                result["model"] = state["clf"].model_id
                await ws.send_json(result)
            except Exception as e:
                await ws.send_json({"error": str(e)})
    except WebSocketDisconnect:
        pass
