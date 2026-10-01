/**
 * Servicio IoT de alto nivel.
 * Orquesta la conexión MQTT, publicación de clasificaciones
 * y suscripción a datos de contenedores.
 *
 * Este es el puente entre la app y la red IoT simulada.
 */

import { mqttClient, MqttConnectionState } from './MqttClient';
import { MqttTopics, extractContainerIdFromTopic } from './MqttTopics';
import {
  serializeClassificationMessage,
  parseFillLevelMessage,
  parseSystemAlertMessage,
  type ClassificationMessage,
  type FillLevelMessage,
  type SystemAlertMessage,
} from './MqttMessageParser';
import { logger } from '@/shared/utils/logger';
import type { ClassificationResult } from '@/domain/entities/WasteClassification';

export type FillLevelHandler = (containerId: string, level: number, timestamp: string) => void;
export type AlertHandler = (alert: SystemAlertMessage) => void;

class IoTService {
  private fillLevelHandlers: Set<FillLevelHandler> = new Set();
  private alertHandlers: Set<AlertHandler> = new Set();
  private messageSubscription: { unsubscribe: () => void } | null = null;
  private initialized = false;

  /**
   * Inicializa el servicio IoT: conecta al broker y suscribe a topics base.
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      await mqttClient.connect({
        clientId: `greennode_app_${userId}`,
      });

      // Suscribirse a fill levels de todos los contenedores
      await mqttClient.subscribe(MqttTopics.allContainersFill(), 0);

      // Suscribirse a alertas del sistema
      await mqttClient.subscribe(MqttTopics.systemAlerts(), 1);

      // Registrar handler de mensajes entrantes
      this.messageSubscription = mqttClient.onMessage((topic, payload) => {
        this.handleIncomingMessage(topic, payload);
      });

      this.initialized = true;
      logger.info('[IoT] Servicio inicializado para usuario:', userId);
    } catch (error) {
      logger.error('[IoT] Error inicializando servicio:', error);
      throw error;
    }
  }

  /**
   * Publica una clasificación en la red IoT.
   */
  async publishClassification(result: ClassificationResult): Promise<boolean> {
    const message: ClassificationMessage = {
      userId: result.userId,
      wasteType: result.wasteType,
      confidence: result.confidence,
      timestamp: result.timestamp,
      location: result.location,
    };

    const topic = MqttTopics.userClassification(result.userId);
    const payload = serializeClassificationMessage(message);

    const published = await mqttClient.publishClassification(topic, payload);

    if (published) {
      logger.info(`[IoT] Clasificación publicada: ${result.wasteType} (${(result.confidence * 100).toFixed(0)}%)`);
    }

    return published;
  }

  /**
   * Suscribirse a actualizaciones de fill level de contenedores.
   */
  onFillLevelUpdate(handler: FillLevelHandler): () => void {
    this.fillLevelHandlers.add(handler);
    return () => {
      this.fillLevelHandlers.delete(handler);
    };
  }

  /**
   * Suscribirse a alertas del sistema.
   */
  onAlert(handler: AlertHandler): () => void {
    this.alertHandlers.add(handler);
    return () => {
      this.alertHandlers.delete(handler);
    };
  }

  /**
   * Obtiene el estado de la conexión MQTT.
   */
  getConnectionState(): MqttConnectionState {
    return mqttClient.getConnectionState();
  }

  /**
   * Verifica si está conectado.
   */
  isConnected(): boolean {
    return mqttClient.isConnected();
  }

  /**
   * Desconecta y limpia recursos.
   */
  async shutdown(): Promise<void> {
    this.messageSubscription?.unsubscribe();
    this.messageSubscription = null;
    this.fillLevelHandlers.clear();
    this.alertHandlers.clear();
    await mqttClient.disconnect();
    this.initialized = false;
    logger.info('[IoT] Servicio apagado');
  }

  // --- Simulación de datos IoT para desarrollo ---

  /**
   * Simula la recepción de datos de fill level de un contenedor.
   * Útil para probar la UI sin un broker real.
   */
  simulateFillLevelUpdate(containerId: string, fillLevel: number): void {
    const payload = JSON.stringify({
      containerId,
      fillLevel,
      timestamp: new Date().toISOString(),
      temperature: 20 + Math.random() * 10,
      batteryLevel: 70 + Math.random() * 30,
    });
    mqttClient.simulateIncomingMessage(
      MqttTopics.containerFillLevel(containerId),
      payload,
    );
  }

  /**
   * Inicia simulación periódica de datos de contenedores.
   * Genera actualizaciones cada intervalMs milisegundos.
   */
  startSimulation(containerIds: string[], intervalMs: number = 10000): () => void {
    const timer = setInterval(() => {
      const randomContainer = containerIds[Math.floor(Math.random() * containerIds.length)];
      const randomFillLevel = Math.min(100, Math.max(0, Math.random() * 100));
      this.simulateFillLevelUpdate(randomContainer, Math.round(randomFillLevel));
    }, intervalMs);

    logger.info(`[IoT] Simulación iniciada: ${containerIds.length} contenedores, intervalo ${intervalMs}ms`);

    return () => {
      clearInterval(timer);
      logger.info('[IoT] Simulación detenida');
    };
  }

  // --- Private ---

  private handleIncomingMessage(topic: string, payload: string): void {
    // Fill level updates
    const containerId = extractContainerIdFromTopic(topic);
    if (containerId) {
      const msg = parseFillLevelMessage(payload);
      if (msg) {
        this.fillLevelHandlers.forEach((handler) => {
          try {
            handler(msg.containerId, msg.fillLevel, msg.timestamp);
          } catch {}
        });
      }
      return;
    }

    // System alerts
    if (topic === MqttTopics.systemAlerts()) {
      const alert = parseSystemAlertMessage(payload);
      if (alert) {
        this.alertHandlers.forEach((handler) => {
          try {
            handler(alert);
          } catch {}
        });
      }
      return;
    }
  }
}

/** Instancia singleton del servicio IoT */
export const iotService = new IoTService();
