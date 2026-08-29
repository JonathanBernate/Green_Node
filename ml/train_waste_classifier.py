# ============================================================================
# GreenNode - Entrenamiento del clasificador de residuos
# ============================================================================
# Modelo: MobileNetV2 + transfer learning sobre TrashNet (6 clases)
# Basado en las especificaciones de docs/AI_MODEL.md
#
# Salidas:
#   - waste_classifier_v1.tflite  -> para la app movil (react-native-fast-tflite)
#   - tfjs_model/                 -> para la web (TensorFlow.js)
#   - labels.json                 -> orden de las clases
#
# COMO USAR EN GOOGLE COLAB:
#   1. Runtime -> Change runtime type -> GPU (T4)
#   2. Copia este archivo como celdas, o subelo y ejecuta: %run train_waste_classifier.py
#   3. Al terminar, descarga waste_classifier_v1.tflite y la carpeta tfjs_model/
#
# Este script esta escrito en secciones marcadas con "# %%" para poder
# ejecutarlo tambien como notebook (Jupyter / VS Code).
# ============================================================================

# %% [Instalacion de dependencias]  ------------------------------------------
# En Colab, descomenta esta linea la primera vez:
# !pip install -q tensorflow==2.15.0 tensorflowjs kagglehub

# %% [Imports y configuracion] -----------------------------------------------
import json
import os
import pathlib

import numpy as np
import tensorflow as tf

print("TensorFlow version:", tf.__version__)

# Parametros (segun docs/AI_MODEL.md)
IMG_SIZE = 224            # input 224x224
BATCH_SIZE = 32
NUM_CLASSES = 6
SEED = 123
EPOCHS_PHASE1 = 10        # feature extraction
EPOCHS_PHASE2 = 10        # fine-tuning
FINE_TUNE_AT = -50        # descongelar ultimas 50 capas

# IMPORTANTE: el orden debe coincidir EXACTAMENTE con el enum WasteType de la app
# (src/domain/entities/WasteClassification.ts):
#   0=organic, 1=plastic, 2=paper, 3=glass, 4=metal, 5=special
#
# TrashNet original tiene: cardboard, glass, metal, paper, plastic, trash
# Hacemos el mapeo a las 6 clases del proyecto mas abajo.
CLASS_ORDER = ["organic", "plastic", "paper", "glass", "metal", "special"]


# %% [Descargar dataset TrashNet] --------------------------------------------
# Opcion A (recomendada en Colab): kagglehub
#   import kagglehub
#   dataset_path = kagglehub.dataset_download("feyzazkefe/trashnet")
#   RAW_DIR = pathlib.Path(dataset_path) / "dataset-resized"
#
# Opcion B: clonar el repo original de Stanford
#   !git clone https://github.com/garythung/trashnet
#   (requiere descomprimir data/dataset-resized.zip)
#
# Para este script asumimos que RAW_DIR apunta a una carpeta con subcarpetas
# por clase de TrashNet: cardboard/ glass/ metal/ paper/ plastic/ trash/
RAW_DIR = pathlib.Path(os.environ.get("TRASHNET_DIR", "dataset-resized"))

# Mapeo TrashNet -> clases del proyecto GreenNode.
# TrashNet no tiene "organico", asi que 'trash' se usa como aproximacion de
# 'special' (residuo no reciclable / especial). Si consigues un dataset con
# organico real, ajusta este mapeo.
TRASHNET_TO_PROJECT = {
    "cardboard": "paper",
    "paper": "paper",
    "glass": "glass",
    "metal": "metal",
    "plastic": "plastic",
    "trash": "special",
    # 'organic' no existe en TrashNet base; ver nota arriba.
}


# %% [Construir dataset unificado con las 6 clases del proyecto] --------------
def build_unified_dataset(raw_dir: pathlib.Path, out_dir: pathlib.Path):
    """Reorganiza TrashNet en carpetas segun las clases del proyecto."""
    import shutil

    out_dir.mkdir(parents=True, exist_ok=True)
    for cls in CLASS_ORDER:
        (out_dir / cls).mkdir(exist_ok=True)

    copied = 0
    for src_class, dst_class in TRASHNET_TO_PROJECT.items():
        src = raw_dir / src_class
        if not src.exists():
            print(f"  [aviso] no existe {src}, se omite")
            continue
        for img in src.glob("*.jpg"):
            shutil.copy(img, out_dir / dst_class / f"{src_class}_{img.name}")
            copied += 1
    print(f"Imagenes copiadas: {copied}")
    print("Nota: 'organic' quedara vacio si el dataset no lo incluye.")
    return out_dir


DATA_DIR = pathlib.Path("greennode_dataset")
if RAW_DIR.exists():
    build_unified_dataset(RAW_DIR, DATA_DIR)
else:
    print(f"[aviso] No se encontro {RAW_DIR}. Ajusta TRASHNET_DIR o descarga el dataset.")


# %% [Cargar datos train / validation] ---------------------------------------
train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="training",
    seed=SEED,
    image_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_names=CLASS_ORDER,   # fuerza el orden exacto de las clases
)
val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_names=CLASS_ORDER,
)

# Guardar el orden de clases para la app
with open("labels.json", "w") as f:
    json.dump(CLASS_ORDER, f)
print("Clases (orden):", CLASS_ORDER)

AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.prefetch(AUTOTUNE)
val_ds = val_ds.prefetch(AUTOTUNE)


# %% [Data augmentation (segun AI_MODEL.md)] ---------------------------------
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.2),
    tf.keras.layers.RandomZoom(0.1),
    tf.keras.layers.RandomContrast(0.1),
], name="data_augmentation")


# %% [Construir el modelo: MobileNetV2 + transfer learning] ------------------
# Preprocesamiento de MobileNetV2: escala pixeles al rango [-1, 1].
# La app debe aplicar el MISMO preprocesamiento antes de inferir.
preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights="imagenet",
)
base_model.trainable = False  # Fase 1: congelado

inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x = data_augmentation(inputs)
x = preprocess_input(x)
x = base_model(x, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.3)(x)
x = tf.keras.layers.Dense(128, activation="relu")(x)
x = tf.keras.layers.Dropout(0.2)(x)
outputs = tf.keras.layers.Dense(NUM_CLASSES, activation="softmax")(x)
model = tf.keras.Model(inputs, outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)
model.summary()


# %% [Fase 1: Feature extraction] --------------------------------------------
print("\n=== FASE 1: Feature extraction (base congelada) ===")
history1 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS_PHASE1,
)


# %% [Fase 2: Fine-tuning] ---------------------------------------------------
print("\n=== FASE 2: Fine-tuning (ultimas 50 capas) ===")
base_model.trainable = True
for layer in base_model.layers[:FINE_TUNE_AT]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),  # LR reducido
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

history2 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS_PHASE1 + EPOCHS_PHASE2,
    initial_epoch=history1.epoch[-1] + 1,
)


# %% [Evaluacion: metricas y matriz de confusion] ---------------------------
print("\n=== EVALUACION ===")
try:
    from sklearn.metrics import classification_report, confusion_matrix

    y_true, y_pred = [], []
    for images, labels in val_ds:
        preds = model.predict(images, verbose=0)
        y_true.extend(labels.numpy())
        y_pred.extend(np.argmax(preds, axis=1))

    print(classification_report(y_true, y_pred, target_names=CLASS_ORDER, zero_division=0))
    print("Matriz de confusion:")
    print(confusion_matrix(y_true, y_pred))
except ImportError:
    loss, acc = model.evaluate(val_ds, verbose=0)
    print(f"Accuracy validacion: {acc:.4f}  |  Loss: {loss:.4f}")


# %% [Exportar a TFLite (para la app movil)] ---------------------------------
print("\n=== EXPORTANDO A TFLITE ===")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]  # cuantizacion Float16
tflite_model = converter.convert()

with open("waste_classifier_v1.tflite", "wb") as f:
    f.write(tflite_model)
size_mb = len(tflite_model) / (1024 * 1024)
print(f"Guardado waste_classifier_v1.tflite ({size_mb:.2f} MB)")


# %% [Exportar a TensorFlow.js (para la web)] --------------------------------
print("\n=== EXPORTANDO A TENSORFLOW.JS ===")
# Requiere: pip install tensorflowjs
try:
    import tensorflowjs as tfjs

    tfjs.converters.save_keras_model(model, "tfjs_model")
    print("Guardado modelo TFJS en ./tfjs_model/ (model.json + *.bin)")
except ImportError:
    # Alternativa por linea de comandos:
    #   model.save('saved_model')
    #   !tensorflowjs_converter --input_format=tf_saved_model saved_model tfjs_model
    model.save("saved_model")
    print("tensorflowjs no instalado. Guardado saved_model/.")
    print("Convierte luego con:")
    print("  tensorflowjs_converter --input_format=tf_saved_model saved_model tfjs_model")


# %% [Descargar resultados en Colab] -----------------------------------------
# from google.colab import files
# files.download('waste_classifier_v1.tflite')
# !zip -r tfjs_model.zip tfjs_model
# files.download('tfjs_model.zip')
# files.download('labels.json')

print("\nListo. Archivos generados:")
print("  - waste_classifier_v1.tflite  (app movil)")
print("  - tfjs_model/                 (web: copiar a web/public/model/)")
print("  - labels.json                 (orden de clases)")
