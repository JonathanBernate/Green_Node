import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Donut, LineChart } from '../metrics/charts';
import { ConnectionBadge } from './ConnectionBadge';
import { DataSourceTag } from './DataSourceTag';

describe('ConnectionBadge', () => {
  it.each([
    ['ONLINE', 'En línea'],
    ['CONNECTING', 'Conectando'],
    ['OFFLINE', 'Sin conexión'],
    ['SIMULATION', 'Simulación'],
    ['ERROR', 'Error'],
  ] as const)('muestra %s', (status, text) => {
    render(<ConnectionBadge status={status} />);
    expect(screen.getByRole('status')).toHaveTextContent(text);
  });
});

describe('DataSourceTag', () => {
  it('etiqueta los datos simulados de forma explícita', () => {
    render(<DataSourceTag source="SIMULATION" />);
    expect(screen.getByText('DATOS DE SIMULACIÓN')).toBeInTheDocument();
  });
  it('distingue datos reales', () => {
    render(<DataSourceTag source="REAL" />);
    expect(screen.getByText('DATOS REALES')).toBeInTheDocument();
  });
});

describe('gráficos', () => {
  it('LineChart expone una descripción accesible con mín y máx', () => {
    render(<LineChart values={[1, 5, 3]} label="Latencia" unit=" ms" />);
    expect(screen.getByRole('img', { name: /Latencia: mín 1 ms, máx 5 ms/ })).toBeInTheDocument();
  });
  it('LineChart avisa si no hay datos suficientes', () => {
    render(<LineChart values={[1]} label="x" />);
    expect(screen.getByText('Sin datos suficientes')).toBeInTheDocument();
  });
  it('Donut muestra la leyenda', () => {
    render(<Donut label="Estados" segments={[{ label: 'A', value: 2, color: 'red' }, { label: 'B', value: 1, color: 'blue' }]} />);
    expect(screen.getByRole('img', { name: 'Estados' })).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
