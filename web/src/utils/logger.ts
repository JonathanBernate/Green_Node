/** Registro técnico. El detalle va a consola; al usuario solo mensajes comprensibles. */
export const logger = {
  info: (...a: unknown[]) => console.info('[GreenNode]', ...a),
  warn: (...a: unknown[]) => console.warn('[GreenNode]', ...a),
  error: (...a: unknown[]) => console.error('[GreenNode]', ...a),
};
