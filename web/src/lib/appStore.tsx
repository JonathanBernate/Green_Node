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
import { iotSimulator, MqttConnectionState, SystemAlert } from './iotSimulator';

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
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const offConn = iotSimulator.onConnection(setConnectionState);
    const offFill = iotSimulator.onFill((id, fillLevel, status) => {
      setContainers((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, fillLevel, status: status as ContainerStatus, lastUpdated: new Date().toISOString() }
            : c,
        ),
      );
    });
    const offAlert = iotSimulator.onAlert((a) =>
      setAlerts((prev) => [a, ...prev].slice(0, 20)),
    );
    const offPub = iotSimulator.onPublish((count, at) => {
      setPublishCount(count);
      setLastPublishedAt(at);
    });

    iotSimulator.connect(getInitialContainers());

    return () => {
      offConn();
      offFill();
      offAlert();
      offPub();
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
