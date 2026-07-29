"""
Script de Entrenamiento del Modelo de Clasificación de Residuos.

Modelo: MobileNetV2 con Transfer Learning
Dataset: TrashNet (Stanford) — 6 clases
Salida: waste_classifier_v1.tflite

Ejecutar en Google Colab con GPU:
    1. Subir este archivo a Colab
    2. Ejecutar todas las celdas
    3. Descargar el .tflite generado

Requisitos:
    pip install tensorflow numpy matplotlib scikit-learn pillow
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint,
)
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

# ============================================================
# CONFIGURACIÓN
# ============================================================

CONFIG = {
    "img_size": 224,
    "batch_size": 32,
    "epochs_phase1": 15,      # Feature extraction (base congelada)
    "epochs_phase2": 15,      # Fine-tuning (últimas capas descongeladas)
    "learning_rate_phase1": 1e-3,
    "learning_rate_phase2": 1e-4,
    "fine_tune_from_layer": 100,  # Descongelar desde esta capa
    "dropout_rate": 0.3,
    "num_classes": 6,
    "class_names": ["organic", "plastic", "paper", "glass", "metal", "special"],
    "class_labels_es": [
        "Orgánico", "Plástico", "Papel/Cartón", "Vidrio", "Metal", "Especial"
    ],
    "validation_split": 0.2,
    "seed": 42,
    "output_model_path": "waste_classifier_v1.tflite",
    "output_keras_path": "waste_classifier_v1.keras",
}

# ============================================================
# 1. CARGAR DATASET
# ============================================================

def load_dataset(dataset_path: str):
    """
    Carga el dataset desde una carpeta con estructura:
        dataset_path/
            organic/
            plastic/
            paper/
            glass/
            metal/
            special/

    Si no existe, descarga TrashNet automáticamente.
    """
    if not os.path.exists(dataset_path):
        print("📥 Descargando dataset TrashNet...")
        # Descargar TrashNet de GitHub
        os.system("git clone https://github.com/garythung/trashnet.git /tmp/trashnet")
        dataset_path = "/tmp/trashnet/data/dataset-resized"
        print(f"✅ Dataset descargado en: {dataset_path}")

    print(f"📂 Cargando dataset desde: {dataset_path}")

    train_ds = keras.utils.image_dataset_from_directory(
        dataset_path,
        validation_split=CONFIG["validation_split"],
        subset="training",
        seed=CONFIG["seed"],
        image_size=(CONFIG["img_size"], CONFIG["img_size"]),
        batch_size=CONFIG["batch_size"],
        label_mode="int",
    )

    val_ds = keras.utils.image_dataset_from_directory(
        dataset_path,
        validation_split=CONFIG["validation_split"],
        subset="validation",
        seed=CONFIG["seed"],
        image_size=(CONFIG["img_size"], CONFIG["img_size"]),
        batch_size=CONFIG["batch_size"],
        label_mode="int",
    )

    class_names = train_ds.class_names
    print(f"✅ Clases encontradas: {class_names}")
    print(f"   Train batches: {len(train_ds)}, Val batches: {len(val_ds)}")

    # Optimizar rendimiento
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

    return train_ds, val_ds, class_names


# ============================================================
# 2. DATA AUGMENTATION
# ============================================================

data_augmentation = keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.2),
    layers.RandomZoom(0.15),
    layers.RandomContrast(0.1),
    layers.RandomBrightness(0.1),
], name="data_augmentation")


# ============================================================
# 3. CONSTRUIR MODELO
# ============================================================

def build_model():
    """
    Construye el modelo con MobileNetV2 como base.
    Fase 1: Base congelada (feature extraction)
    """
    # Preprocesamiento específico de MobileNetV2
    preprocess_input = keras.applications.mobilenet_v2.preprocess_input

    # Base model pre-entrenada
    base_model = MobileNetV2(
        input_shape=(CONFIG["img_size"], CONFIG["img_size"], 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # Congelar para Fase 1

    # Construir modelo completo
    inputs = keras.Input(shape=(CONFIG["img_size"], CONFIG["img_size"], 3))
    x = data_augmentation(inputs)
    x = preprocess_input(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(CONFIG["dropout_rate"])(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(CONFIG["dropout_rate"] * 0.7)(x)
    outputs = layers.Dense(CONFIG["num_classes"], activation="softmax")(x)

    model = keras.Model(inputs, outputs)

    print(f"✅ Modelo construido: {model.count_params():,} parámetros totales")
    print(f"   Capas base (congeladas): {len(base_model.layers)}")

    return model, base_model


# ============================================================
# 4. ENTRENAMIENTO FASE 1 — Feature Extraction
# ============================================================

def train_phase1(model, train_ds, val_ds):
    """Entrenar solo las capas Dense (base congelada)."""
    print("\n" + "=" * 60)
    print("  FASE 1: Feature Extraction (base congelada)")
    print("=" * 60)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["learning_rate_phase1"]),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor="val_accuracy"),
        ReduceLROnPlateau(factor=0.5, patience=3, monitor="val_loss"),
    ]

    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=CONFIG["epochs_phase1"],
        callbacks=callbacks,
    )

    print(f"\n✅ Fase 1 completada:")
    print(f"   Train Accuracy: {history1.history['accuracy'][-1]:.4f}")
    print(f"   Val Accuracy:   {history1.history['val_accuracy'][-1]:.4f}")

    return history1


# ============================================================
# 5. ENTRENAMIENTO FASE 2 — Fine-Tuning
# ============================================================

def train_phase2(model, base_model, train_ds, val_ds):
    """Descongelar las últimas capas y re-entrenar con LR bajo."""
    print("\n" + "=" * 60)
    print("  FASE 2: Fine-Tuning (últimas capas descongeladas)")
    print("=" * 60)

    # Descongelar desde la capa especificada
    base_model.trainable = True
    for layer in base_model.layers[:CONFIG["fine_tune_from_layer"]]:
        layer.trainable = False

    trainable_layers = sum(1 for l in base_model.layers if l.trainable)
    print(f"   Capas descongeladas: {trainable_layers}/{len(base_model.layers)}")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["learning_rate_phase2"]),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor="val_accuracy"),
        ReduceLROnPlateau(factor=0.5, patience=3, monitor="val_loss"),
        ModelCheckpoint(CONFIG["output_keras_path"], save_best_only=True, monitor="val_accuracy"),
    ]

    history2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=CONFIG["epochs_phase2"],
        callbacks=callbacks,
    )

    print(f"\n✅ Fase 2 completada:")
    print(f"   Train Accuracy: {history2.history['accuracy'][-1]:.4f}")
    print(f"   Val Accuracy:   {history2.history['val_accuracy'][-1]:.4f}")

    return history2


# ============================================================
# 6. EVALUACIÓN
# ============================================================

def evaluate_model(model, val_ds, class_names):
    """Evaluación detallada con métricas por clase."""
    print("\n" + "=" * 60)
    print("  EVALUACIÓN DEL MODELO")
    print("=" * 60)

    # Obtener predicciones
    y_true = []
    y_pred = []

    for images, labels in val_ds:
        predictions = model.predict(images, verbose=0)
        y_true.extend(labels.numpy())
        y_pred.extend(np.argmax(predictions, axis=1))

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    # Reporte de clasificación
    print("\n📊 Classification Report:\n")
    print(classification_report(
        y_true, y_pred,
        target_names=CONFIG["class_labels_es"],
        digits=4,
    ))

    # Accuracy global
    accuracy = np.mean(y_true == y_pred)
    print(f"\n🎯 Accuracy Global: {accuracy:.4f} ({accuracy*100:.1f}%)")

    # Matriz de confusión
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Greens",
        xticklabels=CONFIG["class_labels_es"],
        yticklabels=CONFIG["class_labels_es"],
    )
    plt.title("Matriz de Confusión — GreenNode Classifier")
    plt.xlabel("Predicción")
    plt.ylabel("Real")
    plt.tight_layout()
    plt.savefig("confusion_matrix.png", dpi=150)
    print("   📈 Matriz guardada en: confusion_matrix.png")

    return accuracy


# ============================================================
# 7. EXPORTAR A TFLITE
# ============================================================

def export_tflite(model):
    """Convierte el modelo a TensorFlow Lite con cuantización."""
    print("\n" + "=" * 60)
    print("  EXPORTACIÓN A TFLITE")
    print("=" * 60)

    # Convertir con cuantización Float16
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]

    tflite_model = converter.convert()

    # Guardar
    output_path = CONFIG["output_model_path"]
    with open(output_path, "wb") as f:
        f.write(tflite_model)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ Modelo exportado: {output_path}")
    print(f"   Tamaño: {size_mb:.2f} MB")

    # Verificar que funciona
    interpreter = tf.lite.Interpreter(model_path=output_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print(f"   Input shape:  {input_details[0]['shape']}")
    print(f"   Output shape: {output_details[0]['shape']}")
    print(f"   Input dtype:  {input_details[0]['dtype']}")

    return output_path


# ============================================================
# 8. GENERAR LABELS JSON
# ============================================================

def export_labels():
    """Genera el archivo labels.json para la app."""
    import json

    labels = {
        "classes": CONFIG["class_names"],
        "labels_es": CONFIG["class_labels_es"],
        "num_classes": CONFIG["num_classes"],
        "input_size": CONFIG["img_size"],
        "model_version": "1.0.0",
    }

    with open("labels.json", "w") as f:
        json.dump(labels, f, indent=2, ensure_ascii=False)

    print("✅ Labels exportados: labels.json")


# ============================================================
# MAIN
# ============================================================

def main():
    print("🌱 GreenNode — Entrenamiento del Modelo de Clasificación")
    print("=" * 60)

    # Verificar GPU
    gpus = tf.config.list_physical_devices("GPU")
    print(f"   GPUs disponibles: {len(gpus)}")
    if gpus:
        print(f"   GPU: {gpus[0].name}")

    # 1. Cargar dataset
    # Cambiar esta ruta según donde tengas el dataset
    dataset_path = "./dataset"  # O "/content/dataset" en Colab
    train_ds, val_ds, class_names = load_dataset(dataset_path)

    # 2. Construir modelo
    model, base_model = build_model()

    # 3. Fase 1: Feature extraction
    history1 = train_phase1(model, train_ds, val_ds)

    # 4. Fase 2: Fine-tuning
    history2 = train_phase2(model, base_model, train_ds, val_ds)

    # 5. Evaluación
    accuracy = evaluate_model(model, val_ds, class_names)

    # 6. Exportar a TFLite
    tflite_path = export_tflite(model)

    # 7. Exportar labels
    export_labels()

    # Resumen final
    print("\n" + "=" * 60)
    print("  ✅ ENTRENAMIENTO COMPLETADO")
    print("=" * 60)
    print(f"   Accuracy: {accuracy*100:.1f}%")
    print(f"   Modelo Keras: {CONFIG['output_keras_path']}")
    print(f"   Modelo TFLite: {tflite_path}")
    print(f"   Labels: labels.json")
    print(f"   Matriz: confusion_matrix.png")
    print()
    print("   Próximos pasos:")
    print("   1. Copiar waste_classifier_v1.tflite a src/assets/models/")
    print("   2. Copiar labels.json a src/assets/models/")
    print("   3. Descomentar TODOs en TensorFlowService.ts")
    print("=" * 60)


if __name__ == "__main__":
    main()
