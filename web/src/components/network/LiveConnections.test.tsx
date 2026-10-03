import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import { describeDevice, LiveConnections } from './LiveConnections';

const base = { name: 'Plaza', last_seen_at: new Date().toISOString(), device_at: null, reports_ignored_window: 0, reports_hour: 40, avg_interval_s: 15, jitter_s: 0.4, latency_avg_ms: 120, accuracy_m: 12, latitude: 4.7, longitude: -74.07, ip: '10.0.0.5', user_agent: 'Mozilla/5.0 (iPhone) Safari/605', series: [] };

describe('LiveConnections', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        server_time: new Date().toISOString(),
        expected_interval_seconds: 15,
        window_seconds: 300,
        data: [
          { ...base, container_id: 'CONT-001', status: 'online', quality: 'good', age_seconds: 4, reports_window: 20, delivery_pct: 100, latency_last_ms: 130 },
          { ...base, container_id: 'CONT-002', status: 'none', quality: 'none', age_seconds: null, last_seen_at: null, reports_window: 0, delivery_pct: null, latency_last_ms: null, ip: null, user_agent: null },
        ],
      }),
    })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('muestra el detalle de los contenedores en línea y separa los que no tienen señal', async () => {
    renderWithProviders(<LiveConnections />);
    await waitFor(() => expect(screen.getByLabelText('Conexión de CONT-001')).toBeInTheDocument());
    expect(screen.getByText('Enlace estable')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('iOS · Safari')).toBeInTheDocument();
    expect(screen.queryByLabelText('Conexión de CONT-002')).not.toBeInTheDocument();
    expect(screen.getByText('Sin señal (1)')).toBeInTheDocument();
  });

  it('describe el dispositivo a partir del user-agent', () => {
    expect(describeDevice('Mozilla/5.0 (Linux; Android 14) Chrome/120 Safari/537')).toBe('Android · Chrome');
    expect(describeDevice(null)).toBe('—');
  });
});
