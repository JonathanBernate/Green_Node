import { authApi } from '@/data/datasources/remote/api/authApi';
import { mapApiUserToEntity } from '@/data/mappers/UserMapper';
import type { IAuthRepository } from '@/domain/repositories/IAuthRepository';

export class AuthRepositoryImpl implements IAuthRepository {
  async login(email: string, password: string) {
    const response = await authApi.login(email, password);
    return {
      user: mapApiUserToEntity(response.user),
      token: response.token,
    };
  }

  async getCurrentUser(token: string) {
    const response = await authApi.getUser(token);
    return mapApiUserToEntity(response);
  }

  async logout(token: string) {
    await authApi.logout(token);
  }
}
