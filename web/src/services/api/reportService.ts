import { config } from '../../config/env';
import type { Report, ReportType } from '../../types';
import { request } from './apiClient';

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  full: 'Contenedor lleno',
  damaged: 'Contenedor dañado',
  litter: 'Residuos alrededor',
  access: 'Problema de acceso',
  anomaly: 'Anomalía',
  other: 'Otro',
};

export const REPORT_TYPE_ICONS: Record<ReportType, string> = {
  full: '🗑️',
  damaged: '🔧',
  litter: '🚯',
  access: '🚧',
  anomaly: '⚡',
  other: '💬',
};

export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  full: '#E5484D',
  damaged: '#F5A524',
  litter: '#8B5CF6',
  access: '#1D6FD1',
  anomaly: '#0E8A3E',
  other: '#64748B',
};

export interface ReportInput {
  type: ReportType | '';
  description: string;
  container_id: string;
  location?: string;
}

export type ReportErrors = Partial<Record<'type' | 'description' | 'container_id', string>>;

/** Validación del lado del cliente (el servidor sigue siendo la autoridad). */
export function validateReport(input: ReportInput): ReportErrors {
  const errors: ReportErrors = {};
  if (!input.type) errors.type = 'Selecciona el tipo de incidencia.';
  if (!input.container_id) errors.container_id = 'Selecciona el contenedor afectado.';
  const d = input.description.trim();
  if (d.length < 10) errors.description = 'Describe la incidencia con al menos 10 caracteres.';
  else if (d.length > 500) errors.description = 'La descripción no puede superar 500 caracteres.';
  return errors;
}

/** Limpia caracteres de control y espacios repetidos antes de enviar. */
export function sanitizeText(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** En simulación los reportes viven en el navegador, separados por usuario. */
function storageKey(): string {
  try {
    const u = JSON.parse(localStorage.getItem('auth_user') ?? 'null') as { id?: string } | null;
    return `greennode.reports.${u?.id ?? 'anon'}`;
  } catch {
    return 'greennode.reports.anon';
  }
}

function readLocal(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) ?? '[]') as Report[];
  } catch {
    return [];
  }
}

export const reportService = {
  async list(): Promise<Report[]> {
    if (config.useMockData) return readLocal();
    return request<Report[]>('/api/reports');
  },

  async create(input: ReportInput): Promise<Report> {
    const errors = validateReport(input);
    if (Object.keys(errors).length) throw new Error('validation');
    const payload = {
      type: input.type as ReportType,
      description: sanitizeText(input.description),
      container_id: input.container_id,
      timestamp: new Date().toISOString(),
      location: input.location ? sanitizeText(input.location) : undefined,
    };
    if (config.useMockData) {
      const report: Report = { ...payload, id: `r_${Date.now()}`, source: 'SIMULATION' };
      localStorage.setItem(storageKey(), JSON.stringify([report, ...readLocal()].slice(0, 100)));
      return report;
    }
    return request<Report>('/api/reports', { method: 'POST', body: payload });
  },
};
