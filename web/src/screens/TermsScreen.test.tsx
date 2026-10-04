import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { TERMS_SECTIONS } from '../content/terms';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { groupParagraphs, TermsScreen } from './TermsScreen';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('TermsScreen', () => {
  it('muestra todas las secciones numeradas y un índice que las enlaza', () => {
    render(<TermsScreen onBack={() => undefined} />);
    expect(screen.getByRole('dialog', { name: 'Términos y condiciones' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(TERMS_SECTIONS.length);
    const toc = screen.getByRole('navigation', { name: 'Contenido' });
    expect(toc.querySelectorAll('a')).toHaveLength(TERMS_SECTIONS.length);
  });

  it('cubre los temas clave del servicio', () => {
    render(<TermsScreen onBack={() => undefined} />);
    for (const t of [/inteligencia artificial/i, /Datos personales/, /Ubicación/, /Ley 1581/, /Resolución 2184/]) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    }
  });

  it('desplaza a la sección al pulsar el índice', async () => {
    const user = userEvent.setup();
    render(<TermsScreen onBack={() => undefined} />);
    await user.click(screen.getByRole('link', { name: 'Uso aceptable' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('se cierra con "Cerrar" y con "Entendido"', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<TermsScreen onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    await user.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(onBack).toHaveBeenCalledTimes(2);
  });
});

describe('groupParagraphs', () => {
  it('agrupa los puntos consecutivos en una lista', () => {
    expect(groupParagraphs(['Intro', '• a', '• b', 'Cierre'])).toEqual([
      { list: false, items: ['Intro'] },
      { list: true, items: ['a', 'b'] },
      { list: false, items: ['Cierre'] },
    ]);
  });
});

describe('enlaces a los términos', () => {
  it('el login tiene una sección de términos y condiciones', async () => {
    const onTerms = vi.fn();
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} onTerms={onTerms} />);
    expect(screen.getByText(/Al continuar aceptas los/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Términos y condiciones' }));
    expect(onTerms).toHaveBeenCalled();
  });

  it('el registro también los enlaza', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ container_code_required: false }) })));
    const onTerms = vi.fn();
    const user = userEvent.setup();
    render(<RegisterScreen onRegistered={vi.fn()} onLogin={vi.fn()} onTerms={onTerms} />);
    await user.click(screen.getByRole('button', { name: 'Términos y condiciones' }));
    expect(onTerms).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
