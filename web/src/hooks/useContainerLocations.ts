import { useQuery } from '@tanstack/react-query';
import { config } from '../config/env';
import { containerLocationService } from '../services/api';

/** Polling cada pollIntervalMs: suficiente para un reporte cada 15 s y sin infraestructura extra. */
export function useContainerLocations() {
  return useQuery({
    queryKey: ['container-locations'],
    queryFn: () => containerLocationService.list(),
    refetchInterval: config.location.pollIntervalMs,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
