import type { IAuthRepository } from '../../repositories/IAuthRepository';

export class ResetPasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(email: string): Promise<void> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      throw new Error('El correo es obligatorio');
    }

    return this.authRepository.resetPassword(trimmedEmail);
  }
}
