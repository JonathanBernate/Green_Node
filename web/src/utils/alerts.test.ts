import { describe, expect, it } from 'vitest';
import { ContainerStatus, WasteType } from '../lib/domain';
import { getMockSnapshot } from '../mocks/network';
import { deriveAlerts } from './alerts';

const now = '2026-10-01T12:00:00Z';
const c = (id: string, fillLevel: number, status = ContainerStatus.ACTIVE) => ({
  id, address: '', latitude: 0, longitude: 0, fillLevel, status, wasteTypes: [WasteType.PLASTIC], capacity: 100, lastUpdated: '2026-10-01T11:59:50Z',
});

describe('deriveAlerts', () => {
  it('genera alerta crítica y de nodo sin comunicación', () => {
    const alerts = deriveAlerts([c('a', 95), c('b', 10, ContainerStatus.OFFLINE), c('d', 20)], undefined, 'SIMULATION', now);
    expect(alerts.map((a) => a.type).sort()).toEqual(['container_critical', 'node_offline']);
    expect(alerts.every((a) => a.source === 'SIMULATION')).toBe(true);
  });
  it('no genera alertas de red si las métricas están dentro de los umbrales', () => {
    const snap = getMockSnapshot('sc-10');
    expect(deriveAlerts([], snap, 'SIMULATION', now)).toEqual([]);
  });
  it('genera alerta de latencia cuando supera el umbral', () => {
    const snap = getMockSnapshot('sc-10');
    snap.summary.latencyMs = 900;
    expect(deriveAlerts([], snap, 'SIMULATION', now).map((a) => a.type)).toContain('high_latency');
  });
});
