/**
 * DATOS DE SIMULACIÓN — modelo sintético de demostración.
 * Estos valores NO son resultados medidos del proyecto: sirven para ver la interfaz
 * hasta que el simulador de telecomunicaciones/backend entregue métricas reales.
 */
import type { NetworkSnapshot, SimulationScenario } from '../types';

export const MOCK_SCENARIOS: SimulationScenario[] = [
  { id: 'sc-10', label: '10 nodos · 1 gateway', nodes: 10, gateways: 1, reportIntervalS: 60, description: 'Escenario pequeño de referencia' },
  { id: 'sc-50', label: '50 nodos · 3 gateways', nodes: 50, gateways: 3, reportIntervalS: 60, description: 'Zona urbana mediana' },
  { id: 'sc-100', label: '100 nodos · 4 gateways', nodes: 100, gateways: 4, reportIntervalS: 60, description: 'Zona urbana densa' },
  { id: 'sc-200', label: '200 nodos · 5 gateways', nodes: 200, gateways: 5, reportIntervalS: 60, description: 'Prueba de escalabilidad' },
];

/** PRNG determinista (mulberry32) para que las gráficas sean reproducibles. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Latencia y PDR sintéticos en función de nodos por gateway (carga). */
function model(nodes: number, gateways: number) {
  const load = nodes / gateways;
  return {
    latencyMs: 120 + load * 3.2,
    pdr: Math.max(80, 99.2 - load * 0.12),
    throughputMsgS: nodes / 60,
  };
}

export function getMockSnapshot(scenarioId: string): NetworkSnapshot {
  const scenario = MOCK_SCENARIOS.find((s) => s.id === scenarioId) ?? MOCK_SCENARIOS[1];
  const base = model(scenario.nodes, scenario.gateways);
  const rand = rng(scenario.nodes * 31 + scenario.gateways);
  const now = Date.now();

  const series = Array.from({ length: 24 }, (_, i) => {
    const jitter = (rand() - 0.5) * 0.18;
    return {
      t: new Date(now - (23 - i) * 5 * 60000).toISOString(),
      latencyMs: base.latencyMs * (1 + jitter),
      pdr: Math.min(100, base.pdr * (1 + jitter / 12)),
      throughputMsgS: base.throughputMsgS * (1 + jitter),
    };
  });

  const perGw = Math.floor(scenario.nodes / scenario.gateways);
  const nodesPerGateway = Array.from({ length: scenario.gateways }, (_, i) => ({
    gatewayId: `gw-${String(i + 1).padStart(2, '0')}`,
    nodes: perGw + (i < scenario.nodes - perGw * scenario.gateways ? 1 : 0),
  }));

  const scalability = MOCK_SCENARIOS.map((s) => {
    const m = model(s.nodes, s.gateways);
    return { nodes: s.nodes, latencyMs: m.latencyMs, pdr: m.pdr };
  });

  return {
    scenario,
    summary: {
      latencyMs: base.latencyMs,
      pdr: base.pdr,
      packetLossPct: 100 - base.pdr,
      throughputMsgS: base.throughputMsgS,
      trafficKbps: (base.throughputMsgS * 220 * 8) / 1000, // payload sintético ≈ 220 B
      nodes: scenario.nodes,
      gateways: scenario.gateways,
      coveragePct: Math.min(99, 88 + scenario.gateways * 2),
    },
    series,
    nodesPerGateway,
    scalability,
  };
}
