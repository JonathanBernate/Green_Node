import { AppError } from './AppError';

export class NetworkError extends AppError {
  constructor(message: string, code: string, cause?: Error) {
    super(message, code, cause);
  }
}

export class OfflineError extends NetworkError {
  constructor(cause?: Error) {
    super('Sin conexión a internet. Los datos se guardarán localmente', 'NETWORK_OFFLINE', cause);
  }
}

export class TimeoutError extends NetworkError {
  constructor(operation: string, cause?: Error) {
    super(
      `La operación "${operation}" tardó demasiado`,
      'NETWORK_TIMEOUT',
      cause,
    );
  }
}
