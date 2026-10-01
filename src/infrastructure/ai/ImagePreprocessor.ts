/**
 * Preprocesamiento de imágenes para el modelo de clasificación.
 *
 * MobileNetV2 espera:
 * - Input shape: [1, 224, 224, 3]
 * - Valores normalizados: [0, 1] o [-1, 1] según el entrenamiento
 * - Formato: RGB
 *
 * En React Native, usamos react-native-fast-tflite que maneja el resize
 * internamente, pero necesitamos preparar la imagen antes.
 */

export const MODEL_INPUT_SIZE = 224;

export interface PreprocessedImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Valida que la imagen tenga un formato aceptable para el modelo.
 */
export function validateImageUri(uri: string): boolean {
  if (!uri) return false;
  // Acepta URIs locales (file://) y contenido (content://)
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('/') ||
    uri.startsWith('data:image')
  );
}

/**
 * Genera los parámetros de resize manteniendo aspect ratio con crop central.
 */
export function getCropParams(
  srcWidth: number,
  srcHeight: number,
  targetSize: number = MODEL_INPUT_SIZE,
) {
  const scale = Math.max(targetSize / srcWidth, targetSize / srcHeight);
  const scaledWidth = Math.round(srcWidth * scale);
  const scaledHeight = Math.round(srcHeight * scale);
  const offsetX = Math.round((scaledWidth - targetSize) / 2);
  const offsetY = Math.round((scaledHeight - targetSize) / 2);

  return {
    scale,
    scaledWidth,
    scaledHeight,
    cropX: offsetX,
    cropY: offsetY,
    targetSize,
  };
}
