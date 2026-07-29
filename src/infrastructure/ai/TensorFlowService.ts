/**
 * Servicio de inferencia TensorFlow Lite para clasificación de residuos.
 *
 * Utiliza el modelo MobileNetV2 entrenado con transfer learning sobre
 * dataset de residuos (6 clases: orgánico, plástico, papel, vidrio, metal, especial).
 *
 * Dependencia: react-native-fast-tflite
 * El modelo se almacena en src/assets/models/waste_classifier_v1.tflite
 *
 * Flujo:
 * 1. Cargar modelo (lazy, una vez)
 * 2. Preprocesar imagen (resize 224x224, normalizar)
 * 3. Ejecutar inferencia
 * 4. Interpretar resultados (softmax → clase con mayor probabilidad)
 */

import { WasteType } from '@/domain/entities/WasteClassification';
import {
  ModelNotLoadedError,
  ModelLoadError,
} from '@/domain/errors/ClassificationError';
import { logger } from '@/shared/utils/logger';
import { INDEX_TO_WASTE_TYPE, NUM_CLASSES, MIN_CONFIDENCE_THRESHOLD } from './ClassificationLabels';
import { validateImageUri } from './ImagePreprocessor';

export interface InferenceResult {
  wasteType: WasteType;
  confidence: number;
  probabilities: number[];
  inferenceTimeMs: number;
}

export class TensorFlowService {
  private model: any = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Carga el modelo TFLite de forma lazy.
   * Si ya está cargado, retorna inmediatamente.
   * Si está en proceso de carga, espera la promesa existente.
   */
  async loadModel(): Promise<void> {
    if (this.model) return;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = this._doLoadModel();

    try {
      await this.loadPromise;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  private async _doLoadModel(): Promise<void> {
    try {
      logger.info('[TFLite] Cargando modelo de clasificación...');
      const startTime = Date.now();

      // TODO: Descomentar cuando se instale react-native-fast-tflite
      // const { loadTensorflowModel } = require('react-native-fast-tflite');
      // this.model = await loadTensorflowModel(
      //   require('@/assets/models/waste_classifier_v1.tflite')
      // );

      // SIMULACIÓN para desarrollo sin el modelo real
      this.model = { loaded: true };

      const elapsed = Date.now() - startTime;
      logger.info(`[TFLite] Modelo cargado en ${elapsed}ms`);
    } catch (error) {
      this.model = null;
      logger.error('[TFLite] Error cargando modelo:', error);
      throw new ModelLoadError(error instanceof Error ? error : undefined);
    }
  }

  /**
   * Ejecuta inferencia sobre una imagen y retorna la clasificación.
   */
  async classify(imageUri: string): Promise<InferenceResult> {
    if (!this.model) {
      throw new ModelNotLoadedError();
    }

    if (!validateImageUri(imageUri)) {
      throw new Error('URI de imagen no válida');
    }

    const startTime = Date.now();

    try {
      // TODO: Descomentar con react-native-fast-tflite real
      // const result = await this.model.run([imageUri]);
      // const probabilities = Array.from(result[0]) as number[];

      // SIMULACIÓN: Generar probabilidades aleatorias realistas
      const probabilities = this.generateMockProbabilities();

      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      const wasteType = INDEX_TO_WASTE_TYPE[maxIndex];
      const confidence = probabilities[maxIndex];
      const inferenceTimeMs = Date.now() - startTime;

      logger.debug(
        `[TFLite] Clasificación: ${wasteType} (${(confidence * 100).toFixed(1)}%) en ${inferenceTimeMs}ms`,
      );

      return {
        wasteType,
        confidence,
        probabilities,
        inferenceTimeMs,
      };
    } catch (error) {
      logger.error('[TFLite] Error en inferencia:', error);
      throw error;
    }
  }

  /**
   * Verifica si el modelo está cargado y listo.
   */
  isReady(): boolean {
    return this.model !== null && !this.isLoading;
  }

  /**
   * Libera los recursos del modelo de memoria.
   */
  async dispose(): Promise<void> {
    if (this.model) {
      // TODO: Llamar dispose del modelo real
      this.model = null;
      logger.info('[TFLite] Modelo liberado de memoria');
    }
  }

  /**
   * Genera probabilidades simuladas para desarrollo.
   * En producción, esto se elimina y se usa el modelo real.
   */
  private generateMockProbabilities(): number[] {
    const probs = Array.from({ length: NUM_CLASSES }, () => Math.random() * 0.1);
    // Hacer que una clase domine (simular clasificación exitosa)
    const dominantIndex = Math.floor(Math.random() * NUM_CLASSES);
    probs[dominantIndex] = 0.7 + Math.random() * 0.25; // 70-95%

    // Normalizar para que sumen 1
    const sum = probs.reduce((a, b) => a + b, 0);
    return probs.map((p) => p / sum);
  }
}

/** Instancia singleton del servicio */
export const tensorFlowService = new TensorFlowService();
