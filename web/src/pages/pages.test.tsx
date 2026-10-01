import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/utils';
import { ContainersPage } from './Containers/ContainersPage';
import { NetworkPage } from './Network/NetworkPage';
import { ReportsPage } from './Reports/ReportsPage';
import { DashboardPage } from './Dashboard/DashboardPage';

vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('ContainersPage', () => {
  it('lista los nodos virtuales y los marca como simulación', async () => {
    renderWithProviders(<ContainersPage />);
    expect(await screen.findByText('c-001')).toBeInTheDocument();
    expect(screen.getAllByText('Nodo virtual').length).toBeGreaterThan(0);
    expect(screen.getByText('DATOS DE SIMULACIÓN')).toBeInTheDocument();
  });

  it('filtra por estado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContainersPage />);
    await screen.findByText('c-001');
    await user.click(screen.getByRole('button', { name: /Crítico/ }));
    expect(screen.getByText('c-003')).toBeInTheDocument();
    expect(screen.queryByText('c-001')).not.toBeInTheDocument();
  });

  it('abre el detalle como diálogo accesible y cierra con Escape', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContainersPage />);
    await user.click(await screen.findByRole('button', { name: /Ver detalle de c-001/ }));
    expect(screen.getByRole('dialog', { name: 'c-001' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('ReportsPage', () => {
  it('muestra errores de validación comprensibles', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsPage />);
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));
    expect(screen.getByText('Selecciona el tipo de incidencia.')).toBeInTheDocument();
    expect(screen.getByText('Selecciona el contenedor afectado.')).toBeInTheDocument();
    expect(screen.getByText(/al menos 10 caracteres/)).toBeInTheDocument();
  });

  it('registra un reporte válido y lo lista', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsPage />);
    await user.selectOptions(screen.getByLabelText('Tipo de incidencia'), 'full');
    await user.selectOptions(screen.getByLabelText('Contenedor'), 'c-003');
    await user.type(screen.getByLabelText(/Descripción/), 'Está desbordado desde ayer');
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));
    expect(await screen.findByText('Reporte registrado correctamente.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Está desbordado desde ayer')).toBeInTheDocument());
  });
});

describe('NetworkPage', () => {
  it('advierte que las métricas son sintéticas y separa las de la aplicación', async () => {
    renderWithProviders(<NetworkPage />);
    expect(await screen.findByText(/Valores sintéticos de demostración/)).toBeInTheDocument();
    expect(await screen.findByText('Latencia de red')).toBeInTheDocument();
    expect(screen.getByText('Métricas de la aplicación')).toBeInTheDocument();
  });
});

describe('DashboardPage', () => {
  it('muestra el aviso de simulación y KPIs sin números inventados de clasificación', async () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByText(/DATOS DE SIMULACIÓN/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Residuos clasificados').length).toBeGreaterThan(0);
    expect(screen.getByText(/Aún no hay clasificaciones con modelo/)).toBeInTheDocument();
  });
});
