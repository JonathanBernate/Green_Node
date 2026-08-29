/**
 * Simulador de la red IoT / broker MQTT para el dashboard web.
 * Replica el comportamiento de src/data/datasources/remote/mqtt/MqttClient.ts
 * pero en el navegador: publica logs en consola y emite actualizaciones de
 * fill level de los contenedores en tiempo real.
 */

import { Container, ContainerStatus, getFillLevelCategory } from './domain';

const log = {
  info: (...a: unknown[]) => console.info('[GreenNode]', ...a),
  debug: (...a: unknown[]) => console.debug('[GreenNode]', ...a),
  warn: (...a: unknown[]) => console.warn('[GreenNode]', ...a),
};

export enum MqttConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

export interface SystemAlert {
  id: string;
  containerId: string;
  message: string;
  level: 'info' | 'warning' | 'critical';
  timestamp: string;
}

type ConnectionListener = (state: MqttConnectionState) => void;
type FillListener = (containerId: string, fillLevel: number, status: ContainerStatus) => void;
type AlertListener = (alert: SystemAlert) => void;
type PublishListener = (count: number, lastAt: string) => void;

class IoTSimulator {
  private state = MqttConnectionState.DISCONNECTED;
  private timer: ReturnType<typeof setInterval> | null = null;
  private publishCount = 0;

  private connectionListeners = new Set<ConnectionListener>();
  private fillListeners = new Set<FillListener>();
  private alertListeners = new Set<AlertListener>();
  private publishListeners = new Set<PublishListener>();

  private containers: Container[] = [];

  getState(): MqttConnectionState {
    return this.state;
  }

  getPublishCount(): number {
    return this.publishCount;
  }

  /** Conecta al broker simulado e inicia la telemetría periódica. */
  async connect(containers: Container[]): Promise<void> {
    this.containers = containers;
    if (this.state === MqttConnectionState.CONNECTED) return;

    this.setState(MqttConnectionState.CONNECTING);
    log.info('[MQTT] Conectando a mqtt://localhost:1883...');
    await new Promise((r) => setTimeout(r, 500));

    this.setState(MqttConnectionState.CONNECTED);
    log.info('[MQTT] Conectado exitosamente');
    log.debug('[MQTT] SUBSCRIBE → greennode/containers/+/fill (QoS 1)');
    log.debug('[MQTT] SUBSCRIBE → greennode/system/alerts (QoS 1)');

    this.startTelemetry();
  }

  disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.setState(MqttConnectionState.DISCONNECTED);
    log.info('[MQTT] Desconectado');
  }

  /** Publica una clasificación al broker (con rate limiting real como en RN). */
  private lastClassificationPublish = 0;
  publishClassification(wasteType: string, confidence: number): boolean {
    const now = Date.now();
    if (now - this.lastClassificationPublish < 60000) {
      log.warn('[MQTT] Rate limit: clasificación ignorada (1/min)');
    } else {
      this.lastClassificationPublish = now;
    }
    const topic = 'greennode/classifications';
    const payload = JSON.stringify({ wasteType, confidence: +confidence.toFixed(3), ts: new Date().toISOString() });
    log.debug(`[MQTT] PUBLISH → ${topic} (QoS 1): ${payload}`);
    this.recordPublish();
    return true;
  }

  private startTelemetry(): void {
    if (this.timer) return;
    // Cada 3s un nodo IoT reporta su nivel de llenado
    this.timer = setInterval(() => {
      if (this.containers.length === 0) return;
      const idx = Math.floor(Math.random() * this.containers.length);
      const c = this.containers[idx];

      // Los contenedores en mantenimiento no reportan
      if (c.status === ContainerStatus.MAINTENANCE) return;

      const delta = Math.random() * 6 - 1; // sube más de lo que baja
      let newFill = Math.max(0, Math.min(100, Math.round(c.fillLevel + delta)));
      c.fillLevel = newFill;
      c.lastUpdated = new Date().toISOString();

      let newStatus = c.status;
      if (newFill >= 90) newStatus = ContainerStatus.FULL;
      else if (c.status === ContainerStatus.FULL && newFill < 90) newStatus = ContainerStatus.ACTIVE;
      c.status = newStatus;

      const topic = `greennode/containers/${c.id}/fill`;
      log.debug(`[MQTT] RECV ← ${topic}: ${newFill}% (${getFillLevelCategory(newFill)})`);
      this.fillListeners.forEach((l) => l(c.id, newFill, newStatus));
      this.recordPublish();

      // Alerta si se llena
      if (newFill >= 90) {
        const alert: SystemAlert = {
          id: `a_${Date.now()}`,
          containerId: c.id,
          message: `Contenedor ${c.id} lleno (${newFill}%) — requiere recolección`,
          level: 'critical',
          timestamp: new Date().toISOString(),
        };
        log.warn(`[MQTT] ALERT ← greennode/system/alerts: ${alert.message}`);
        this.alertListeners.forEach((l) => l(alert));
      }
    }, 3000);
  }

  private recordPublish(): void {
    this.publishCount++;
    const at = new Date().toISOString();
    this.publishListeners.forEach((l) => l(this.publishCount, at));
  }

  private setState(s: MqttConnectionState): void {
    this.state = s;
    this.connectionListeners.forEach((l) => l(s));
  }

  onConnection(l: ConnectionListener): () => void {
    this.connectionListeners.add(l);
    l(this.state);
    return () => this.connectionListeners.delete(l);
  }
  onFill(l: FillListener): () => void {
    this.fillListeners.add(l);
    return () => this.fillListeners.delete(l);
  }
  onAlert(l: AlertListener): () => void {
    this.alertListeners.add(l);
    return () => this.alertListeners.delete(l);
  }
  onPublish(l: PublishListener): () => void {
    this.publishListeners.add(l);
    return () => this.publishListeners.delete(l);
  }
}

export const iotSimulator = new IoTSimulator();
