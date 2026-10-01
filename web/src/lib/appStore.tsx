/**
 * Store global ligero basado en React Context.
 * Mantiene contenedores, historial de clasificaciones y estado IoT/MQTT,
 * y conecta el simulador IoT al montar.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Container,
  ContainerStatus,
  ClassificationResult,
  ClassificationFeedback,
  WasteType,
  getInitialContainers,
} from './domain';
import { iotSimulator, MqttConnectionState, SystemAlert, NetworkMetrics } from './iotSimulator';
import { mqttWebClient } from './mqttClient';

interface AppState {
  containers: Container[];
  history: ClassificationResult[];
  addClassification: (r: ClassificationResult) => void;
  setClassificationFeedback: (
    id: string,
    feedback: ClassificationFeedback,
    autoConfirmed?: boolean,
    correctedType?: WasteType | null,
  ) => void;
  connectionState: MqttConnectionState;
  publishCount: number;
  lastPublishedAt: string | null;
  alerts: SystemAlert[];
  /** Últimas métricas de red recibidas (null si aún no hay datos). */
  metrics: NetworkMetrics | null;
  /** true si la web está usando el broker MQTT real; false si usa el simulador. */
  usingRealBroker: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [containers, setContainers] = useState<Container[]>(() => getInitialContainers());
  const [history, setHistory] = useState<ClassificationResult[]>([]);
  const [connectionState, setConnectionState] = useState<MqttConnectionState>(
    MqttConnectionState.DISCONNECTED,
  );
  const [publishCount, setPublishCount] = useState(0);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [usingRealBroker, setUsingRealBroker] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Tipo común de ambas fuentes (mqttWebClient e iotSimulator exponen la misma interfaz).
    type Source = typeof iotSimulator;

    let disposed = false;
    const unsubscribers: Array<() => void> = [];
    // Fuente activa: se decide tras el intento de conexión al broker real.
    let activeSource: Source | null = null;

    /** Registra los listeners del store sobre la fuente indicada. */
    const attachListeners = (source: Source) => {
      unsubscribers.push(source.onConnection(setConnectionState));
      unsubscribers.push(
        source.onFill((id, fillLevel, status) => {
          setContainers((prev) =>
            prev.map((c) =>
              c.id === id
                ? { ...c, fillLevel, status: status as ContainerStatus, lastUpdated: new Date().toISOString() }
                : c,
            ),
          );
        }),
      );
      unsubscribers.push(source.onAlert((a) => setAlerts((prev) => [a, ...prev].slice(0, 20))));
      unsubscribers.push(
        source.onPublish((count, at) => {
          setPublishCount(count);
          setLastPublishedAt(at);
        }),
      );
      unsubscribers.push(source.onMetrics((m) => setMetrics(m)));
    };

    /** Intenta el broker real y cae al simulador si no conecta en ~4s. */
    const boot = async () => {
      const initialContainers = getInitialContainers();

      // 1. Intentar conectar al broker real.
      mqttWebClient.connect(initialContainers);

      // 2. Esperar hasta ~4s a que el estado pase a CONNECTED.
      const deadline = Date.now() + 4000;
      while (
        !disposed &&
        mqttWebClient.getState() !== MqttConnectionState.CONNECTED &&
        Date.now() < deadline
      ) {
        await new Promise((r) => setTimeout(r, 200));
      }

      if (disposed) return;

      if (mqttWebClient.getState() === MqttConnectionState.CONNECTED) {
        // Broker real disponible.
        activeSource = mqttWebClient as unknown as Source;
        setUsingRealBroker(true);
        attachListeners(activeSource);
      } else {
        // Broker apagado: caer al simulador interno.
        mqttWebClient.disconnect();
        activeSource = iotSimulator;
        setUsingRealBroker(false);
        attachListeners(activeSource);
        iotSimulator.connect(initialContainers);
      }
    };

    void boot();

    return () => {
      disposed = true;
      unsubscribers.forEach((off) => off());
      unsubscribers.length = 0;
      activeSource?.disconnect();
    };
  }, []);

  const addClassification = (r: ClassificationResult) => {
    setHistory((prev) => [r, ...prev]);
  };

  const setClassificationFeedback = (
    id: string,
    feedback: ClassificationFeedback,
    autoConfirmed = false,
    correctedType: WasteType | null = null,
  ) => {
    setHistory((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, feedback, autoConfirmed, correctedType } : r,
      ),
    );
    console.info(
      `[GreenNode] [Feedback] ${id} → ${feedback}${autoConfirmed ? ' (auto)' : ''}` +
        (correctedType ? ` · tipo real: ${correctedType}` : ''),
    );
  };

  return (
    <AppContext.Provider
      value={{
        containers,
        history,
        addClassification,
        setClassificationFeedback,
        connectionState,
        publishCount,
        lastPublishedAt,
        alerts,
        metrics,
        usingRealBroker,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore debe usarse dentro de AppStoreProvider');
  return ctx;
}
