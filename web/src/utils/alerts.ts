import { config } from '../config/env';
import type { Container } from '../lib/domain';
import type { Alert, DataSource, NetworkSnapshot } from '../types';
import { deriveHealth } from './status';

/** Alertas calculadas a partir del estado actual (contenedores y métricas de red). */
export function deriveAlerts(
  containers: Container[],
  network: NetworkSnapshot | undefined,
  source: DataSource,
  now = new Date().toISOString(),
): Alert[] {
  const out: Alert[] = [];
  for (const c of containers) {
    const h = deriveHealth(c, Date.parse(now));
    if (h === 'CRITICAL') {
      out.push({
        id: `crit-${c.id}`, type: 'container_critical', severity: 'critical', containerId: c.id,
        message: `Contenedor ${c.id} crítico (${c.fillLevel}%)`, timestamp: c.lastUpdated, source,
      });
    } else if (h === 'OFFLINE') {
      out.push({
        id: `off-${c.id}`, type: 'node_offline', severity: 'warning', containerId: c.id,
        message: `Nodo ${c.id} sin comunicación`, timestamp: c.lastUpdated, source,
      });
    }
  }
  if (network) {
    const m = network.summary;
    if (m.latencyMs > config.alerts.latencyMs) {
      out.push({
        id: 'net-latency', type: 'high_latency', severity: 'warning', timestamp: now, source,
        message: `Latencia elevada (${m.latencyMs.toFixed(0)} ms > ${config.alerts.latencyMs} ms)`,
      });
    }
    if (m.packetLossPct > config.alerts.packetLossPct) {
      out.push({
        id: 'net-loss', type: 'high_packet_loss', severity: 'warning', timestamp: now, source,
        message: `Pérdida de paquetes elevada (${m.packetLossPct.toFixed(1)} %)`,
      });
    }
  }
  return out;
}
