"""Mapeo de las clases del modelo de Hugging Face a las categorías de Green Node.

Modelo por defecto: watersplash/waste-classification (ViT, 12 clases).
Si cambias de modelo (variable WASTE_MODEL_ID), ajusta este diccionario.

group:
  organico | reciclable | no_reciclable | peligroso
waste_type: valor del enum WasteType del frontend (None si no tiene equivalente).
"""

LABEL_MAP: dict[str, dict] = {
    "biological":  {"group": "organico",      "waste_type": "organic"},
    "cardboard":   {"group": "reciclable",    "waste_type": "paper"},
    "paper":       {"group": "reciclable",    "waste_type": "paper"},
    "plastic":     {"group": "reciclable",    "waste_type": "plastic"},
    "metal":       {"group": "reciclable",    "waste_type": "metal"},
    "brown-glass": {"group": "reciclable",    "waste_type": "glass"},
    "green-glass": {"group": "reciclable",    "waste_type": "glass"},
    "white-glass": {"group": "reciclable",    "waste_type": "glass"},
    "battery":     {"group": "peligroso",     "waste_type": "special"},
    "clothes":     {"group": "no_reciclable", "waste_type": None},
    "shoes":       {"group": "no_reciclable", "waste_type": None},
    "trash":       {"group": "no_reciclable", "waste_type": None},
}

DEFAULT = {"group": "no_reciclable", "waste_type": None}


def map_label(label: str) -> dict:
    return LABEL_MAP.get(label.lower(), DEFAULT)
