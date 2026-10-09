import type { IAuthRepository } from '../../repositories/IAuthRepository';

export class LogoutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(token?: string): Promise<void> {
    return this.authRepository.logout(token);
  }
}
