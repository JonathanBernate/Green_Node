import { useEffect, useRef, useState } from 'react';
import { config } from '../config/env';
import { ApiError, containerLocationService } from '../services/api';

export type ReporterStatus = 'starting' | 'active' | 'denied' | 'unsupported' | 'error';

export interface ReporterState {
  status: ReporterStatus;
  lastSentAt: string | null;
  lastPosition: { latitude: number; longitude: number; accuracy: number } | null;
  message: string | null;
}

/**
 * Obtiene la ubicación con la Geolocation API y la envía al webhook cada reportIntervalMs.
 * Se pide una lectura fresca en cada ciclo (maximumAge 0) para que el timestamp avance
 * aunque el contenedor esté quieto; así el backend lo mantiene "en línea".
 */
export function useLocationReporter(containerId: string | undefined): ReporterState {
  const [state, setState] = useState<ReporterState>({ status: 'starting', lastSentAt: null, lastPosition: null, message: null });
  const sending = useRef(false);

  useEffect(() => {
    if (!containerId) return;
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, status: 'unsupported', message: 'Este dispositivo no permite obtener la ubicación.' }));
      return;
    }
    let cancelled = false;

    const tick = () => {
      if (sending.current) return;
      sending.current = true;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          try {
            await containerLocationService.report({
              container_id: containerId,
              latitude,
              longitude,
              accuracy,
              timestamp: new Date(pos.timestamp).toISOString(),
            });
            if (!cancelled) setState({ status: 'active', lastSentAt: new Date().toISOString(), lastPosition: { latitude, longitude, accuracy }, message: null });
          } catch (err) {
            if (!cancelled) {
              setState((s) => ({
                ...s,
                status: 'error',
                lastPosition: { latitude, longitude, accuracy },
                message: err instanceof ApiError ? err.userMessage : 'No se pudo enviar la ubicación.',
              }));
            }
          } finally {
            sending.current = false;
          }
        },
        (err) => {
          sending.current = false;
          if (cancelled) return;
          if (err.code === err.PERMISSION_DENIED) {
            setState((s) => ({ ...s, status: 'denied', message: 'Permiso de ubicación denegado. Actívalo en el navegador para aparecer en el mapa.' }));
          } else {
            setState((s) => ({ ...s, status: 'error', message: 'No se pudo obtener la ubicación del dispositivo.' }));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    };

    tick();
    const timer = setInterval(tick, config.location.reportIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
      sending.current = false;
    };
  }, [containerId]);

  return state;
}
