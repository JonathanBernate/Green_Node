/**
 * Parser de mensajes MQTT.
 * Convierte payloads JSON de la red IoT en objetos tipados.
 */

import { WasteType } from '@/domain/entities/WasteClassification';
import { ContainerStatus } from '@/domain/entities/Container';
import { logger } from '@/shared/utils/logger';

// --- Tipos de mensaje ---

export interface ClassificationMessage {
  userId: string;
  wasteType: WasteType;
  confidence: number;
  timestamp: string;
  location?: { latitude: number; longitude: number };
  imageHash?: string;
}

export interface FillLevelMessage {
  containerId: string;
  fillLevel: number; // 0-100
  temperature?: number;
  batteryLevel?: number;
  timestamp: string;
}

export interface ContainerStatusMessage {
  containerId: string;
  status: ContainerStatus;
  reason?: string;
  timestamp: string;
}

export interface SystemAlertMessage {
  alertId: string;
  type: 'overflow' | 'maintenance' | 'anomaly' | 'battery_low';
  containerId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

// --- Parsers ---

export function parseClassificationMessage(payload: string): ClassificationMessage | null {
  try {
    const data = JSON.parse(payload);
    if (!data.wasteType || !data.userId) return null;
    return {
      userId: data.userId,
      wasteType: data.wasteType as WasteType,
      confidence: data.confidence ?? 0,
      timestamp: data.timestamp ?? new Date().toISOString(),
      location: data.location,
      imageHash: data.imageHash,
    };
  } catch (err) {
    logger.warn('[MQTT Parser] Error parsing classification message:', err);
    return null;
  }
}

export function parseFillLevelMessage(payload: string): FillLevelMessage | null {
  try {
    const data = JSON.parse(payload);
    if (data.fillLevel === undefined || !data.containerId) return null;
    return {
      containerId: data.containerId,
      fillLevel: Math.max(0, Math.min(100, data.fillLevel)),
      temperature: data.temperature,
      batteryLevel: data.batteryLevel,
      timestamp: data.timestamp ?? new Date().toISOString(),
    };
  } catch (err) {
    logger.warn('[MQTT Parser] Error parsing fill level message:', err);
    return null;
  }
}

export function parseContainerStatusMessage(payload: string): ContainerStatusMessage | null {
  try {
    const data = JSON.parse(payload);
    if (!data.containerId || !data.status) return null;
    return {
      containerId: data.containerId,
      status: data.status as ContainerStatus,
      reason: data.reason,
      timestamp: data.timestamp ?? new Date().toISOString(),
    };
  } catch (err) {
    logger.warn('[MQTT Parser] Error parsing container status:', err);
    return null;
  }
}

export function parseSystemAlertMessage(payload: string): SystemAlertMessage | null {
  try {
    const data = JSON.parse(payload);
    if (!data.alertId || !data.type) return null;
    return {
      alertId: data.alertId,
      type: data.type,
      containerId: data.containerId,
      message: data.message ?? '',
      severity: data.severity ?? 'low',
      timestamp: data.timestamp ?? new Date().toISOString(),
    };
  } catch (err) {
    logger.warn('[MQTT Parser] Error parsing system alert:', err);
    return null;
  }
}

// --- Serializers (para publicar) ---

export function serializeClassificationMessage(msg: ClassificationMessage): string {
  return JSON.stringify(msg);
}

export function serializeFillLevelMessage(msg: FillLevelMessage): string {
  return JSON.stringify(msg);
}
