import { describe, expect, it } from 'vitest';
import { getMockSnapshot, MOCK_SCENARIOS } from './network';

describe('mock de red (SIMULACIÓN)', () => {
  it('es determinista para el mismo escenario (salvo las marcas de tiempo)', () => {
    const a = getMockSnapshot('sc-50');
    const b = getMockSnapshot('sc-50');
    expect(a.series.map((p) => [p.latencyMs, p.pdr, p.throughputMsgS])).toEqual(b.series.map((p) => [p.latencyMs, p.pdr, p.throughputMsgS]));
    expect(a.summary).toEqual(b.summary);
  });
  it('reparte todos los nodos entre los gateways', () => {
    for (const s of MOCK_SCENARIOS) {
      const snap = getMockSnapshot(s.id);
      expect(snap.nodesPerGateway.reduce((a, g) => a + g.nodes, 0)).toBe(s.nodes);
      expect(snap.nodesPerGateway).toHaveLength(s.gateways);
    }
  });
  it('PDR + pérdida suman 100 y el PDR está en rango', () => {
    const { summary } = getMockSnapshot('sc-100');
    expect(summary.pdr + summary.packetLossPct).toBeCloseTo(100);
    expect(summary.pdr).toBeGreaterThan(0);
    expect(summary.pdr).toBeLessThanOrEqual(100);
  });
  it('usa un escenario por defecto si el id no existe', () => {
    expect(getMockSnapshot('no-existe').scenario.id).toBe('sc-50');
  });
});
