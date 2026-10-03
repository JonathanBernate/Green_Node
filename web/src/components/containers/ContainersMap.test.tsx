import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import { ContainersMap } from './ContainersMap';

const base = { address: null, accuracy: null, located_at: null, last_seen_at: null, classifications_count: 0 };

describe('ContainersMap', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        server_time: new Date().toISOString(),
        online_within_seconds: 120,
        data: [
          { ...base, container_id: 'cont-001', name: 'Plaza', status: 'online', latitude: 4.7, longitude: -74.07, age_seconds: 5 },
          { ...base, container_id: 'cont-002', name: 'Parque', status: 'stale', latitude: 4.6, longitude: -74.1, age_seconds: 600 },
          { ...base, container_id: 'cont-003', name: 'Sin GPS', status: 'none', latitude: null, longitude: null, age_seconds: null },
        ],
      }),
    })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lista todos los contenedores diferenciando su estado de ubicación', async () => {
    renderWithProviders(<ContainersMap />);
    await waitFor(() => expect(screen.getByText('cont-003')).toBeInTheDocument());
    expect(screen.getAllByText('cont-001').length).toBeGreaterThan(1); // lista + marcador en el mapa
    expect(screen.getAllByText('cont-003')).toHaveLength(1); // sin ubicación: solo en la lista
    expect(screen.getByText('Sin ubicación', { selector: '.loc-state' })).toBeInTheDocument();
    expect(screen.getByText('hace 10 min')).toBeInTheDocument();
  });
});
