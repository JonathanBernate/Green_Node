import type { ClassificationResult, WasteType } from '../entities/WasteClassification';

export interface ClassificationFilter {
  wasteType?: WasteType;
  dateFrom?: string;
  dateTo?: string;
  minConfidence?: number;
}

export interface IClassificationRepository {
  classify(imageUri: string): Promise<ClassificationResult>;
  saveClassification(result: ClassificationResult): Promise<void>;
  getHistory(filter?: ClassificationFilter): Promise<ClassificationResult[]>;
  getById(id: string): Promise<ClassificationResult | null>;
  correctClassification(id: string, correctType: WasteType): Promise<void>;
  syncPending(): Promise<number>;
}
