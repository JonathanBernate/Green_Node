import { AppError } from './AppError';

export class ClassificationError extends AppError {
  constructor(message: string, code: string, cause?: Error) {
    super(message, code, cause);
  }
}

export class ModelNotLoadedError extends ClassificationError {
  constructor(cause?: Error) {
    super('El modelo de clasificación no está cargado', 'CLASS_MODEL_NOT_LOADED', cause);
  }
}

export class ModelLoadError extends ClassificationError {
  constructor(cause?: Error) {
    super('Error al cargar el modelo de clasificación', 'CLASS_MODEL_LOAD_FAILED', cause);
  }
}

export class ImagePreprocessingError extends ClassificationError {
  constructor(cause?: Error) {
    super('Error al procesar la imagen', 'CLASS_IMAGE_PREPROCESSING', cause);
  }
}

export class LowConfidenceError extends ClassificationError {
  constructor(confidence: number, cause?: Error) {
    super(
      `Confianza muy baja (${(confidence * 100).toFixed(1)}%). Intenta con otra foto`,
      'CLASS_LOW_CONFIDENCE',
      cause,
    );
  }
}
