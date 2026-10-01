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

// Contenedores iniciales simulados (nodos IoT de la red)
export function getInitialContainers(): Container[] {
  return [
    {
      id: 'c-001',
      address: 'Calle 45 # 12-30, Barrio Centro',
      latitude: 4.6018,
      longitude: -74.0721,
      fillLevel: 32,
      status: ContainerStatus.ACTIVE,
      wasteTypes: [WasteType.PLASTIC, WasteType.PAPER, WasteType.METAL],
      capacity: 240,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'c-002',
      address: 'Carrera 7 # 32-16, Barrio La Soledad',
      latitude: 4.6280,
      longitude: -74.0660,
      fillLevel: 68,
      status: ContainerStatus.ACTIVE,
      wasteTypes: [WasteType.ORGANIC, WasteType.GLASS],
      capacity: 360,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'c-003',
      address: 'Av. Caracas # 50-20, Chapinero',
      latitude: 4.6410,
      longitude: -74.0630,
      fillLevel: 91,
      status: ContainerStatus.FULL,
      wasteTypes: [WasteType.PLASTIC, WasteType.GLASS, WasteType.METAL],
      capacity: 240,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'c-004',
      address: 'Calle 100 # 15-40, Usaquén',
      latitude: 4.6860,
      longitude: -74.0480,
      fillLevel: 12,
      status: ContainerStatus.ACTIVE,
      wasteTypes: [WasteType.ORGANIC, WasteType.PAPER],
      capacity: 480,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'c-005',
      address: 'Cra 30 # 45-03, Teusaquillo',
      latitude: 4.6320,
      longitude: -74.0850,
      fillLevel: 54,
      status: ContainerStatus.MAINTENANCE,
      wasteTypes: [WasteType.SPECIAL],
      capacity: 120,
      lastUpdated: new Date().toISOString(),
    },
  ];
}

// --- Lecciones educativas ---
export interface Lesson {
  id: string;
  title: string;
  icon: string;
  durationMin: number;
  category: string;
  summary: string;
  completed: boolean;
}

export function getLessons(): Lesson[] {
  return [
    {
      id: 'l-1',
      title: '¿Por qué separar los residuos?',
      icon: '🌍',
      durationMin: 3,
      category: 'Fundamentos',
      summary: 'Entiende el impacto ambiental de la separación en origen.',
      completed: true,
    },
    {
      id: 'l-2',
      title: 'Los 6 tipos de residuos',
      icon: '🗂️',
      durationMin: 5,
      category: 'Clasificación',
      summary: 'Aprende a distinguir orgánico, plástico, papel, vidrio, metal y especial.',
      completed: true,
    },
    {
      id: 'l-3',
      title: 'Reciclaje de plásticos',
      icon: '♻️',
      durationMin: 4,
      category: 'Clasificación',
      summary: 'Códigos de reciclaje y qué plásticos sí se reciclan.',
      completed: false,
    },
    {
      id: 'l-4',
      title: 'Compostaje en casa',
      icon: '🍃',
      durationMin: 6,
      category: 'Práctica',
      summary: 'Convierte tus residuos orgánicos en abono.',
      completed: false,
    },
    {
      id: 'l-5',
      title: 'Residuos especiales y peligrosos',
      icon: '⚠️',
      durationMin: 4,
      category: 'Seguridad',
      summary: 'Cómo manejar pilas, electrónicos y medicamentos.',
      completed: false,
    },
  ];
}
