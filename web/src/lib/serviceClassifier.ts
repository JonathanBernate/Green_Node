/**
 * Clasificación de UNA foto con el mismo modelo que el modo en vivo (servicio Python en /realtime,
 * ViT de Hugging Face con 12 clases). Así foto y video dan el mismo resultado.
 */
import { ClassificationResult, WasteType } from './domain';
import { binForLive, LivePrediction } from './liveClassifier';

const MAX_SIDE = 640;
const TIMEOUT_MS = 15000;
const MIN_CONFIDENCE = 0.5;
const ORDER = [WasteType.ORGANIC, WasteType.PLASTIC, WasteType.PAPER, WasteType.GLASS, WasteType.METAL, WasteType.SPECIAL];

function baseUrl(): string {
  const override = import.meta.env.VITE_LIVE_API_URL as string | undefined;
  return override ? override.replace(/\/$/, '') : '/live';
}

/** Reduce la foto a MAX_SIDE y la comprime: sube rápido y el modelo la reescala a 224 de todos modos. */
async function toJpegBlob(imageSrc: string): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('No se pudo leer la imagen'));
    i.src = imageSrc;
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir'))), 'image/jpeg', 0.9));
}

/** ¿Está el servicio de IA disponible? */
export async function isServiceAvailable(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${baseUrl()}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/** Convierte la respuesta del servicio al resultado que usa la interfaz. */
export function fromPrediction(p: LivePrediction): ClassificationResult {
  const mapped = p.waste_type && (ORDER as string[]).includes(p.waste_type) ? (p.waste_type as WasteType) : null;
  // Probabilidad por tipo del sistema (el servicio entrega el top-3 de 12 clases)
  const probabilities = ORDER.map((wt) => p.top3.filter((t) => t.waste_type === wt).reduce((a, t) => a + t.confidence, 0));
  const confidence = p.confidence;
  return {
    id: `cls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    wasteType: mapped ?? WasteType.SPECIAL,
    unmapped: mapped === null,
    detectedLabel: p.label,
    bin: binForLive(p),
    confidence,
    probabilities,
    isLowConfidence: confidence < MIN_CONFIDENCE,
    simulated: false,
    model: p.model ?? 'watersplash/waste-classification',
    inferenceTimeMs: p.inference_ms,
    timestamp: new Date().toISOString(),
    feedback: null,
    autoConfirmed: false,
    correctedType: null,
  };
}

/**
 * Promedia varias predicciones de la misma imagen (p. ej. original y espejada): cada etiqueta suma su
 * confianza y se divide entre el número de vistas. Una etiqueta que solo aparece en una vista pesa menos.
 */
export function mergePredictions(preds: LivePrediction[]): LivePrediction {
  if (preds.length === 1) return preds[0];
  const acc = new Map<string, { entry: LivePrediction['top3'][number]; sum: number }>();
  for (const p of preds) {
    for (const t of p.top3) {
      const cur = acc.get(t.label);
      acc.set(t.label, { entry: cur?.entry ?? t, sum: (cur?.sum ?? 0) + t.confidence });
    }
  }
  const top3 = [...acc.values()]
    .map(({ entry, sum }) => ({ ...entry, confidence: +(sum / preds.length).toFixed(4) }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  const best = top3[0];
  return {
    ...preds[0],
    label: best.label,
    confidence: best.confidence,
    group: best.group,
    waste_type: best.waste_type ?? null,
    top3,
    inference_ms: Math.max(...preds.map((p) => p.inference_ms)),
  };
}

async function predictBlob(blob: Blob): Promise<LivePrediction> {
  const form = new FormData();
  form.append('file', blob, 'foto.jpg');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl()}/predict`, { method: 'POST', body: form, signal: ctrl.signal });
    if (!res.ok) throw new Error(`Servicio de IA: ${res.status}`);
    return (await res.json()) as LivePrediction;
  } finally {
    clearTimeout(timer);
  }
}

async function flipped(imageSrc: string): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('No se pudo leer la imagen'));
    i.src = imageSrc;
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx?.translate(canvas.width, 0);
  ctx?.scale(-1, 1);
  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir'))), 'image/jpeg', 0.9));
}

/**
 * @param opts.tta  Analiza también la imagen espejada y promedia (más robusto; el doble de tiempo).
 */
export async function classifyWithService(imageSrc: string, opts: { tta?: boolean } = {}): Promise<ClassificationResult> {
  const views = [toJpegBlob(imageSrc)];
  if (opts.tta) views.push(flipped(imageSrc));
  const preds = await Promise.all((await Promise.all(views)).map(predictBlob));
  return fromPrediction(mergePredictions(preds));
}
