import { request } from './apiClient';

export type UserRole = 'admin' | 'user' | 'contenedor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  points: number;
  level: number;
  /** Ausente en sesiones guardadas antes de existir roles: se trata como 'user'. */
  role?: UserRole;
  /** Solo para el rol 'contenedor': el contenedor que opera este usuario. */
  container?: { id: string; name: string } | null;
}

export const isContainerUser = (u: Pick<AuthUser, 'role'> | null | undefined) => u?.role === 'contenedor';

/** Autenticación contra el backend Laravel (Sanctum). Endpoints existentes. */
export const authService = {
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    return request('/api/login', { method: 'POST', body: { email, password }, auth: false });
  },
  async logout(): Promise<void> {
    try {
      await request('/api/logout', { method: 'POST' });
    } catch {
      /* la sesión local se cierra de todos modos */
    }
  },
};

export const session = {
  save(user: AuthUser, token: string) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  },
  load(): AuthUser | null {
    try {
      const raw = localStorage.getItem('auth_user');
      return localStorage.getItem('auth_token') && raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  clear() {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  },
};
