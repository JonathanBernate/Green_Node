import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import { HistoryTab } from './HistoryTab';

const row = (id: number, waste_type: string, source = 'ai') => ({
  id, waste_type, confidence: 0.9, user_confirmed: false, source, created_at: new Date().toISOString(),
});

describe('HistoryTab', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [row(1, 'plastic'), row(2, 'glass'), row(3, 'organic'), row(4, 'special')],
    })));
  });

  it('agrupa lo clasificado en las tres canecas', async () => {
    renderWithProviders(<HistoryTab />);
    expect(await screen.findByText('4 residuos clasificados')).toBeInTheDocument();
    const counts = (name: string) => screen.getByText(name, { selector: '.bin-name' }).closest('.bin-card')!.querySelector('.bin-count')!.textContent;
    expect(counts('Caneca blanca')).toBe('2'); // plástico + vidrio
    expect(counts('Caneca verde')).toBe('1'); // orgánico
    expect(counts('Caneca negra')).toBe('1'); // especial
  });

  it('filtra por caneca y expande el detalle con el consejo de depósito', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    renderWithProviders(<HistoryTab />);
    await screen.findByText('4 residuos clasificados');
    await userEvent.click(screen.getByRole('button', { name: /Caneca verde/, pressed: false }));
    expect(screen.getByText('Mostrando 1 de 4')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Orgánico/ , expanded: false }));
    expect(screen.getByText(/Caneca verde: orgánicos aprovechables/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }));
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
  });
});

describe('HistoryTab · borrar', () => {
  it('pide confirmación y vacía el historial', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url.replace(/^.*\/api/, '/api')}`);
      return { ok: true, status: 200, json: async () => (init?.method === 'DELETE' ? { deleted: 1 } : [row(1, 'plastic')]) };
    }));
    const { default: userEvent } = await import('@testing-library/user-event');
    renderWithProviders(<HistoryTab />);
    await userEvent.click(await screen.findByRole('button', { name: 'Borrar historial' }));
    await userEvent.click(screen.getByRole('button', { name: 'Borrar todo' }));
    expect(await screen.findByText('Aún no tienes clasificaciones.')).toBeInTheDocument();
    expect(calls).toContain('DELETE /api/classifications');
  });
});
