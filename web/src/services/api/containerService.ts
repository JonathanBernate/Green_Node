import { config } from '../../config/env';
import type { Container } from '../../lib/domain';
import { getInitialContainers, getMockGateways } from '../../mocks/containers';
import type { Gateway, Sourced, Telemetry } from '../../types';
import { request } from './apiClient';

const wrap = <T>(data: T, source: Sourced<T>['source']): Sourced<T> => ({
  data,
  source,
  receivedAt: new Date().toISOString(),
});

export const containerService = {
  async list(): Promise<Sourced<Container[]>> {
    if (config.useMockData) return wrap(getInitialContainers(), 'SIMULATION');
    return wrap(await request<Container[]>('/api/containers'), 'REAL');
  },

  async gateways(): Promise<Sourced<Gateway[]>> {
    if (config.useMockData) return wrap(getMockGateways(), 'SIMULATION');
    return wrap(await request<Gateway[]>('/api/gateways'), 'REAL');
  },
};

export const telemetryService = {
  /** Serie de llenado de un contenedor. En simulación se reconstruye hacia atrás desde el nivel actual. */
  async series(containerId: string, current: number, points = 24): Promise<Sourced<Telemetry[]>> {
    if (config.useMockData) {
      const now = Date.now();
      const data = Array.from({ length: points }, (_, i) => {
        const back = points - 1 - i;
        const level = Math.max(0, Math.min(100, current - back * 1.4 + Math.sin(i * 1.7) * 2));
        return { containerId, fillLevel: Math.round(level), timestamp: new Date(now - back * 15 * 60000).toISOString() };
      });
      return wrap(data, 'SIMULATION');
    }
    return wrap(await request<Telemetry[]>(`/api/telemetry?container=${encodeURIComponent(containerId)}`), 'REAL');
  },
};
