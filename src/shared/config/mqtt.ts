/**
 * Configuración MQTT para la comunicación IoT.
 * Protocolo: MQTT v3.1.1 + TLS 1.3
 * QoS: 1 para clasificaciones (at-least-once), 0 para fill levels (at-most-once)
 */

import { ENV } from './environment';

export const MQTT_CONFIG = {
  brokerUrl: ENV.mqttBrokerUrl,
  port: ENV.mqttPort,
  keepAlive: 30, // segundos
  reconnect: true,
  cleanSession: true,
  qos: 1 as const,
  reconnectMaxAttempts: 10,
  reconnectBaseDelay: 1000, // ms
  reconnectMaxDelay: 60000, // ms
} as const;

/**
 * Generadores de topics MQTT.
 * Patrón: greennode/{scope}/{identifier}/{action}
 */
export const MQTT_TOPICS = {
  /** Topic para publicar clasificaciones del usuario */
  userClassification: (userId: string) =>
    `greennode/${userId}/classification`,

  /** Topic para eventos generales del usuario */
  userEvents: (userId: string) =>
    `greennode/${userId}/events`,

  /** Topic para suscribirse al nivel de llenado de un contenedor */
  containerFillLevel: (containerId: string) =>
    `greennode/containers/${containerId}/fill`,

  /** Wildcard para todos los contenedores */
  allContainersFillLevel: () =>
    'greennode/containers/+/fill',

  /** Topic para alertas del sistema */
  systemAlerts: () =>
    'greennode/system/alerts',
} as const;
