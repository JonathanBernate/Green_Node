import type { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import type { AuthResult, RegisterData, TokenPair, User } from '@/domain/entities/User';
import { authApi } from '@/data/datasources/remote/api/authApi';
import { ApiError } from '@/data/datasources/remote/api/apiClient';
import { mapApiUserToEntity } from '@/data/mappers/UserMapper';
import {
  InvalidCredentialsError,
  EmailAlreadyInUseError,
  WeakPasswordError,
  UserNotFoundError,
} from '@/domain/errors/AuthError';

/**
 * Implementación del repositorio de autenticación.
 *
 * login, getCurrentUser y logout usan la API real (Laravel).
 * register, refreshToken, resetPassword y updateProfile siguen simulados en memoria.
 */
export class AuthRepositoryImpl implements IAuthRepository {
  // Simulación de usuarios en memoria (reemplazar con Firebase)
  private users: Map<string, { user: User; password: string }> = new Map();
  private currentUser: User | null = null;
  private currentTokens: TokenPair | null = null;

  constructor() {
    // Usuario demo pre-cargado
    this.users.set('demo@greennode.co', {
      user: {
        id: 'demo-001',
        name: 'Usuario Demo',
        email: 'demo@greennode.co',
        neighborhood: 'Kennedy',
        points: 150,
        level: 2,
        createdAt: new Date().toISOString(),
      },
      password: '123456',
    });
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await authApi.login(email, password);
      const user = mapApiUserToEntity(response.user);
      // La API solo entrega un token; se usa también como refreshToken.
      const tokens: TokenPair = { accessToken: response.token, refreshToken: response.token };
      this.currentUser = user;
      this.currentTokens = tokens;
      return { user, tokens };
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 422)) {
        throw new InvalidCredentialsError(err);
      }
      throw err;
    }
  }

  async register(data: RegisterData): Promise<AuthResult> {
    await this.delay(1000);

    if (this.users.has(data.email)) {
      throw new EmailAlreadyInUseError();
    }

    if (data.password.length < 6) {
      throw new WeakPasswordError();
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      neighborhood: data.neighborhood,
      points: 0,
      level: 1,
      createdAt: new Date().toISOString(),
    };

    this.users.set(data.email, { user: newUser, password: data.password });

    const tokens = this.generateTokens(newUser.id);
    this.currentUser = newUser;
    this.currentTokens = tokens;

    return { user: newUser, tokens };
  }

  async logout(token?: string): Promise<void> {
    const accessToken = token ?? this.currentTokens?.accessToken;
    try {
      if (accessToken) await authApi.logout(accessToken);
    } catch {
      // Sin red o token vencido: la sesión local se cierra de todos modos.
    } finally {
      this.currentUser = null;
      this.currentTokens = null;
    }
  }

  async refreshToken(_refreshToken: string): Promise<TokenPair> {
    await this.delay(200);
    if (!this.currentUser) {
      throw new InvalidCredentialsError();
    }
    return this.generateTokens(this.currentUser.id);
  }

  async getCurrentUser(token?: string): Promise<User | null> {
    const accessToken = token ?? this.currentTokens?.accessToken;
    if (!accessToken) return this.currentUser;
    const user = mapApiUserToEntity(await authApi.getUser(accessToken));
    this.currentUser = user;
    return user;
  }

  async resetPassword(email: string): Promise<void> {
    await this.delay(600);
    if (!this.users.has(email)) {
      throw new UserNotFoundError();
    }
    // En producción: enviar email de recuperación via Firebase
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    await this.delay(500);
    if (!this.currentUser || this.currentUser.id !== userId) {
      throw new UserNotFoundError();
    }

    this.currentUser = { ...this.currentUser, ...data };
    const stored = this.users.get(this.currentUser.email);
    if (stored) {
      stored.user = this.currentUser;
    }

    return this.currentUser;
  }

  // --- Helpers privados ---

  private generateTokens(userId: string): TokenPair {
    return {
      accessToken: `access_${userId}_${Date.now()}`,
      refreshToken: `refresh_${userId}_${Date.now()}`,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
