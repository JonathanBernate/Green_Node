import { WasteType } from '@/domain/entities/WasteClassification';

/**
 * Mapeo de índices del modelo TFLite a tipos de residuos.
 * El modelo entrenado con MobileNetV2 usa estas 6 clases en este orden.
 */
export const INDEX_TO_WASTE_TYPE: WasteType[] = [
  WasteType.ORGANIC,   // 0
  WasteType.PLASTIC,   // 1
  WasteType.PAPER,     // 2
  WasteType.GLASS,     // 3
  WasteType.METAL,     // 4
  WasteType.SPECIAL,   // 5
];

export const WASTE_TYPE_TO_INDEX: Record<WasteType, number> = {
  [WasteType.ORGANIC]: 0,
  [WasteType.PLASTIC]: 1,
  [WasteType.PAPER]: 2,
  [WasteType.GLASS]: 3,
  [WasteType.METAL]: 4,
  [WasteType.SPECIAL]: 5,
};

export const NUM_CLASSES = 6;

/** Umbral mínimo de confianza para aceptar una clasificación */
export const MIN_CONFIDENCE_THRESHOLD = 0.5;

/** Labels en español para mostrar en la UI */
export const CLASS_LABELS_ES: string[] = [
  'Orgánico',
  'Plástico',
  'Papel / Cartón',
  'Vidrio',
  'Metal',
  'Residuo Especial',
];
