/**
 * Store global ligero basado en React Context.
 * Mantiene contenedores, historial de clasificaciones y estado IoT/MQTT,
 * y conecta el simulador IoT al montar.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../app/AuthProvider';
import { historyService, isContainerUser } from '../services/api';
import {
  Container,
  ContainerStatus,
  ClassificationResult,
  ClassificationFeedback,
  WasteType,
} from './domain';
import { getInitialContainers } from '../mocks/containers';
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
  /** Borra una clasificación (servidor y local). Devuelve false si el servidor no pudo borrarla. */
  removeClassification: (id: string) => Promise<boolean>;
  /** Borra todo el historial del usuario (servidor y local). Devuelve false si falló. */
  clearHistory: () => Promise<boolean>;
  connectionState: MqttConnectionState;
  publishCount: number;
  lastPublishedAt: string | null;
  alerts: SystemAlert[];
}

const AppContext = createContext<AppState | null>(null);

/** Caché local del historial, separada por usuario (la fuente de verdad es el servidor). */
const historyKey = (userId: string | undefined) => `greennode.history.${userId ?? 'anon'}`;

function loadHistory(userId: string | undefined): ClassificationResult[] {
  try {
    return JSON.parse(localStorage.getItem(historyKey(userId)) ?? '[]') as ClassificationResult[];
  } catch {
    return [];
  }
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [containers, setContainers] = useState<Container[]>(() => getInitialContainers());
  const { user } = useAuth();
  const userId = user?.id;
  // El rol 'contenedor' guarda sus clasificaciones asociadas al contenedor, no en el historial personal.
  const canSync = !!user && !isContainerUser(user);
  const [history, setHistory] = useState<ClassificationResult[]>(() => loadHistory(userId));
  const historyRef = useRef(history);
  historyRef.current = history;
  const pendingSaves = useRef(new Map<string, Promise<number | null>>());
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

  // Persistencia local del historial (últimos 200) por usuario
  useEffect(() => {
    try {
      localStorage.setItem(historyKey(userId), JSON.stringify(history.slice(0, 200)));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [history, userId]);

  // Al entrar: sube lo que quedó pendiente (p. ej. guardado sin conexión) y trae el historial del servidor
  useEffect(() => {
    if (!canSync) return;
    let cancelled = false;
    (async () => {
      try {
        for (const r of historyRef.current.filter((x) => !x.serverId && !x.simulated)) {
          try {
            r.serverId = await historyService.save(r);
          } catch {
            /* se reintenta en la próxima carga */
          }
        }
        const remote = await historyService.list();
        if (cancelled) return;
        // Se conservan solo las que no viven en el servidor (simuladas o aún sin subir)
        const localOnly = historyRef.current.filter((r) => r.simulated || !r.serverId);
        setHistory([...localOnly, ...remote].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)));
      } catch {
        /* sin conexión: se muestra la caché local */
      }
    })();
    return () => { cancelled = true; };
  }, [canSync, userId]);

  const addClassification = (r: ClassificationResult) => {
    setHistory((prev) => [r, ...prev]);
    if (!canSync || r.simulated) return; // los resultados aleatorios de demostración no se guardan en el servidor
    pendingSaves.current.set(
      r.id,
      historyService
        .save(r)
        .then((serverId) => {
          setHistory((prev) => prev.map((x) => (x.id === r.id ? { ...x, serverId } : x)));
          return serverId;
        })
        .catch(() => null),
    );
  };

  // Primero el servidor: si falla no se borra en local, o reaparecería en la próxima sincronización.
  const removeClassification = async (id: string): Promise<boolean> => {
    const serverId = (await pendingSaves.current.get(id)) ?? historyRef.current.find((r) => r.id === id)?.serverId;
    if (canSync && serverId) {
      try {
        await historyService.remove(serverId);
      } catch {
        return false;
      }
    }
    setHistory((prev) => prev.filter((r) => r.id !== id));
    return true;
  };

  const clearHistory = async (): Promise<boolean> => {
    if (canSync) {
      try {
        await Promise.all(pendingSaves.current.values());
        await historyService.clear();
      } catch {
        return false;
      }
    }
    pendingSaves.current.clear();
    setHistory([]);
    return true;
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
    if (canSync && feedback) {
      void (async () => {
        const serverId = (await pendingSaves.current.get(id)) ?? historyRef.current.find((r) => r.id === id)?.serverId;
        if (serverId) await historyService.setFeedback(serverId, feedback, correctedType).catch(() => undefined);
      })();
    }
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
        removeClassification,
        clearHistory,
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
