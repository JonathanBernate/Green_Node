# Clasificador en vivo (Python)

Servicio FastAPI que sirve el modelo de Hugging Face
[`watersplash/waste-classification`](https://huggingface.co/watersplash/waste-classification)
(ViT, 12 clases) y lo mapea a: orgánico, reciclable, no reciclable y peligroso (ver `labels.py`).

```bash
cd realtime
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8765   # el 8000 lo usa Laravel
```

Luego `cd web && npm run dev` y abre la pestaña **Escanear → ⚡ En vivo**.
Vite redirige `/live/*` (HTTP y WebSocket) a `localhost:8765`, por lo que también
funciona por túnel HTTPS desde el celular. Para otro host: `VITE_LIVE_API_URL`.

- `GET /health`, `POST /predict` (multipart `file`), `WS /ws/predict` (frames JPEG binarios).
- Otro modelo: `WASTE_MODEL_ID=<repo-hf> uvicorn ...` y ajusta `labels.py`.
