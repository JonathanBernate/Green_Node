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
 * Preprocesamiento: el modelo YA incluye mobilenet_v2.preprocess_input en su
 * grafo (primeras operaciones: MUL por 1/127.5 y SUB 1), así que la entrada
 * debe ser el píxel crudo en [0, 255]. Normalizar aquí otra vez aplasta la
 * imagen contra -1 y las predicciones dejan de depender de la foto.
 */

import { ClassificationResult, WasteType } from './domain';

const MODEL_URL = '/model/waste_classifier_v1.tflite';
const LABELS_URL = '/model/labels.json';
const IMG_SIZE = 224;
const MIN_CONFIDENCE_THRESHOLD = 0.5;

const TFJS_CDN = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const TFLITE_CDN =
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js';
// Los binarios WASM de tfjs-tflite viven en /wasm/ del paquete. Sin esta ruta,
// el loader los busca relativos a la página (./tflite_web_api_cc_*.js) y falla
// con "Cannot read properties of undefined (reading '_malloc')".
const TFLITE_WASM_BASE = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/wasm/';

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
    try {
      if (!(await isModelAvailable())) {
        console.warn('[GreenNode] [TFLite] Modelo no encontrado en /model/. Usando simulación.');
        return null;
      }
      console.info('[GreenNode] [TFLite] Cargando TensorFlow desde CDN...');
      const start = performance.now();

      await loadScript(TFJS_CDN);
      await loadScript(TFLITE_CDN);

      if (!window.tflite) throw new Error('tfjs-tflite no se cargó');

      // Apunta el loader WASM al paquete en el CDN (ver const TFLITE_WASM_BASE).
      if (typeof window.tflite.setWasmPath === 'function') {
        window.tflite.setWasmPath(TFLITE_WASM_BASE);
      }

      labels = await loadLabels();
      model = await window.tflite.loadTFLiteModel(MODEL_URL);

      console.info(
        `[GreenNode] [TFLite] Modelo cargado en ${(performance.now() - start).toFixed(0)}ms`,
      );
      return model;
    } catch (err) {
      // Permite reintentar en el próximo intento de clasificación.
      loadPromise = null;
      throw err;
    }
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

  // [1,224,224,3] float32 en [0,255]: la normalización a [-1,1] la hace el propio modelo
  const input = tf.tidy(() => {
    const t = tf.browser.fromPixels(imgEl).toFloat();
    return tf.image.resizeBilinear(t, [IMG_SIZE, IMG_SIZE]).expandDims(0);
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
    simulated: false,
    model: 'MobileNetV2 (TFLite, navegador)',
    inferenceTimeMs,
    timestamp: new Date().toISOString(),
    feedback: null,
    autoConfirmed: false,
    correctedType: null,
  };
}
