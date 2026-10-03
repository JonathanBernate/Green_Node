import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModeTabs, modeFromSlug, slugFromMode } from './ModeTabs';
import { Steps } from './Steps';

describe('ModeTabs', () => {
  it('el orden es En vivo, Foto, Galería y marca la pestaña activa', () => {
    render(<ModeTabs mode="camera" onChange={() => undefined} />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent?.match(/En vivo|Foto|Galería/)?.[0])).toEqual(['En vivo', 'Foto', 'Galería']);
    expect(screen.getByRole('tab', { name: /Foto/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('cambia de modo con clic y con las flechas del teclado', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ModeTabs mode="live" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: /Galería/ }));
    expect(onChange).toHaveBeenLastCalledWith('upload');
    screen.getByRole('tab', { name: /En vivo/ }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('camera');
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('live');
  });

  it('el modo se guarda en la URL con nombres legibles', () => {
    expect(slugFromMode('upload')).toBe('galeria');
    expect(modeFromSlug('foto')).toBe('camera');
    expect(modeFromSlug('galeria')).toBe('upload');
    expect(modeFromSlug(null)).toBe('live');
    expect(modeFromSlug('otra-cosa')).toBe('live');
  });
});

describe('Steps', () => {
  it('marca el paso actual y los completados', () => {
    render(<Steps steps={['Capturar', 'Confirmar', 'Resultado']} current={1} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveClass('done');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).not.toHaveClass('done');
  });
});
