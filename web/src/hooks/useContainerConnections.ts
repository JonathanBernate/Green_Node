import { useQuery } from '@tanstack/react-query';
import { containerConnectionService } from '../services/api';

const POLL_MS = 3000;

/** Detalle de conexión de cada contenedor, refrescado cada 3 s (solo con la pestaña visible). */
export function useContainerConnections() {
  return useQuery({
    queryKey: ['container-connections'],
    queryFn: () => containerConnectionService.list(),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
