import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/api';

/** Reportes del usuario. Misma clave de caché en Reportes e Inicio: un envío actualiza ambos. */
export function useReports() {
  return useQuery({ queryKey: ['reports'], queryFn: () => reportService.list() });
}
