import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, toUserMessage } from './apiClient';
import { appMetrics } from './appMetrics';

afterEach(() => {
  vi.restoreAllMocks();
  appMetrics.clear();
});

describe('toUserMessage', () => {
  it('no expone detalles técnicos', () => {
    const msgs = [undefined, 401, 404, 422, 429, 500, 503].map((s) => toUserMessage(s));
    for (const m of msgs) expect(m).not.toMatch(/Error|axios|fetch|TypeError/i);
    expect(toUserMessage(undefined)).toBe('No fue posible conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.');
  });
  it('usa el mensaje de validación del servidor en 422', () => {
    expect(toUserMessage(422, 'Correo inválido')).toBe('Correo inválido');
  });
});

describe('request', () => {
  it('traduce un fallo de red a ApiError con mensaje comprensible', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(request('/api/x')).rejects.toMatchObject({
      name: 'ApiError',
      userMessage: expect.stringContaining('No fue posible conectar'),
    });
    expect(appMetrics.summary().errors).toBe(1);
  });

  it('mapea errores HTTP y registra el tiempo de respuesta', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: 'x' }), { status: 500 }));
    const err = (await request('/api/y').catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
    expect(appMetrics.all()).toHaveLength(1);
    expect(appMetrics.all()[0].ok).toBe(false);
  });

  it('devuelve los datos y mide la latencia en éxito', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    await expect(request('/api/z')).resolves.toEqual({ ok: 1 });
    expect(appMetrics.summary('GET').count).toBe(1);
    expect(appMetrics.summary('GET').avgMs).not.toBeNull();
  });

  it('envía el token si existe', async () => {
    localStorage.setItem('auth_token', 'abc');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await request('/api/z');
    expect((spy.mock.calls[0][1]!.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });
});
