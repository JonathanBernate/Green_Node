# GreenNode · Entrenamiento del modelo de clasificación de residuos

Este directorio contiene el pipeline para entrenar el modelo de IA real
(MobileNetV2 + transfer learning) que clasifica residuos en 6 categorías,
siguiendo las especificaciones de `docs/AI_MODEL.md`.

El modelo se entrena **una sola vez, fuera de la app** (en Google Colab o un
PC con GPU). La aplicación solo *carga* el modelo ya entrenado y lo ejecuta.

```
ENTRENAMIENTO (Python, offline)        USO / INFERENCIA (app)
  train_waste_classifier.py    ─────▶  Web: TensorFlow.js
  MobileNetV2 + TrashNet         .tflite / tfjs   Móvil: react-native-fast-tflite
```

---

## 1. Entrenar el modelo (Google Colab, recomendado)

1. Abre [Google Colab](https://colab.research.google.com/).
2. `Entorno de ejecución → Cambiar tipo de entorno → GPU (T4)`.
3. Sube `train_waste_classifier.py` o copia sus secciones (marcadas con `# %%`)
   como celdas.
4. Instala dependencias en la primera celda:
   ```python
   !pip install -q tensorflow tensorflowjs kagglehub
   ```
5. Descarga el dataset TrashNet:
   ```python
   import kagglehub
   path = kagglehub.dataset_download("feyzazkefe/trashnet")
   import os
   os.environ["TRASHNET_DIR"] = path + "/dataset-resized"
   ```
6. Ejecuta el resto del script. Al terminar genera:
   - `waste_classifier_v1.tflite` → para la app móvil
   - `tfjs_model/` (`model.json` + `*.bin`) → para la web
   - `labels.json` → orden de las 6 clases

7. Descarga los resultados (últimas celdas del script):
   ```python
   from google.colab import files
   files.download('waste_classifier_v1.tflite')
   !zip -r tfjs_model.zip tfjs_model
   files.download('tfjs_model.zip')
   ```

### Nota sobre las clases

El orden de clases es **fijo** y debe coincidir con el enum `WasteType` de la app:

```
0=organic  1=plastic  2=paper  3=glass  4=metal  5=special
```

TrashNet base **no incluye "orgánico"**; el script mapea `trash → special`.
Para tener la clase orgánico con datos reales, agrega imágenes de residuos
orgánicos a `greennode_dataset/organic/` antes de entrenar, o usa un dataset
que la incluya (p. ej. combinar TrashNet con imágenes de compost/comida).

---

## 2. Colocar el modelo en la WEB

Copia el contenido de `tfjs_model/` dentro de `web/public/model/`:

```
web/public/model/
├── model.json
├── group1-shard1of4.bin
├── group1-shard2of4.bin
└── ...
```

Al recargar la web, el escáner detecta el modelo automáticamente
(`isModelAvailable()` hace un `HEAD` a `/model/model.json`):

- Si existe → clasifica con el **modelo real** (badge "modelo real" en la UI).
- Si no existe → usa la **simulación** (badge "simulación").

No hay que tocar código: el fallback es automático.

---

## 3. Colocar el modelo en la app MÓVIL (React Native)

1. Copia `waste_classifier_v1.tflite` a `src/assets/models/`.
2. Instala la librería nativa:
   ```
   npm install react-native-fast-tflite
   ```
3. En `src/infrastructure/ai/TensorFlowService.ts`, descomenta el bloque real
   de `loadTensorflowModel(...)` y `this.model.run(...)` (ya está preparado con
   `TODO`).

---

## Preprocesamiento (importante)

Tanto la web como el móvil deben aplicar el **mismo** preprocesamiento que el
entrenamiento, o las predicciones saldrán mal:

- Redimensionar a **224×224**
- Normalizar con `x / 127.5 - 1` → rango **[-1, 1]** (MobileNetV2)

En la web esto ya está implementado en `web/src/lib/tfClassifier.ts`.

---

## Métricas objetivo (según `docs/AI_MODEL.md`)

| Métrica    | Objetivo |
|------------|----------|
| Accuracy   | ≥ 92%    |
| Precision  | ≥ 90% por clase |
| Recall     | ≥ 88% por clase |
| F1-Score   | ≥ 89%    |

El script imprime un `classification_report` y la matriz de confusión al
finalizar el entrenamiento.
