# Modelo de Clasificación de Residuos — IA

## Resumen

GreenNode utiliza un modelo de red neuronal convolucional (CNN) basado en **MobileNetV2** con transfer learning para clasificar residuos sólidos en 6 categorías a partir de imágenes capturadas con la cámara del dispositivo móvil.

---

## Especificaciones del Modelo

| Parámetro | Valor |
|-----------|-------|
| Arquitectura base | MobileNetV2 (pre-entrenado en ImageNet) |
| Técnica | Transfer learning + fine-tuning |
| Input shape | [1, 224, 224, 3] (batch, H, W, RGB) |
| Output | Softmax, 6 clases |
| Formato de exportación | TensorFlow Lite (.tflite) |
| Cuantización | INT8 / Float16 |
| Tamaño estimado | 5-10 MB |
| Latencia objetivo | < 800 ms en dispositivo móvil de gama media |
| Precisión objetivo | ≥ 92% (accuracy en conjunto de prueba) |

---

## Clases de Clasificación

| Índice | WasteType | Etiqueta | Ejemplo |
|--------|-----------|----------|---------|
| 0 | ORGANIC | Orgánico | Cáscara de fruta, restos de comida |
| 1 | PLASTIC | Plástico | Botella PET, bolsa plástica |
| 2 | PAPER | Papel / Cartón | Periódico, caja de cartón |
| 3 | GLASS | Vidrio | Botella de vidrio, frasco |
| 4 | METAL | Metal | Lata de aluminio, hojalata |
| 5 | SPECIAL | Residuo Especial | Pilas, electrónicos, medicamentos |

---

## Dataset

### Dataset base: TrashNet (Stanford)

- 2,527 imágenes en 6 categorías
- Fuente: Yang, M., & Thung, G. (2016). Stanford University

### Augmentación de datos

```python
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.2),
    tf.keras.layers.RandomZoom(0.1),
    tf.keras.layers.RandomContrast(0.1),
])
```

### Preprocesamiento

1. Redimensionar a 224×224 píxeles
2. Normalizar valores de píxel al rango [0, 1]
3. Formato RGB (3 canales)

---

## Arquitectura de Entrenamiento

```python
# Base model (congelado inicialmente)
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False

# Capas personalizadas
model = tf.keras.Sequential([
    data_augmentation,
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(6, activation='softmax'),
])
```

### Entrenamiento en dos fases

**Fase 1: Feature extraction** (base congelada)
- Épocas: 10
- Learning rate: 0.001 (Adam)
- Solo se entrenan las capas Dense

**Fase 2: Fine-tuning** (descongelar últimas capas)
- Descongelar últimas 50 capas de MobileNetV2
- Épocas: 10 adicionales
- Learning rate: 0.0001 (reducido)

---

## Métricas de Evaluación

| Métrica | Fórmula | Objetivo |
|---------|---------|----------|
| Accuracy | (TP + TN) / Total | ≥ 92% |
| Precision | TP / (TP + FP) | ≥ 90% por clase |
| Recall | TP / (TP + FN) | ≥ 88% por clase |
| F1-Score | 2 × (P × R) / (P + R) | ≥ 89% |

---

## Exportación a TFLite

```python
# Convertir modelo a TFLite con cuantización
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

with open('waste_classifier_v1.tflite', 'wb') as f:
    f.write(tflite_model)
```

---

## Inferencia en Dispositivo

### Flujo en la app

```
Captura imagen (CameraService)
        │
        ▼
Validar URI (ImagePreprocessor.validateImageUri)
        │
        ▼
Cargar modelo si no está en memoria (ModelManager.initialize)
        │
        ▼
Ejecutar inferencia (TensorFlowService.classify)
        │  ← Resize 224x224, normalizar, softmax
        ▼
Interpretar resultado (ClassificationLabels.INDEX_TO_WASTE_TYPE)
        │
        ▼
Evaluar confianza (ClassifyWasteUseCase)
        │  ← Si confianza < 50%: isLowConfidence = true
        ▼
Retornar ClassificationResult
```

### Optimizaciones de rendimiento

- **Lazy loading:** Modelo se carga solo al entrar a ScanScreen
- **Cache en memoria:** Una vez cargado, permanece hasta que se libera
- **Cuantización Float16/INT8:** Reduce tamaño y acelera inferencia
- **Pre-calentamiento:** Inferencia dummy al cargar para optimizar primera ejecución

---

## Limitaciones Conocidas

1. El modelo puede confundir plásticos transparentes con vidrio
2. Objetos muy sucios o dañados reducen la confianza significativamente
3. Iluminación deficiente afecta la precisión (se recomienda buena luz)
4. Fondo con muchos objetos puede generar ruido

---

## Herramientas de Entrenamiento

- **Plataforma:** Google Colab (GPU T4/A100)
- **Framework:** TensorFlow 2.x / Keras
- **Optimización:** TensorFlow Model Optimization Toolkit
- **Exportación:** TFLite Converter con cuantización
- **Validación:** scikit-learn (classification_report, confusion_matrix)
