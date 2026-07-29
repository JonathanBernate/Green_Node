/**
 * Servicio de cámara para captura de imágenes de residuos.
 *
 * Dependencia: react-native-vision-camera
 *
 * Responsabilidades:
 * - Gestión de permisos
 * - Captura de imagen con resolución optimizada para el modelo
 * - Control de flash
 * - Optimización para clasificación (crop central, JPEG quality)
 */

import { Platform } from 'react-native';
import { logger } from '@/shared/utils/logger';

export type CameraPermissionStatus = 'granted' | 'denied' | 'not-determined' | 'restricted';
export type CameraPosition = 'back' | 'front';

export interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  path: string;
}

export interface CameraConfig {
  position: CameraPosition;
  flashEnabled: boolean;
  quality: number; // 0.0 - 1.0
  targetWidth: number;
  targetHeight: number;
}

const DEFAULT_CONFIG: CameraConfig = {
  position: 'back',
  flashEnabled: false,
  quality: 0.8,
  targetWidth: 640,
  targetHeight: 640,
};

class CameraService {
  private config: CameraConfig = { ...DEFAULT_CONFIG };

  /**
   * Verifica el estado del permiso de cámara.
   */
  async checkPermission(): Promise<CameraPermissionStatus> {
    try {
      // TODO: Descomentar con react-native-vision-camera
      // const { Camera } = require('react-native-vision-camera');
      // return await Camera.getCameraPermissionStatus();

      // SIMULACIÓN
      return 'granted';
    } catch (error) {
      logger.error('[Camera] Error verificando permiso:', error);
      return 'denied';
    }
  }

  /**
   * Solicita el permiso de cámara al usuario.
   */
  async requestPermission(): Promise<CameraPermissionStatus> {
    try {
      // TODO: Descomentar con react-native-vision-camera
      // const { Camera } = require('react-native-vision-camera');
      // return await Camera.requestCameraPermission();

      // SIMULACIÓN
      return 'granted';
    } catch (error) {
      logger.error('[Camera] Error solicitando permiso:', error);
      return 'denied';
    }
  }

  /**
   * Actualiza la configuración de la cámara.
   */
  setConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CameraConfig {
    return { ...this.config };
  }

  /**
   * Activa/desactiva el flash.
   */
  toggleFlash(): boolean {
    this.config.flashEnabled = !this.config.flashEnabled;
    return this.config.flashEnabled;
  }

  /**
   * Cambia entre cámara trasera y frontal.
   */
  togglePosition(): CameraPosition {
    this.config.position = this.config.position === 'back' ? 'front' : 'back';
    return this.config.position;
  }

  /**
   * Simula la captura de una foto.
   * En producción, se usa el ref de la cámara de react-native-vision-camera.
   */
  async capturePhoto(): Promise<CapturedImage> {
    // TODO: Implementar con react-native-vision-camera ref
    // const photo = await camera.current.takePhoto({
    //   flash: this.config.flashEnabled ? 'on' : 'off',
    //   qualityPrioritization: 'quality',
    // });
    // return {
    //   uri: `file://${photo.path}`,
    //   width: photo.width,
    //   height: photo.height,
    //   path: photo.path,
    // };

    // SIMULACIÓN para desarrollo
    logger.info('[Camera] Foto capturada (simulada)');
    return {
      uri: 'file:///mock/captured_image.jpg',
      width: this.config.targetWidth,
      height: this.config.targetHeight,
      path: '/mock/captured_image.jpg',
    };
  }
}

export const cameraService = new CameraService();
