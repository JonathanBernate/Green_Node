import { config } from '../config/env';
import type { Container } from '../lib/domain';
import { ContainerStatus } from '../lib/domain';
import type { ContainerHealth } from '../types';

export const HEALTH_LABELS: Record<ContainerHealth, string> = {
  NORMAL: 'Normal',
  WARNING: 'Advertencia',
  CRITICAL: 'Crítico',
  OFFLINE: 'Sin conexión',
};

export const HEALTH_COLORS: Record<ContainerHealth, string> = {
  NORMAL: '#16A34A',
  WARNING: '#F5A524',
  CRITICAL: '#E5484D',
  OFFLINE: '#8A98A0',
};

/**
 * Deriva el estado operativo. Umbrales en config.thresholds (parámetros de diseño).
 * OFFLINE: estado reportado offline/mantenimiento, o sin comunicación reciente.
 */
export function deriveHealth(c: Pick<Container, 'fillLevel' | 'status' | 'lastUpdated'>, now = Date.now()): ContainerHealth {
  const last = Date.parse(c.lastUpdated);
  const silentMin = Number.isFinite(last) ? (now - last) / 60000 : Infinity;
  if (c.status === ContainerStatus.OFFLINE || c.status === ContainerStatus.MAINTENANCE) return 'OFFLINE';
  if (silentMin > config.thresholds.offlineAfterMin) return 'OFFLINE';
  if (c.fillLevel >= config.thresholds.critical) return 'CRITICAL';
  if (c.fillLevel >= config.thresholds.warning) return 'WARNING';
  return 'NORMAL';
}

export function formatAgo(iso: string | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `hace ${s} s`;
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  return `hace ${Math.round(s / 3600)} h`;
}
