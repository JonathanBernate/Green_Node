/**
 * Configuración por entorno. Solo variables VITE_* públicas: nunca colocar
 * secretos aquí (se incrustan en el bundle del navegador).
 */
const env = import.meta.env;

export const config = {
  /** URL base del backend REST (Laravel). */
  apiUrl: (env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8000',
  /**
   * true  → los datos de contenedores/red/reportes vienen de src/mocks (SIMULACIÓN).
   * false → se consumen los endpoints del backend (REAL).
   * Por defecto true mientras el backend no exponga esos endpoints.
   */
  useMockData: (env.VITE_USE_MOCK_DATA as string | undefined) !== 'false',
  appVersion: '1.1.0',
  /** Umbrales de estado del contenedor (parámetros de diseño, no resultados). */
  thresholds: { warning: 70, critical: 90, offlineAfterMin: 15 },
  /** Umbrales de alerta de red (parámetros de diseño). */
  alerts: { latencyMs: 500, packetLossPct: 5 },
} as const;
