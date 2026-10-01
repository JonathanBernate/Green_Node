import io
import os

import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

from labels import map_label

MODEL_ID = os.getenv("WASTE_MODEL_ID", "watersplash/waste-classification")


class WasteClassifier:
    def __init__(self, model_id: str = MODEL_ID):
        if torch.cuda.is_available():
            self.device = "cuda"
        elif torch.backends.mps.is_available():
            self.device = "mps"
        else:
            self.device = "cpu"
        self.processor = AutoImageProcessor.from_pretrained(model_id)
        self.model = AutoModelForImageClassification.from_pretrained(model_id).to(self.device).eval()
        self.id2label = self.model.config.id2label
        self.model_id = model_id
        self.predict(Image.new("RGB", (224, 224)))  # warm-up

    @torch.no_grad()
    def predict(self, image: Image.Image) -> dict:
        inputs = self.processor(images=image.convert("RGB"), return_tensors="pt").to(self.device)
        probs = torch.softmax(self.model(**inputs).logits[0], dim=-1).cpu()
        top = torch.topk(probs, k=min(3, probs.numel()))

        def entry(p: float, i: int) -> dict:
            label = self.id2label[i]
            return {"label": label, "confidence": round(p, 4), **map_label(label)}

        top3 = [entry(p.item(), i.item()) for p, i in zip(top.values, top.indices)]
        return {**top3[0], "top3": top3}

    def predict_bytes(self, data: bytes) -> dict:
        return self.predict(Image.open(io.BytesIO(data)))
