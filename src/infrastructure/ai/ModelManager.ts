/**
 * Gestor del modelo de clasificación.
 * Maneja descarga, versiones, cache y ciclo de vida del modelo TFLite.
 */

import { tensorFlowService } from './TensorFlowService';
import { logger } from '@/shared/utils/logger';

export enum ModelStatus {
  NOT_LOADED = 'not_loaded',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

export interface ModelInfo {
  version: string;
  sizeBytes: number;
  inputShape: [number, number, number, number]; // [batch, height, width, channels]
  numClasses: number;
  lastLoaded?: string;
}

const CURRENT_MODEL_INFO: ModelInfo = {
  version: '1.0.0',
  sizeBytes: 8_500_000, // ~8.5 MB (MobileNetV2 quantizado)
  inputShape: [1, 224, 224, 3],
  numClasses: 6,
};

class ModelManager {
  private status: ModelStatus = ModelStatus.NOT_LOADED;
  private listeners: Set<(status: ModelStatus) => void> = new Set();

  getStatus(): ModelStatus {
    return this.status;
  }

  getModelInfo(): ModelInfo {
    return { ...CURRENT_MODEL_INFO };
  }

  /**
   * Inicializa el modelo. Llamar al entrar a ScanScreen.
   */
  async initialize(): Promise<void> {
    if (this.status === ModelStatus.READY || this.status === ModelStatus.LOADING) {
      return;
    }

    this.setStatus(ModelStatus.LOADING);

    try {
      await tensorFlowService.loadModel();
      this.setStatus(ModelStatus.READY);
      CURRENT_MODEL_INFO.lastLoaded = new Date().toISOString();
      logger.info('[ModelManager] Modelo inicializado correctamente');
    } catch (error) {
      this.setStatus(ModelStatus.ERROR);
      logger.error('[ModelManager] Error al inicializar modelo:', error);
      throw error;
    }
  }

  /**
   * Libera recursos del modelo. Llamar al salir de la app o en background.
   */
  async release(): Promise<void> {
    await tensorFlowService.dispose();
    this.setStatus(ModelStatus.NOT_LOADED);
  }

  /**
   * Suscribirse a cambios de estado del modelo.
   */
  onStatusChange(callback: (status: ModelStatus) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private setStatus(status: ModelStatus): void {
    this.status = status;
    this.listeners.forEach((cb) => {
      try {
        cb(status);
      } catch {}
    });
  }
}

export const modelManager = new ModelManager();
