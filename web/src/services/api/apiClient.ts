import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { appMetrics } from './appMetrics';

/** Error de API con mensaje apto para el usuario; el detalle técnico va al log. */
export class ApiError extends Error {
  constructor(
    public userMessage: string,
    public status?: number,
    public technical?: unknown,
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }
}

export function toUserMessage(status: number | undefined, serverMessage?: string): string {
  if (status === undefined) return 'No fue posible conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
  if (status === 401 || status === 403) return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
  if (status === 404) return 'El recurso solicitado no está disponible en el servidor.';
  if (status === 422) return serverMessage || 'Los datos enviados no son válidos. Revísalos e inténtalo de nuevo.';
  if (status === 429) return 'Demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.';
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
  return serverMessage || 'No fue posible completar la solicitud.';
}

export const tokenStore = {
  get: () => localStorage.getItem('auth_token'),
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
  timeoutMs?: number;
  auth?: boolean;
}

/** Cliente HTTP único. Mide el tiempo de respuesta (latencia de APLICACIÓN, no de la red IoT). */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, form, timeoutMs = 10000, auth = true } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (auth) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const started = performance.now();
  try {
    const res = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: ctrl.signal,
    });
    const ms = performance.now() - started;
    appMetrics.record(`${method} ${path}`, ms, res.ok);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errors = (data as { errors?: Record<string, string[]> }).errors;
      const first = errors ? Object.values(errors)[0]?.[0] : undefined;
      logger.warn(`API ${res.status} ${method} ${path}`, data);
      throw new ApiError(toUserMessage(res.status, first ?? (data as { message?: string }).message), res.status, data);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    appMetrics.record(`${method} ${path}`, performance.now() - started, false);
    logger.error(`API fallo de red ${method} ${path}`, err);
    throw new ApiError(toUserMessage(undefined), undefined, err);
  } finally {
    clearTimeout(timer);
  }
}
