/**
 * Generadores de topics MQTT para la red IoT GreenNode.
 *
 * Convención de topics:
 *   greennode/{scope}/{identifier}/{action}
 *
 * QoS:
 *   - Clasificaciones: QoS 1 (at-least-once) — no perder datos
 *   - Fill levels: QoS 0 (at-most-once) — datos periódicos, tolerable perder uno
 *   - Alertas: QoS 2 (exactly-once) — crítico
 */

export const MqttTopics = {
  /** Publicar resultado de clasificación del usuario */
  userClassification: (userId: string) =>
    `greennode/users/${userId}/classification`,

  /** Eventos generales del usuario (depósitos, logros) */
  userEvents: (userId: string) =>
    `greennode/users/${userId}/events`,

  /** Nivel de llenado de un contenedor específico */
  containerFillLevel: (containerId: string) =>
    `greennode/containers/${containerId}/fill`,

  /** Wildcard: todos los contenedores (suscripción) */
  allContainersFill: () =>
    'greennode/containers/+/fill',

  /** Estado de un contenedor (mantenimiento, offline, etc.) */
  containerStatus: (containerId: string) =>
    `greennode/containers/${containerId}/status`,

  /** Alertas del sistema (contenedor lleno, anomalías) */
  systemAlerts: () =>
    'greennode/system/alerts',

  /** Métricas de red (para el módulo de análisis) */
  networkMetrics: () =>
    'greennode/network/metrics',
} as const;

/**
 * Extrae el containerId de un topic de fill level.
 * Ejemplo: "greennode/containers/c-001/fill" → "c-001"
 */
export function extractContainerIdFromTopic(topic: string): string | null {
  const match = topic.match(/^greennode\/containers\/([^/]+)\/fill$/);
  return match ? match[1] : null;
}

/**
 * Extrae el userId de un topic de clasificación.
 */
export function extractUserIdFromTopic(topic: string): string | null {
  const match = topic.match(/^greennode\/users\/([^/]+)\/classification$/);
  return match ? match[1] : null;
}
