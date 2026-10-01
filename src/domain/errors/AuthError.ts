import { AppError } from './AppError';

export class AuthError extends AppError {
  constructor(message: string, code: string, cause?: Error) {
    super(message, code, cause);
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(cause?: Error) {
    super('Correo o contraseña incorrectos', 'AUTH_INVALID_CREDENTIALS', cause);
  }
}

export class EmailAlreadyInUseError extends AuthError {
  constructor(cause?: Error) {
    super('Este correo ya está registrado', 'AUTH_EMAIL_IN_USE', cause);
  }
}

export class WeakPasswordError extends AuthError {
  constructor(cause?: Error) {
    super('La contraseña debe tener al menos 6 caracteres', 'AUTH_WEAK_PASSWORD', cause);
  }
}

export class UserNotFoundError extends AuthError {
  constructor(cause?: Error) {
    super('No se encontró una cuenta con este correo', 'AUTH_USER_NOT_FOUND', cause);
  }
}

export class SessionExpiredError extends AuthError {
  constructor(cause?: Error) {
    super('Tu sesión ha expirado. Inicia sesión de nuevo', 'AUTH_SESSION_EXPIRED', cause);
  }
}
