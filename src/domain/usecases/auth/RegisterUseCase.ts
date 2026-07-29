import type { IAuthRepository } from '../../repositories/IAuthRepository';
import type { AuthResult, RegisterData } from '../../entities/User';

export class RegisterUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(data: RegisterData): Promise<AuthResult> {
    const trimmedData: RegisterData = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      neighborhood: data.neighborhood?.trim(),
    };

    if (!trimmedData.name || trimmedData.name.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }
    if (!trimmedData.email) {
      throw new Error('El correo es obligatorio');
    }
    if (!trimmedData.password || trimmedData.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    return this.authRepository.register(trimmedData);
  }
}
