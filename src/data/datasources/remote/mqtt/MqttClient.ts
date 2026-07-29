/**
 * Cliente MQTT singleton para comunicación IoT.
 *
 * Protocolo: MQTT v3.1.1 sobre TLS 1.3
 * Librería: sp-react-native-mqtt (cuando se instale)
 *
 * Características:
 * - Reconexión con backoff exponencial (1s → 2s → 4s → ... → 60s max)
 * - Gestión de suscripciones
 * - Handlers de mensajes por topic (patrón Observer)
 * - Rate limiting: máximo 1 mensaje de clasificación por minuto
 * - Manejo de estado de conexión
 */

import { logger } from '@/shared/utils/logger';
import {
  MqttConnectionError,
  MqttPublishError,
  MqttSubscribeError,
} from '@/domain/errors/MqttError';
import { ENV } from '@/shared/config/environment';

export type QoS = 0 | 1 | 2;
export type MessageHandler = (topic: string, payload: string) => void;
export type ConnectionHandler = (connected: boolean) => void;

export interface MqttConnectOptions {
  clientId?: string;
  username?: string;
  password?: string;
  keepAlive?: number;
  cleanSession?: boolean;
}

export interface Subscription {
  unsubscribe: () => void;
}

export enum MqttConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

class MqttClient {
  private client: any = null;
  private connectionState: MqttConnectionState = MqttConnectionState.DISCONNECTED;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private subscribedTopics: Map<string, QoS> = new Map();

  // Reconexión
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000; // 1s
  private readonly maxReconnectDelay = 60000; // 60s
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false;

  // Rate limiting
  private lastClassificationPublish = 0;
  private readonly classificationRateLimit = 60000; // 1 minuto

  /**
   * Conecta al broker MQTT.
   */
  async connect(options?: MqttConnectOptions): Promise<void> {
    if (this.connectionState === MqttConnectionState.CONNECTED) {
      logger.info('[MQTT] Ya conectado');
      return;
    }

    this.connectionState = MqttConnectionState.CONNECTING;
    this.isManualDisconnect = false;

    const clientId = options?.clientId ?? `greennode_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      logger.info(`[MQTT] Conectando a ${ENV.mqttBrokerUrl}:${ENV.mqttPort}...`);

      // TODO: Descomentar cuando se instale sp-react-native-mqtt
      // const Mqtt = require('sp-react-native-mqtt');
      // this.client = await new Promise((resolve, reject) => {
      //   const client = Mqtt.createClient({
      //     uri: `${ENV.mqttBrokerUrl}:${ENV.mqttPort}`,
      //     clientId,
      //     auth: options?.username ? { user: options.username, pass: options.password } : undefined,
      //     keepalive: options?.keepAlive ?? 30,
      //     reconnect: false,
      //     clean: options?.cleanSession ?? true,
      //     qos: 1,
      //   });
      //
      //   client.on('connect', () => resolve(client));
      //   client.on('error', (err: any) => reject(err));
      //   client.connect();
      // });
      //
      // this.client.on('closed', () => this.handleDisconnect());
      // this.client.on('error', (err: any) => logger.error('[MQTT] Error:', err));
      // this.client.on('message', (msg: any) => this.handleMessage(msg));

      // SIMULACIÓN para desarrollo
      await this.simulateConnect();

      this.connectionState = MqttConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);

      logger.info('[MQTT] Conectado exitosamente');

      // Re-suscribirse a topics previos
      await this.resubscribeAll();
    } catch (error) {
      this.connectionState = MqttConnectionState.DISCONNECTED;
      this.notifyConnectionChange(false);
      throw new MqttConnectionError(ENV.mqttBrokerUrl, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Desconecta del broker MQTT.
   */
  async disconnect(): Promise<void> {
    this.isManualDisconnect = true;
    this.clearReconnectTimer();

    if (this.client) {
      try {
        // TODO: this.client.disconnect();
        this.client = null;
      } catch {}
    }

    this.connectionState = MqttConnectionState.DISCONNECTED;
    this.notifyConnectionChange(false);
    logger.info('[MQTT] Desconectado');
  }

  /**
   * Publica un mensaje en un topic.
   */
  async publish(topic: string, payload: string, qos: QoS = 1): Promise<void> {
    if (this.connectionState !== MqttConnectionState.CONNECTED) {
      throw new MqttPublishError(topic, new Error('No conectado al broker'));
    }

    try {
      // TODO: Descomentar con librería real
      // this.client.publish(topic, payload, qos, false);

      // SIMULACIÓN
      logger.debug(`[MQTT] PUBLISH → ${topic} (QoS ${qos}): ${payload.substring(0, 100)}...`);
    } catch (error) {
      throw new MqttPublishError(topic, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Publica clasificación con rate limiting.
   */
  async publishClassification(topic: string, payload: string): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastClassificationPublish < this.classificationRateLimit) {
      logger.warn('[MQTT] Rate limit: clasificación ignorada (1/min)');
      return false;
    }

    await this.publish(topic, payload, 1);
    this.lastClassificationPublish = now;
    return true;
  }

  /**
   * Suscribe a un topic.
   */
  async subscribe(topic: string, qos: QoS = 1): Promise<void> {
    if (this.connectionState !== MqttConnectionState.CONNECTED) {
      // Guardar para re-suscribir al conectar
      this.subscribedTopics.set(topic, qos);
      return;
    }

    try {
      // TODO: this.client.subscribe(topic, qos);
      this.subscribedTopics.set(topic, qos);
      logger.debug(`[MQTT] SUBSCRIBE → ${topic} (QoS ${qos})`);
    } catch (error) {
      throw new MqttSubscribeError(topic, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Desuscribe de un topic.
   */
  async unsubscribe(topic: string): Promise<void> {
    try {
      // TODO: this.client.unsubscribe(topic);
      this.subscribedTopics.delete(topic);
      logger.debug(`[MQTT] UNSUBSCRIBE → ${topic}`);
    } catch {}
  }

  /**
   * Registra un handler para mensajes entrantes.
   */
  onMessage(handler: MessageHandler): Subscription {
    this.messageHandlers.add(handler);
    return {
      unsubscribe: () => {
        this.messageHandlers.delete(handler);
      },
    };
  }

  /**
   * Registra un handler para cambios de estado de conexión.
   */
  onConnectionChange(handler: ConnectionHandler): Subscription {
    this.connectionHandlers.add(handler);
    // Notificar estado actual inmediatamente
    handler(this.connectionState === MqttConnectionState.CONNECTED);
    return {
      unsubscribe: () => {
        this.connectionHandlers.delete(handler);
      },
    };
  }

  /**
   * Retorna el estado actual de la conexión.
   */
  getConnectionState(): MqttConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === MqttConnectionState.CONNECTED;
  }

  // --- Private methods ---

  private handleMessage(msg: { topic: string; data: any }): void {
    const payload = typeof msg.data === 'string' ? msg.data : String(msg.data);
    this.messageHandlers.forEach((handler) => {
      try {
        handler(msg.topic, payload);
      } catch (err) {
        logger.error('[MQTT] Error en handler de mensaje:', err);
      }
    });
  }

  private handleDisconnect(): void {
    this.connectionState = MqttConnectionState.DISCONNECTED;
    this.notifyConnectionChange(false);

    if (!this.isManualDisconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('[MQTT] Máximo de intentos de reconexión alcanzado');
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay,
    );

    this.connectionState = MqttConnectionState.RECONNECTING;
    this.reconnectAttempts++;

    logger.info(`[MQTT] Reconectando en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        // scheduleReconnect se llamará de nuevo desde handleDisconnect
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async resubscribeAll(): Promise<void> {
    for (const [topic, qos] of this.subscribedTopics) {
      try {
        // TODO: this.client.subscribe(topic, qos);
        logger.debug(`[MQTT] Re-suscrito a ${topic}`);
      } catch {}
    }
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch {}
    });
  }

  // --- Simulación ---

  private async simulateConnect(): Promise<void> {
    // Simula latencia de conexión
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.client = { connected: true, simulated: true };
  }

  /**
   * Simula la recepción de un mensaje (para testing/desarrollo).
   */
  simulateIncomingMessage(topic: string, payload: string): void {
    this.handleMessage({ topic, data: payload });
  }
}

/** Instancia singleton del cliente MQTT */
export const mqttClient = new MqttClient();
