import type { IAuthRepository } from '../../repositories/IAuthRepository';
import type { AuthResult } from '../../entities/User';

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(email: string, password: string): Promise<AuthResult> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      throw new Error('Email y contraseña son obligatorios');
    }

    return this.authRepository.login(trimmedEmail, password);
  }
}
