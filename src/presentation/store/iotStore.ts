import { create } from 'zustand';
import { MqttConnectionState } from '@/data/datasources/remote/mqtt/MqttClient';
import type { SystemAlertMessage } from '@/data/datasources/remote/mqtt/MqttMessageParser';

interface IoTState {
  connectionState: MqttConnectionState;
  isInitialized: boolean;
  lastPublishedAt: string | null;
  publishCount: number;
  alerts: SystemAlertMessage[];

  // Acciones
  setConnectionState: (state: MqttConnectionState) => void;
  setInitialized: (value: boolean) => void;
  recordPublish: () => void;
  addAlert: (alert: SystemAlertMessage) => void;
  clearAlerts: () => void;
}

export const useIoTStore = create<IoTState>()((set) => ({
  connectionState: MqttConnectionState.DISCONNECTED,
  isInitialized: false,
  lastPublishedAt: null,
  publishCount: 0,
  alerts: [],

  setConnectionState: (connectionState) => set({ connectionState }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  recordPublish: () =>
    set((state) => ({
      lastPublishedAt: new Date().toISOString(),
      publishCount: state.publishCount + 1,
    })),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 20), // Max 20 alertas
    })),
  clearAlerts: () => set({ alerts: [] }),
}));
