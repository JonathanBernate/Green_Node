import { ENV } from '@/shared/config/environment';

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, options: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const url = `${this.baseUrl}${path}`;
    console.log(`[API] ${options.method} ${url}`);

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    console.log(`[API] Status: ${response.status}`);
    const data = await response.json();
    console.log(`[API] Response:`, JSON.stringify(data).substring(0, 200));

    if (response.status === 401) {
      throw new ApiError('Sesion expirada', 401);
    }

    if (!response.ok) {
      const errors = (data as Record<string, unknown>)?.errors as Record<string, string[]> | undefined;
      const message =
        ((data as Record<string, unknown>)?.message as string) ||
        errors?.email?.[0] ||
        'Error en la solicitud';
      throw new ApiError(message, response.status);
    }

    return data as T;
  }

  get<T>(path: string, token?: string): Promise<T> {
    return this.request<T>(path, { method: 'GET', token });
  }

  post<T>(path: string, body?: Record<string, unknown>, token?: string): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, token });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient(ENV.apiUrl);
