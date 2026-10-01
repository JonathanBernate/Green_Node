import type { ClassificationResult, WasteType } from '@/domain/entities/WasteClassification';
import { LowConfidenceError } from '@/domain/errors/ClassificationError';

export interface ClassifyWasteInput {
  imageUri: string;
  userId: string;
  location?: { latitude: number; longitude: number };
}

export interface ClassifyWasteOutput {
  result: ClassificationResult;
  isLowConfidence: boolean;
}

/**
 * Caso de uso: Clasificar un residuo a partir de una imagen.
 *
 * Flujo:
 * 1. Ejecutar inferencia con el modelo TFLite
 * 2. Evaluar confianza del resultado
 * 3. Crear objeto ClassificationResult
 * 4. Retornar resultado (la persistencia se hace aparte)
 */
export class ClassifyWasteUseCase {
  constructor(
    private readonly inferenceService: {
      classify: (imageUri: string) => Promise<{
        wasteType: WasteType;
        confidence: number;
        probabilities: number[];
        inferenceTimeMs: number;
      }>;
    },
    private readonly minConfidence: number = 0.5,
  ) {}

  async execute(input: ClassifyWasteInput): Promise<ClassifyWasteOutput> {
    const { imageUri, userId, location } = input;

    const inference = await this.inferenceService.classify(imageUri);

    const result: ClassificationResult = {
      id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      wasteType: inference.wasteType,
      confidence: inference.confidence,
      imageUri,
      timestamp: new Date().toISOString(),
      userId,
      location,
      synced: false,
    };

    const isLowConfidence = inference.confidence < this.minConfidence;

    return { result, isLowConfidence };
  }
}
