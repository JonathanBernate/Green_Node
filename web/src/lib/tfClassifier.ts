/**
 * Servicio de inferencia real con TensorFlow.js para la web.
 *
 * Carga el modelo entrenado (MobileNetV2 exportado a TFJS) desde
 * /model/model.json y clasifica una imagen en las 6 clases del proyecto.
 *
 * El modelo se genera con ml/train_waste_classifier.py y sus archivos
 * (model.json + *.bin) deben copiarse a web/public/model/.
 *
 * Si el modelo no está presente, isModelAvailable() devuelve false y el
 * llamador puede recurrir a la clasificación simulada.
 *
 * Preprocesamiento: idéntico al del entrenamiento
 * (tf.keras.applications.mobilenet_v2.preprocess_input → rango [-1, 1]).
 */

import * as tf from '@tensorflow/tfjs';
import {
  ClassificationResult,
  WasteType,
} from './domain';

const MODEL_URL = '/model/model.json';
const IMG_SIZE = 224;
const MIN_CONFIDENCE_THRESHOLD = 0.5;

// Orden EXACTO de clases usado en el entrenamiento (CLASS_ORDER del notebook)
const INDEX_TO_WASTE_TYPE: WasteType[] = [
  WasteType.ORGANIC,
  WasteType.PLASTIC,
  WasteType.PAPER,
  WasteType.GLASS,
  WasteType.METAL,
  WasteType.SPECIAL,
];

let model: tf.LayersModel | null = null;
let loadPromise: Promise<tf.LayersModel | null> | null = null;
let available: boolean | null = null;

/**
 * Comprueba (una vez) si el modelo está disponible en el servidor.
 */
export async function isModelAvailable(): Promise<boolean> {
  if (available !== null) return available;
  try {
    const res = await fetch(MODEL_URL, { method: 'HEAD' });
    available = res.ok;
  } catch {
    available = false;
  }
  return available;
}

/**
 * Carga el modelo de forma lazy (una sola vez).
 */
export async function loadModel(): Promise<tf.LayersModel | null> {
  if (model) return model;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!(await isModelAvailable())) {
      console.warn('[GreenNode] [TFJS] Modelo no encontrado en /model/. Usando simulación.');
      return null;
    }
    console.info('[GreenNode] [TFJS] Cargando modelo real...');
    const start = performance.now();
    const m = await tf.loadLayersModel(MODEL_URL);
    // Pre-calentamiento: una inferencia dummy para optimizar la primera real
    const warm = tf.zeros([1, IMG_SIZE, IMG_SIZE, 3]);
    const p = m.predict(warm) as tf.Tensor;
    p.dispose();
    warm.dispose();
    model = m;
    console.info(`[GreenNode] [TFJS] Modelo cargado en ${(performance.now() - start).toFixed(0)}ms`);
    return m;
  })();

  return loadPromise;
}

/**
 * Convierte una imagen (elemento HTML) a tensor preprocesado [1,224,224,3].
 * Aplica el mismo preprocesamiento que MobileNetV2 en entrenamiento: [-1, 1].
 */
function preprocess(img: HTMLImageElement | HTMLCanvasElement): tf.Tensor {
  return tf.tidy(() => {
    let t = tf.browser.fromPixels(img).toFloat();
    t = tf.image.resizeBilinear(t, [IMG_SIZE, IMG_SIZE]);
    // mobilenet_v2.preprocess_input: x/127.5 - 1  → rango [-1, 1]
    t = t.div(127.5).sub(1);
    return t.expandDims(0);
  });
}

/**
 * Carga una imagen desde un dataURL/URL a un HTMLImageElement.
 */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Clasifica una imagen con el modelo real.
 * Lanza si el modelo no está disponible (el llamador debe verificar antes).
 */
export async function classifyWithModel(imageSrc: string): Promise<ClassificationResult> {
  const m = await loadModel();
  if (!m) throw new Error('Modelo no disponible');

  const start = performance.now();
  const imgEl = await loadImageElement(imageSrc);

  const input = preprocess(imgEl);
  const output = m.predict(input) as tf.Tensor;
  const probabilities = Array.from(await output.data());
  input.dispose();
  output.dispose();

  const maxIndex = probabilities.indexOf(Math.max(...probabilities));
  const wasteType = INDEX_TO_WASTE_TYPE[maxIndex] ?? WasteType.SPECIAL;
  const confidence = probabilities[maxIndex] ?? 0;
  const inferenceTimeMs = Math.round(performance.now() - start);

  console.debug(
    `[GreenNode] [TFJS] Clasificación real: ${wasteType} (${(confidence * 100).toFixed(1)}%) en ${inferenceTimeMs}ms`,
  );

  return {
    id: `cls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    wasteType,
    confidence,
    probabilities,
    isLowConfidence: confidence < MIN_CONFIDENCE_THRESHOLD,
    inferenceTimeMs,
    timestamp: new Date().toISOString(),
    feedback: null,
    autoConfirmed: false,
    correctedType: null,
  };
}
