import { useQuery } from '@tanstack/react-query';
import { useMemo, useSyncExternalStore } from 'react';
import { config } from '../config/env';
import { useAppStore } from '../lib/appStore';
import { appMetrics, containerService, networkService, request } from '../services/api';
import type { Alert, ConnectionStatus, DataSource } from '../types';
import { deriveAlerts } from '../utils/alerts';

const REFRESH_MS = 10000;

/** Contenedores. Simulación: estado vivo del store (alimentado por el simulador). Real: API. */
export function useContainers() {
  const store = useAppStore();
  const q = useQuery({
    queryKey: ['containers'],
    queryFn: () => containerService.list(),
    enabled: !config.useMockData,
    refetchInterval: REFRESH_MS,
  });
  if (config.useMockData) {
    return { containers: store.containers, source: 'SIMULATION' as DataSource, loading: false, error: null as string | null };
  }
  return {
    containers: q.data?.data ?? [],
    source: (q.data?.source ?? 'REAL') as DataSource,
    loading: q.isLoading,
    error: q.isError ? 'No fue posible cargar los contenedores.' : null,
  };
}

export function useGateways() {
  return useQuery({ queryKey: ['gateways'], queryFn: () => containerService.gateways(), refetchInterval: config.useMockData ? false : REFRESH_MS });
}

export function useScenarios() {
  return useQuery({ queryKey: ['scenarios'], queryFn: () => networkService.scenarios() });
}

export function useNetworkSnapshot(scenarioId: string) {
  return useQuery({
    queryKey: ['network', scenarioId],
    queryFn: () => networkService.snapshot(scenarioId),
    refetchInterval: config.useMockData ? false : REFRESH_MS,
  });
}

/** Estado global de conexión. En modo simulación siempre es SIMULATION. */
export function useConnectionStatus(): ConnectionStatus {
  const q = useQuery({
    queryKey: ['health'],
    queryFn: () => request('/up', { auth: false, timeoutMs: 5000 }),
    enabled: !config.useMockData,
    refetchInterval: 15000,
    retry: false,
  });
  if (config.useMockData) return 'SIMULATION';
  if (q.isLoading) return 'CONNECTING';
  if (q.isError) return 'OFFLINE';
  return 'ONLINE';
}

/** Alertas del simulador + derivadas de contenedores y métricas de red. */
export function useAlerts(): Alert[] {
  const { alerts: simAlerts } = useAppStore();
  const { containers, source } = useContainers();
  const { data: net } = useNetworkSnapshot('sc-50');
  return useMemo(() => {
    const derived = deriveAlerts(containers, net?.data, source);
    const fromSim: Alert[] = simAlerts.map((a) => ({
      id: a.id,
      type: 'container_critical',
      severity: a.level,
      message: a.message,
      containerId: a.containerId,
      timestamp: a.timestamp,
      source: 'SIMULATION',
    }));
    // evita duplicar la alerta crítica del mismo contenedor
    const seen = new Set(derived.map((d) => d.containerId));
    return [...derived, ...fromSim.filter((a) => !seen.has(a.containerId))].sort(
      (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
    );
  }, [containers, net, simAlerts, source]);
}

/** Métricas de la APLICACIÓN medidas en este navegador. */
export function useAppMetrics() {
  useSyncExternalStore(appMetrics.subscribe.bind(appMetrics), () => appMetrics.all());
  return appMetrics;
}
