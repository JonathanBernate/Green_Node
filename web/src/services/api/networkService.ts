import { config } from '../../config/env';
import { getMockSnapshot, MOCK_SCENARIOS } from '../../mocks/network';
import type { NetworkSnapshot, SimulationScenario, Sourced } from '../../types';
import { request } from './apiClient';

export const networkService = {
  async scenarios(): Promise<Sourced<SimulationScenario[]>> {
    if (config.useMockData) return { data: MOCK_SCENARIOS, source: 'SIMULATION', receivedAt: new Date().toISOString() };
    return { data: await request<SimulationScenario[]>('/api/network/scenarios'), source: 'REAL', receivedAt: new Date().toISOString() };
  },

  /**
   * Métricas de la red IoT (cobertura, latencia, PDR, tráfico…).
   * Con datos simulados el origen es SIMULATION; con backend, el que informe el servidor.
   */
  async snapshot(scenarioId: string): Promise<Sourced<NetworkSnapshot>> {
    if (config.useMockData) {
      return { data: getMockSnapshot(scenarioId), source: 'SIMULATION', receivedAt: new Date().toISOString() };
    }
    const res = await request<{ source?: Sourced<unknown>['source']; data: NetworkSnapshot }>(
      `/api/network/metrics?scenario=${encodeURIComponent(scenarioId)}`,
    );
    return { data: res.data, source: res.source ?? 'SIMULATION', receivedAt: new Date().toISOString() };
  },
};
