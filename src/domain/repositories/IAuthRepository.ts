import type { User } from '@/domain/entities/User';

export interface IAuthRepository {
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  getCurrentUser(token: string): Promise<User>;
  logout(token: string): Promise<void>;
}
