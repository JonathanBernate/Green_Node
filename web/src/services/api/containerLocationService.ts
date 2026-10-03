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
