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

export interface ClassificationResult {
  id: string;
  wasteType: WasteType;
  confidence: number;
  imageUri: string;
  timestamp: string;
  userId: string;
  location?: { latitude: number; longitude: number };
  synced: boolean;
}
