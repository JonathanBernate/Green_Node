/**
 * Logger configurable por ambiente.
 * En producción, los logs de debug/info se desactivan.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = __DEV__;

function shouldLog(level: LogLevel): boolean {
  if (isDev) return true;
  return level === 'warn' || level === 'error';
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug('[GreenNode]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) {
      console.info('[GreenNode]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn('[GreenNode]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error('[GreenNode]', ...args);
    }
  },
};
