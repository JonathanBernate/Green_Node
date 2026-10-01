/**
 * Cliente MQTT REAL para el dashboard web de GreenNode.
 * Se conecta al broker Mosquitto vía WebSocket (puerto 9001) usando mqtt.js.
 *
 * Expone EXACTAMENTE la misma interfaz pública que el simulador
 * (web/src/lib/iotSimulator.ts), de modo que el store puede usar cualquiera
 * de los dos de forma intercambiable.
 */

import mqtt, { type MqttClient } from 'mqtt';
import { Container, ContainerStatus, getFillLevelCategory } from './domain';
import { MqttConnectionState, type SystemAlert, type NetworkMetrics } from './iotSimulator';

// Reexportamos para que los consumidores puedan importar todo desde aquí si quieren.
export { MqttConnectionState } from './iotSimulator';
export type { SystemAlert, NetworkMetrics } from './iotSimulator';

const log = {
  info: (...a: unknown[]) => console.info('[GreenNode]', ...a),
  debug: (...a: unknown[]) => console.debug('[GreenNode]', ...a),
  warn: (...a: unknown[]) => console.warn('[GreenNode]', ...a),
};

/**
 * URL del broker WebSocket. Por defecto ws://localhost:9001.
 * Si la web se sirve por HTTPS (p. ej. un túnel), forzamos wss:// para no
 * romper por contenido mixto; el usuario deberá exponer el broker por TLS.
 */
const DEFAULT_PORT = 9001;

function resolveWsUrl(): string {
  // Host: el mismo desde donde se sirve la web. Así funciona tanto en
  // localhost (PC) como por IP local (p. ej. 192.168.20.43 desde el celular
  // en la misma WiFi). Si no hay window (SSR/test), cae a localhost.
  const host =
    typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : 'localhost';

  // Si la página va por HTTPS (túnel), usa wss:// (requiere broker con TLS).
  // En HTTP normal (localhost o IP local), usa ws:// al puerto 9001.
  const proto =
    typeof window !== 'undefined' && window.location?.protocol === 'https:'
      ? 'wss'
      : 'ws';

  return `${proto}://${host}:${DEFAULT_PORT}`;
}

const WS_URL = resolveWsUrl();

const TOPIC_FILL_WILDCARD = 'greennode/containers/+/fill';
const TOPIC_ALERTS = 'greennode/system/alerts';
const TOPIC_CLASSIFICATIONS = 'greennode/classifications';
const TOPIC_METRICS = 'greennode/network/metrics';

type ConnectionListener = (state: MqttConnectionState) => void;
type FillListener = (containerId: string, fillLevel: number, status: ContainerStatus) => void;
type AlertListener = (alert: SystemAlert) => void;
type PublishListener = (count: number, lastAt: string) => void;
type MetricsListener = (m: NetworkMetrics) => void;

class MqttWebClient {
  private state = MqttConnectionState.DISCONNECTED;
  private client: MqttClient | null = null;
  private publishCount = 0;

  private connectionListeners = new Set<ConnectionListener>();
  private fillListeners = new Set<FillListener>();
  private alertListeners = new Set<AlertListener>();
  private publishListeners = new Set<PublishListener>();
  private metricsListeners = new Set<MetricsListener>();

  private containers: Container[] = [];

  getState(): MqttConnectionState {
    return this.state;
  }

  getPublishCount(): number {
    return this.publishCount;
  }

  /** Conecta al broker Mosquitto vía WebSocket y se suscribe a los topics. */
  async connect(containers: Container[]): Promise<void> {
    this.containers = containers;
    if (this.state === MqttConnectionState.CONNECTED) return;
    if (this.client) return; // ya hay un intento de conexión en curso

    this.setState(MqttConnectionState.CONNECTING);
    log.info(`[MQTT] Conectando a ${WS_URL}...`);

    const client = mqtt.connect(WS_URL, {
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      clean: true,
      clientId: `greennode-web-${Math.random().toString(16).slice(2, 10)}`,
    });
    this.client = client;

    client.on('connect', () => {
      this.setState(MqttConnectionState.CONNECTED);
      log.info('[MQTT] Conectado exitosamente');
      client.subscribe([TOPIC_FILL_WILDCARD, TOPIC_ALERTS, TOPIC_METRICS], { qos: 1 }, (err) => {
        if (err) {
          log.warn('[MQTT] Error al suscribirse:', err.message);
          return;
        }
        log.debug(`[MQTT] SUBSCRIBE → ${TOPIC_FILL_WILDCARD} (QoS 1)`);
        log.debug(`[MQTT] SUBSCRIBE → ${TOPIC_ALERTS} (QoS 1)`);
        log.debug(`[MQTT] SUBSCRIBE → ${TOPIC_METRICS} (QoS 1)`);
      });
    });

    client.on('reconnect', () => {
      this.setState(MqttConnectionState.RECONNECTING);
      log.info('[MQTT] Reconectando...');
    });

    client.on('close', () => {
      this.setState(MqttConnectionState.DISCONNECTED);
      log.info('[MQTT] Conexión cerrada');
    });

    client.on('offline', () => {
      this.setState(MqttConnectionState.DISCONNECTED);
      log.info('[MQTT] Sin conexión (offline)');
    });

    client.on('error', (err) => {
      log.warn('[MQTT] Error:', err?.message ?? err);
    });

    client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload.toString());
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
    this.setState(MqttConnectionState.DISCONNECTED);
    log.info('[MQTT] Desconectado');
  }

  /** Publica una clasificación al broker (QoS 1) con rate limiting de 60s. */
  private lastClassificationPublish = 0;
  publishClassification(wasteType: string, confidence: number): boolean {
    const now = Date.now();
    if (now - this.lastClassificationPublish < 60000) {
      log.warn('[MQTT] Rate limit: clasificación ignorada (1/min)');
    } else {
      this.lastClassificationPublish = now;
    }

    const payload = JSON.stringify({
      wasteType,
      confidence: +confidence.toFixed(3),
      ts: new Date().toISOString(),
    });

    if (!this.client || this.state !== MqttConnectionState.CONNECTED) {
      log.warn('[MQTT] PUBLISH descartado: cliente no conectado');
      return false;
    }

    this.client.publish(TOPIC_CLASSIFICATIONS, payload, { qos: 1 });
    log.debug(`[MQTT] PUBLISH → ${TOPIC_CLASSIFICATIONS} (QoS 1): ${payload}`);
    this.recordPublish();
    return true;
  }

  /** Procesa los mensajes entrantes del broker. */
  private handleMessage(topic: string, raw: string): void {
    if (topic.endsWith('/fill')) {
      this.handleFillMessage(topic, raw);
      return;
    }
    if (topic === TOPIC_ALERTS) {
      this.handleAlertMessage(topic, raw);
      return;
    }
    if (topic.endsWith('/metrics') || topic.includes('network/metrics')) {
      this.handleMetricsMessage(raw);
      return;
    }
    log.debug(`[MQTT] RECV ← ${topic} (ignorado): ${raw}`);
  }

  /** Parsea el payload de métricas del simulador Python (snake_case) a NetworkMetrics (camelCase). */
  private handleMetricsMessage(raw: string): void {
    let data: {
      packets_sent?: number;
      packets_failed?: number;
      avg_fill_level?: number;
      containers_full?: number;
      containers_active?: number;
      cycle?: number;
      total_nodes?: number;
      timestamp?: string;
    };
    try {
      data = JSON.parse(raw);
    } catch {
      log.warn(`[MQTT] JSON inválido en ${TOPIC_METRICS}: ${raw}`);
      return;
    }

    if (typeof data !== 'object' || data === null) {
      log.warn(`[MQTT] Payload de métricas inválido: ${raw}`);
      return;
    }

    const toNum = (v: unknown): number =>
      typeof v === 'number' && !Number.isNaN(v) ? v : 0;

    const metrics: NetworkMetrics = {
      packetsSent: toNum(data.packets_sent),
      packetsFailed: toNum(data.packets_failed),
      avgFillLevel: toNum(data.avg_fill_level),
      containersFull: toNum(data.containers_full),
      containersActive: toNum(data.containers_active),
      cycle: toNum(data.cycle),
      totalNodes: toNum(data.total_nodes),
      timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
    };

    log.debug(
      `[MQTT] METRICS ← ${TOPIC_METRICS}: ciclo ${metrics.cycle}, ${metrics.totalNodes} nodos, llenado prom. ${metrics.avgFillLevel}%`,
    );
    this.emitMetrics(metrics);
  }

  private emitMetrics(m: NetworkMetrics): void {
    this.metricsListeners.forEach((l) => l(m));
  }

  private handleFillMessage(topic: string, raw: string): void {
    let data: { containerId?: string; fillLevel?: number };
    try {
      data = JSON.parse(raw);
    } catch {
      log.warn(`[MQTT] JSON inválido en ${topic}: ${raw}`);
      return;
    }

    const containerId = data.containerId;
    const fillLevelRaw = data.fillLevel;
    if (typeof containerId !== 'string' || typeof fillLevelRaw !== 'number' || Number.isNaN(fillLevelRaw)) {
      log.warn(`[MQTT] Payload de fill incompleto en ${topic}: ${raw}`);
      return;
    }

    const fillLevel = Math.round(fillLevelRaw);
    const status = fillLevel >= 90 ? ContainerStatus.FULL : ContainerStatus.ACTIVE;

    log.debug(`[MQTT] RECV ← ${topic}: ${fillLevel}% (${getFillLevelCategory(fillLevel)})`);
    this.fillListeners.forEach((l) => l(containerId, fillLevel, status));
    this.recordPublish();
  }

  private handleAlertMessage(topic: string, raw: string): void {
    let data: {
      containerId?: string;
      message?: string;
      severity?: string;
      alertId?: string;
      timestamp?: string;
    };
    try {
      data = JSON.parse(raw);
    } catch {
      log.warn(`[MQTT] JSON inválido en ${topic}: ${raw}`);
      return;
    }

    const level: SystemAlert['level'] =
      data.severity === 'high' ? 'critical' : data.severity === 'medium' ? 'warning' : 'info';

    const alert: SystemAlert = {
      id: data.alertId ?? `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      containerId: data.containerId ?? '',
      message: data.message ?? 'Alerta del sistema',
      level,
      timestamp: data.timestamp ?? new Date().toISOString(),
    };

    log.warn(`[MQTT] ALERT ← ${topic}: ${alert.message}`);
    this.alertListeners.forEach((l) => l(alert));
  }

  private recordPublish(): void {
    this.publishCount++;
    const at = new Date().toISOString();
    this.publishListeners.forEach((l) => l(this.publishCount, at));
  }

  private setState(s: MqttConnectionState): void {
    if (this.state === s) return;
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
  onMetrics(l: MetricsListener): () => void {
    this.metricsListeners.add(l);
    return () => this.metricsListeners.delete(l);
  }
}

export const mqttWebClient = new MqttWebClient();
