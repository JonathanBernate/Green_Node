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
  /** Foto de perfil como data URI; null/ausente = iniciales. */
  avatar?: string | null;
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

/** Perfil del usuario autenticado (siempre contra el backend: el login también lo es). */
export const profileService = {
  updateName(name: string): Promise<AuthUser> {
    return request('/api/user', { method: 'PATCH', body: { name } });
  },
  uploadAvatar(dataUri: string): Promise<AuthUser> {
    return request('/api/user/avatar', { method: 'PUT', body: { avatar: dataUri }, timeoutMs: 20000 });
  },
  removeAvatar(): Promise<AuthUser> {
    return request('/api/user/avatar', { method: 'DELETE' });
  },
  async changePassword(input: { current: string; next: string; confirm: string }): Promise<void> {
    await request('/api/user/password', {
      method: 'PUT',
      body: { current_password: input.current, password: input.next, password_confirmation: input.confirm },
    });
  },
};

export interface AuthSession {
  id: number;
  device: string;
  created_at: string | null;
  last_used_at: string | null;
  current: boolean;
}

export const sessionService = {
  list(): Promise<AuthSession[]> {
    return request('/api/user/sessions');
  },
  async revoke(id: number): Promise<void> {
    await request(`/api/user/sessions/${id}`, { method: 'DELETE' });
  },
  async revokeOthers(): Promise<void> {
    await request('/api/user/sessions', { method: 'DELETE' });
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
