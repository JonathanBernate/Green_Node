<<<<<<< HEAD
import type { User } from '@/domain/entities/User';

export interface IAuthRepository {
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  getCurrentUser(token: string): Promise<User>;
  logout(token: string): Promise<void>;
=======
import type { AuthResult, RegisterData, User, TokenPair } from '../entities/User';

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthResult>;
  register(data: RegisterData): Promise<AuthResult>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  getCurrentUser(): Promise<User | null>;
  resetPassword(email: string): Promise<void>;
  updateProfile(userId: string, data: Partial<User>): Promise<User>;
>>>>>>> feature/fredy
}
