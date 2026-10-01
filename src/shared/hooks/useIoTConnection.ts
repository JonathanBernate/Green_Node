/**
 * Hook para gestionar la conexión IoT (MQTT).
 * Inicializa el servicio, maneja reconexión y suscribe a datos de contenedores.
 *
 * Uso:
 * - Llamar en un componente de alto nivel (ej: MainTabNavigator)
 * - Automáticamente conecta/desconecta con el ciclo de vida de la app
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { iotService } from '@/data/datasources/remote/mqtt/IoTService';
import { mqttClient, MqttConnectionState } from '@/data/datasources/remote/mqtt/MqttClient';
import { useAuthStore } from '@/presentation/store/authStore';
import { useContainerStore } from '@/presentation/store/containerStore';
import { useIoTStore } from '@/presentation/store/iotStore';
import { logger } from '@/shared/utils/logger';

export function useIoTConnection() {
  const userId = useAuthStore((s) => s.user?.id);
  const updateFillLevel = useContainerStore((s) => s.updateFillLevel);
  const containers = useContainerStore((s) => s.containers);
  const { setConnectionState, setInitialized, addAlert } = useIoTStore();
  const stopSimulationRef = useRef<(() => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Inicializar servicio IoT al autenticarse
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const init = async () => {
      try {
        await iotService.initialize(userId);
        if (!mounted) return;

        setInitialized(true);
        setConnectionState(MqttConnectionState.CONNECTED);

        // Suscribirse a fill level updates
        iotService.onFillLevelUpdate((containerId, level, timestamp) => {
          updateFillLevel(containerId, level, timestamp);
        });

        // Suscribirse a alertas
        iotService.onAlert((alert) => {
          addAlert(alert);
        });

        // Iniciar simulación de datos IoT para desarrollo
        const containerIds = containers.map((c) => c.id);
        stopSimulationRef.current = iotService.startSimulation(containerIds, 15000);

        logger.info('[useIoTConnection] IoT conectado y simulación iniciada');
      } catch (error) {
        if (!mounted) return;
        setConnectionState(MqttConnectionState.DISCONNECTED);
        logger.error('[useIoTConnection] Error inicializando IoT:', error);
      }
    };

    init();

    return () => {
      mounted = false;
      stopSimulationRef.current?.();
      stopSimulationRef.current = null;
    };
  }, [userId]);

  // Manejar app en background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/active/) &&
        nextState.match(/inactive|background/)
      ) {
        // App va a background → pausar simulación
        stopSimulationRef.current?.();
        stopSimulationRef.current = null;
        logger.debug('[useIoTConnection] App en background — simulación pausada');
      }

      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // App vuelve a foreground → reanudar
        const containerIds = containers.map((c) => c.id);
        stopSimulationRef.current = iotService.startSimulation(containerIds, 15000);
        logger.debug('[useIoTConnection] App en foreground — simulación reanudada');
      }

      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [containers]);

  // Monitorear estado de conexión
  useEffect(() => {
    const sub = mqttClient.onConnectionChange((connected) => {
      setConnectionState(
        connected ? MqttConnectionState.CONNECTED : MqttConnectionState.DISCONNECTED,
      );
    });
    return () => sub.unsubscribe();
  }, [setConnectionState]);

  // Función para publicar clasificación
  const publishClassification = useCallback(
    async (result: Parameters<typeof iotService.publishClassification>[0]) => {
      const published = await iotService.publishClassification(result);
      if (published) {
        useIoTStore.getState().recordPublish();
      }
      return published;
    },
    [],
  );

  return {
    publishClassification,
    isConnected: mqttClient.isConnected(),
  };
}
