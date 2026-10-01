# Modelo de Clasificación de Residuos — IA

## Resumen

GreenNode utiliza un modelo de red neuronal convolucional (CNN) basado en **MobileNetV2** con transfer learning para clasificar residuos sólidos en 6 categorías a partir de imágenes capturadas con la cámara del dispositivo móvil.

> **Estado: IMPLEMENTADO y funcionando.** El modelo ya está entrenado y
> desplegado en la versión web (TensorFlow.js cargando el `.tflite`). Reconoce
> las 6 clases, incluida orgánico. El notebook de entrenamiento reproducible
> está en `ml/GreenNode_Entrenamiento.ipynb`.

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

### Dataset usado: Garbage Classification (12 clases)

- **15,150 imágenes** en 12 clases (Kaggle: `mostafaabla/garbage-classification`)
- Fotos más variadas y realistas que TrashNet (incluye imágenes tipo web scraping)
- Las 12 clases se mapean a las 6 del proyecto:

| Clase del dataset (12) | Clase GreenNode (6) |
|------------------------|---------------------|
| biological | organic |
| plastic | plastic |
| paper, cardboard | paper |
| green-glass, brown-glass, white-glass | glass |
| metal | metal |
| battery, clothes, shoes, trash | special |

> **Nota histórica:** el primer prototipo usó TrashNet (2,527 imágenes, 6 clases
> sin orgánico). Se migró al dataset de 12 clases para incorporar la clase
> orgánico y aumentar ~6x el volumen de datos.

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
2. Normalizar con `x / 127.5 - 1` → rango **[-1, 1]** (`mobilenet_v2.preprocess_input`)
3. Formato RGB (3 canales)

> El mismo preprocesamiento se aplica en la inferencia web
> (`web/src/lib/tfClassifier.ts`) para que las predicciones sean consistentes
> con el entrenamiento.

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

## Inferencia en la Web (implementada)

La versión web ejecuta el modelo real con **TensorFlow.js + tfjs-tflite**,
cargados desde CDN en tiempo de ejecución. El servicio está en
`web/src/lib/tfClassifier.ts`.

```
Adjuntar imagen o capturar con cámara
        │
        ▼
Preprocesar (resize 224x224, x/127.5 - 1)
        │
        ▼
loadTFLiteModel('/model/waste_classifier_v1.tflite')
        │  ← lee el orden de clases de /model/labels.json
        ▼
model.predict(input) → softmax
        │
        ▼
Mapear índice → WasteType (según labels.json)
        │
        ▼
ClassificationResult (+ validación del usuario)
```

**Fallback automático:** si `/model/waste_classifier_v1.tflite` no existe o la
carga falla, la app usa una clasificación simulada, sin romperse. La UI indica
el modo activo ("modelo real" vs "simulación") y muestra un banner con el
motivo si el modelo real falla.

**Binarios WASM locales:** `tfjs-tflite` necesita un runtime WebAssembly. Los
binarios se sirven **localmente** desde `web/public/tflite-wasm/` (no desde un
CDN externo), porque algunas redes corporativas bloquean el CDN. Esto se
configura con `setWasmPath('/tflite-wasm/')` en `tfClassifier.ts`.

> **Aprendizaje:** un síntoma de que el WASM no carga es el error
> `Cannot read properties of undefined (reading '_malloc')`, que hace que la
> app caiga silenciosamente a simulación (resultados aleatorios). Servir el
> WASM localmente lo resuelve.

**Ubicación de archivos:**
- Modelo web: `web/public/model/waste_classifier_v1.tflite` + `labels.json`
- Runtime WASM web: `web/public/tflite-wasm/`
- Modelo móvil: `src/assets/models/` (con `react-native-fast-tflite`)

---

## Inferencia en Dispositivo Móvil

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
5. **Domain gap:** el dataset son fotos de objetos relativamente centrados; con
   fotos de cámara en entornos reales (fondos complejos, sombras) la precisión
   baja respecto a la del conjunto de validación. El dataset de 12 clases
   reduce este efecto frente a TrashNet, pero no lo elimina.
6. La clase `special` agrupa categorías heterogéneas (baterías, ropa, zapatos,
   trash), lo que la hace menos precisa que las clases homogéneas.
7. **Observación en pruebas reales:** una imagen con **fondo blanco brillante
   que ocupa gran parte del encuadre** tiende a clasificarse como papel/cartón
   o vidrio (el fondo liso se confunde con esos materiales). Recomendaciones de
   captura: acercar el objeto para que llene el encuadre, usar fondo neutro (no
   blanco puro) y buena luz sin reflejos.

> **Consistencia verificada:** con el modelo real cargado, la misma imagen
> produce el mismo resultado de forma reproducible (p. ej. ~54% en repeticiones
> sucesivas). Si los resultados varían mucho entre repeticiones de la misma
> imagen, es señal de que se está usando la simulación (WASM no cargado).

## Mejora continua (human-in-the-loop)

La pantalla de escaneo pide al usuario validar cada clasificación
(correcto/incorrecto + tipo real cuando se equivoca). Ese feedback puede
acumularse para reentrenar versiones futuras del modelo con datos etiquetados
por usuarios reales, cerrando el ciclo de mejora.

---

## Herramientas de Entrenamiento

- **Plataforma:** Google Colab (GPU T4/A100)
- **Framework:** TensorFlow 2.x / Keras
- **Optimización:** TensorFlow Model Optimization Toolkit
- **Exportación:** TFLite Converter con cuantización
- **Validación:** scikit-learn (classification_report, confusion_matrix)
