import type { WasteType } from '../../lib/domain';
import { request } from './apiClient';

/** Estado de la ubicación, calculado por el backend con su propio reloj. */
export type LocationStatus = 'online' | 'stale' | 'none';

export interface ContainerLocation {
  container_id: string;
  name: string;
  address: string | null;
  status: LocationStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  located_at: string | null;
  last_seen_at: string | null;
  age_seconds: number | null;
  classifications_count: number;
}

export interface ContainerLocationList {
  server_time: string;
  online_within_seconds: number;
  data: ContainerLocation[];
}

export interface LocationReport {
  container_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

/**
 * Ubicación de contenedores. Siempre usa el backend real: no existe equivalente simulado,
 * porque la ubicación solo la conoce el contenedor que la reporta.
 */
export const containerLocationService = {
  /** Rol 'contenedor': webhook de ubicación. El backend valida container_id contra el token. */
  report(r: LocationReport) {
    return request<{ updated: boolean }>('/api/webhooks/container-location', { method: 'POST', body: r });
  },

  /** Roles con permiso de consulta: todos los contenedores registrados y su última ubicación. */
  list() {
    return request<ContainerLocationList>('/api/containers/locations');
  },

  /** Rol 'contenedor': registra una clasificación asociada a su propio contenedor. */
  submitClassification(c: { wasteType: WasteType; confidence: number; model?: string; inferenceTimeMs?: number; simulated?: boolean; timestamp: string }) {
    return request<{ id: number }>('/api/container/classifications', {
      method: 'POST',
      body: {
        waste_type: c.wasteType,
        confidence: +c.confidence.toFixed(4),
        model: c.model,
        inference_time_ms: Math.round(c.inferenceTimeMs ?? 0),
        simulated: c.simulated ?? false,
        timestamp: c.timestamp,
      },
    });
  },
};

export type LinkQuality = 'good' | 'fair' | 'poor' | 'lost' | 'none';

export interface ContainerConnection {
  container_id: string;
  name: string;
  status: LocationStatus;
  quality: LinkQuality;
  last_seen_at: string | null;
  age_seconds: number | null;
  device_at: string | null;
  reports_window: number;
  reports_ignored_window: number;
  reports_hour: number;
  /** % de reportes recibidos respecto a los esperados en la ventana. null = muestra insuficiente. */
  delivery_pct: number | null;
  avg_interval_s: number | null;
  jitter_s: number | null;
  /** Estimada: hora de recepción − hora del dispositivo (depende del reloj del dispositivo). */
  latency_last_ms: number | null;
  latency_avg_ms: number | null;
  accuracy_m: number | null;
  latitude: number | null;
  longitude: number | null;
  /** Solo administradores. */
  ip: string | null;
  user_agent: string | null;
  series: { t: string; latency_ms: number | null; accepted: boolean }[];
}

export interface ContainerConnectionList {
  server_time: string;
  expected_interval_seconds: number;
  window_seconds: number;
  data: ContainerConnection[];
}

export const containerConnectionService = {
  list() {
    return request<ContainerConnectionList>('/api/containers/connections');
  },
};
