/**
 * Servicio de inferencia real para la web usando el modelo .tflite entrenado.
 *
 * Carga TensorFlow.js y tfjs-tflite DESDE CDN en tiempo de ejecución (no se
 * empaquetan con Vite, porque el paquete tfjs-tflite alpha tiene imports que
 * rompen el bundler). Esto mantiene la web ligera y evita errores de build.
 *
 * Archivos esperados en web/public/model/:
 *   - waste_classifier_v1.tflite
 *   - labels.json   (ej: ["plastic","paper","glass","metal","special"])
 *
 * Si el modelo no está presente, isModelAvailable() devuelve false y el
 * llamador recurre a la clasificación simulada.
 *
 * Preprocesamiento: idéntico al del entrenamiento
 * (mobilenet_v2.preprocess_input → rango [-1, 1]).
 */

import { ClassificationResult, WasteType } from './domain';

const MODEL_URL = '/model/waste_classifier_v1.tflite';
const LABELS_URL = '/model/labels.json';
const IMG_SIZE = 224;
const MIN_CONFIDENCE_THRESHOLD = 0.5;

const TFJS_CDN = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const TFLITE_CDN =
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js';

// tf y tflite se cargan globalmente desde el CDN (window.tf, window.tflite)
declare global {
  interface Window {
    tf: any;
    tflite: any;
  }
}

const NAME_TO_WASTE_TYPE: Record<string, WasteType> = {
  organic: WasteType.ORGANIC,
  plastic: WasteType.PLASTIC,
  paper: WasteType.PAPER,
  glass: WasteType.GLASS,
  metal: WasteType.METAL,
  special: WasteType.SPECIAL,
};

let model: any = null;
let labels: WasteType[] | null = null;
let loadPromise: Promise<any> | null = null;
let available: boolean | null = null;

/** Carga un script externo una sola vez. */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });
}

/** Comprueba (una vez) si el modelo está disponible en el servidor. */
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

async function loadLabels(): Promise<WasteType[]> {
  try {
    const res = await fetch(LABELS_URL);
    if (res.ok) {
      const names: string[] = await res.json();
      console.info('[GreenNode] [TFLite] Clases del modelo:', names);
      return names.map((n) => NAME_TO_WASTE_TYPE[n] ?? WasteType.SPECIAL);
    }
  } catch {
    /* ignore */
  }
  console.warn('[GreenNode] [TFLite] labels.json no encontrado, usando orden por defecto');
  return [
    WasteType.ORGANIC,
    WasteType.PLASTIC,
    WasteType.PAPER,
    WasteType.GLASS,
    WasteType.METAL,
    WasteType.SPECIAL,
  ];
}

/** Carga el modelo .tflite de forma lazy (una sola vez). */
export async function loadModel(): Promise<any> {
  if (model) return model;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!(await isModelAvailable())) {
      console.warn('[GreenNode] [TFLite] Modelo no encontrado en /model/. Usando simulación.');
      return null;
    }
    console.info('[GreenNode] [TFLite] Cargando TensorFlow desde CDN...');
    const start = performance.now();

    await loadScript(TFJS_CDN);
    await loadScript(TFLITE_CDN);

    if (!window.tflite) throw new Error('tfjs-tflite no se cargó');

    labels = await loadLabels();
    model = await window.tflite.loadTFLiteModel(MODEL_URL);

    console.info(
      `[GreenNode] [TFLite] Modelo cargado en ${(performance.now() - start).toFixed(0)}ms`,
    );
    return model;
  })();

  return loadPromise;
}

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
 * Clasifica una imagen con el modelo real .tflite.
 * Lanza si el modelo no está disponible (el llamador debe verificar antes).
 */
export async function classifyWithModel(imageSrc: string): Promise<ClassificationResult> {
  const m = await loadModel();
  if (!m || !labels) throw new Error('Modelo no disponible');

  const tf = window.tf;
  const start = performance.now();
  const imgEl = await loadImageElement(imageSrc);

  // Preprocesar a [1,224,224,3] en rango [-1,1] (mobilenet_v2.preprocess_input)
  const input = tf.tidy(() => {
    let t = tf.browser.fromPixels(imgEl).toFloat();
    t = tf.image.resizeBilinear(t, [IMG_SIZE, IMG_SIZE]);
    t = t.div(127.5).sub(1);
    return t.expandDims(0);
  });

  const output = m.predict(input);
  const probabilities: number[] = Array.from(await output.data());
  input.dispose();
  output.dispose();

  const maxIndex = probabilities.indexOf(Math.max(...probabilities));
  const wasteType = labels[maxIndex] ?? WasteType.SPECIAL;
  const confidence = probabilities[maxIndex] ?? 0;
  const inferenceTimeMs = Math.round(performance.now() - start);

  console.debug(
    `[GreenNode] [TFLite] Clasificación real: ${wasteType} (${(confidence * 100).toFixed(1)}%) en ${inferenceTimeMs}ms`,
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
