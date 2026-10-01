/**
 * Lógica de dominio compartida para el dashboard web.
 * Replica las entidades de src/domain manteniendo coherencia con la app RN.
 */

// --- Tipos de residuo (espejo de src/domain/entities/WasteClassification.ts) ---
export enum WasteType {
  ORGANIC = 'organic',
  PLASTIC = 'plastic',
  PAPER = 'paper',
  GLASS = 'glass',
  METAL = 'metal',
  SPECIAL = 'special',
}

export const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  [WasteType.ORGANIC]: 'Orgánico',
  [WasteType.PLASTIC]: 'Plástico',
  [WasteType.PAPER]: 'Papel / Cartón',
  [WasteType.GLASS]: 'Vidrio',
  [WasteType.METAL]: 'Metal',
  [WasteType.SPECIAL]: 'Residuo Especial',
};

export const WASTE_TYPE_COLORS: Record<WasteType, string> = {
  [WasteType.ORGANIC]: '#4CAF50',
  [WasteType.PLASTIC]: '#2196F3',
  [WasteType.PAPER]: '#FF9800',
  [WasteType.GLASS]: '#00BCD4',
  [WasteType.METAL]: '#9E9E9E',
  [WasteType.SPECIAL]: '#F44336',
};

export const WASTE_TYPE_ICONS: Record<WasteType, string> = {
  [WasteType.ORGANIC]: '🍃',
  [WasteType.PLASTIC]: '♻️',
  [WasteType.PAPER]: '📄',
  [WasteType.GLASS]: '🥛',
  [WasteType.METAL]: '🔩',
  [WasteType.SPECIAL]: '⚠️',
};

export const WASTE_DISPOSAL_TIP: Record<WasteType, string> = {
  [WasteType.ORGANIC]: 'Deposítalo en el contenedor marrón para compostaje.',
  [WasteType.PLASTIC]: 'Enjuaga y aplasta la botella. Contenedor amarillo.',
  [WasteType.PAPER]: 'Mantenlo seco y sin grasa. Contenedor azul.',
  [WasteType.GLASS]: 'Sin tapas ni corchos. Contenedor verde.',
  [WasteType.METAL]: 'Latas limpias y compactadas. Contenedor amarillo.',
  [WasteType.SPECIAL]: 'Llévalo a un punto limpio. No lo mezcles con la basura común.',
};

const INDEX_TO_WASTE_TYPE: WasteType[] = [
  WasteType.ORGANIC,
  WasteType.PLASTIC,
  WasteType.PAPER,
  WasteType.GLASS,
  WasteType.METAL,
  WasteType.SPECIAL,
];
const NUM_CLASSES = INDEX_TO_WASTE_TYPE.length;
const MIN_CONFIDENCE_THRESHOLD = 0.5;

/** Validación del usuario sobre la clasificación (criterio real). */
export type ClassificationFeedback = 'correct' | 'incorrect' | null;

export interface ClassificationResult {
  id: string;
  wasteType: WasteType;
  confidence: number;
  probabilities: number[];
  isLowConfidence: boolean;
  inferenceTimeMs: number;
  timestamp: string;
  /** null = pendiente de validar. */
  feedback: ClassificationFeedback;
  /** true si la validación se marcó por timeout, no manualmente. */
  autoConfirmed: boolean;
  /** Tipo real indicado por el usuario cuando la clasificación fue incorrecta. */
  correctedType: WasteType | null;
  /** true si el resultado NO proviene de un modelo (fallback de demostración). */
  simulated?: boolean;
  /** Nombre del modelo que produjo la predicción, si se conoce. */
  model?: string;
}

/**
 * Simula la inferencia del modelo TFLite (MobileNetV2).
 * Espejo de la lógica en src/infrastructure/ai/TensorFlowService.ts.
 */
export async function classifyWasteSimulated(): Promise<ClassificationResult> {
  const startTime = Date.now();
  // Simula latencia de carga + inferencia
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

  const probs = Array.from({ length: NUM_CLASSES }, () => Math.random() * 0.1);
  const dominantIndex = Math.floor(Math.random() * NUM_CLASSES);
  probs[dominantIndex] = 0.7 + Math.random() * 0.25;
  const sum = probs.reduce((a, b) => a + b, 0);
  const probabilities = probs.map((p) => p / sum);

  const maxIndex = probabilities.indexOf(Math.max(...probabilities));
  const wasteType = INDEX_TO_WASTE_TYPE[maxIndex];
  const confidence = probabilities[maxIndex];
  const inferenceTimeMs = Date.now() - startTime;

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
    simulated: true,
    model: 'simulación (aleatorio)',
  };
}

// --- Contenedores (espejo de src/domain/entities/Container.ts) ---
export enum ContainerStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
  FULL = 'full',
}

export const CONTAINER_STATUS_LABELS: Record<ContainerStatus, string> = {
  [ContainerStatus.ACTIVE]: 'Activo',
  [ContainerStatus.MAINTENANCE]: 'Mantenimiento',
  [ContainerStatus.OFFLINE]: 'Sin conexión',
  [ContainerStatus.FULL]: 'Lleno',
};

export interface Container {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  fillLevel: number; // 0-100
  status: ContainerStatus;
  wasteTypes: WasteType[];
  capacity: number; // litros
  lastUpdated: string;
  /** Batería del nodo (0-100), si el nodo la reporta. */
  batteryLevel?: number;
  /** Gateway al que reporta el nodo. */
  gatewayId?: string;
  /** true si es un nodo virtual (simulación). */
  virtual?: boolean;
}

export type FillLevelCategory = 'empty' | 'quarter' | 'half' | 'threeQuarters' | 'full';

export const FILL_LEVEL_COLORS: Record<FillLevelCategory, string> = {
  empty: '#4CAF50',
  quarter: '#8BC34A',
  half: '#FFEB3B',
  threeQuarters: '#FF9800',
  full: '#F44336',
};

export function getFillLevelCategory(level: number): FillLevelCategory {
  if (level < 25) return 'empty';
  if (level < 50) return 'quarter';
  if (level < 75) return 'half';
  if (level < 90) return 'threeQuarters';
  return 'full';
}

export function getFillLevelColor(level: number): string {
  return FILL_LEVEL_COLORS[getFillLevelCategory(level)];
}

// --- Lecciones educativas ---
export interface Lesson {
  id: string;
  title: string;
  icon: string;
  durationMin: number;
  category: string;
  categoryId: string;
  summary: string;
  points: number;
  hasQuiz: boolean;
  completed: boolean;
  /** Mejor puntaje del cuestionario (0-100); null si aún no lo intentas. */
  score: number | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface LessonDetail extends Lesson {
  /** Markdown. */
  content: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  passed: boolean;
  passScore: number;
  pointsEarned: number;
  results: { questionId: string; correct: boolean; correctOption: number; explanation: string | null }[];
  totalPoints?: number;
  level?: number;
}
