/**
 * Contenedor simple de inyección de dependencias.
 * Centraliza la creación de repositorios e instancias de casos de uso.
 */
import { AuthRepositoryImpl } from '../repositories/AuthRepositoryImpl';
import { LoginUseCase } from '@/domain/usecases/auth/LoginUseCase';
import { RegisterUseCase } from '@/domain/usecases/auth/RegisterUseCase';
import { LogoutUseCase } from '@/domain/usecases/auth/LogoutUseCase';
import { ResetPasswordUseCase } from '@/domain/usecases/auth/ResetPasswordUseCase';
import type { IAuthRepository } from '@/domain/repositories/IAuthRepository';

// --- Repositorios (singletons) ---
const authRepository: IAuthRepository = new AuthRepositoryImpl();

// --- Casos de uso ---
export const loginUseCase = new LoginUseCase(authRepository);
export const registerUseCase = new RegisterUseCase(authRepository);
export const logoutUseCase = new LogoutUseCase(authRepository);
export const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

// Exportar repositorios para uso directo cuando se necesite
export { authRepository };
