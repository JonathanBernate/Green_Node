import type { Container, WasteType } from '../lib/domain';

export type { Container, WasteType };

/** Origen de un dato mostrado en la interfaz. Nunca mezclar. */
export type DataSource = 'REAL' | 'SIMULATION' | 'ESTIMATED' | 'REFERENCE';

export interface Sourced<T> {
  data: T;
  source: DataSource;
  receivedAt: string;
}

export type ConnectionStatus = 'ONLINE' | 'CONNECTING' | 'OFFLINE' | 'SIMULATION' | 'ERROR';

/** Estado operativo derivado del nivel de llenado y la última comunicación. */
export type ContainerHealth = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface Telemetry {
  containerId: string;
  fillLevel: number;
  temperature?: number;
  batteryLevel?: number;
  timestamp: string;
}

export interface Gateway {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Radio de cobertura de diseño en metros (parámetro, no medición). */
  coverageRadiusM: number;
  nodeIds: string[];
}

export interface Classification {
  class: string;
  confidence: number;
  model?: string;
  inferenceTimeMs?: number;
}

export interface WasteEvent {
  event_type: 'waste_classification';
  event_id: string;
  user_id: string;
  classification: string;
  confidence: number;
  model?: string;
  inference_time_ms?: number;
  timestamp: string;
  location?: { lat: number; lng: number };
  source: DataSource;
}

export type EventDelivery = 'pending' | 'sent' | 'stored-local';

export interface StoredEvent {
  event: WasteEvent;
  delivery: EventDelivery;
}

export type AlertType =
  | 'container_critical'
  | 'node_offline'
  | 'high_packet_loss'
  | 'high_latency'
  | 'comm_problem'
  | 'anomaly';

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  containerId?: string;
  timestamp: string;
  source: DataSource;
}

export type ReportType = 'full' | 'damaged' | 'litter' | 'access' | 'anomaly' | 'other';

export interface Report {
  id: string;
  type: ReportType;
  description: string;
  container_id: string;
  timestamp: string;
  location?: string;
  source: DataSource;
}

export interface SimulationScenario {
  id: string;
  label: string;
  nodes: number;
  gateways: number;
  reportIntervalS: number;
  description: string;
}

export interface NetworkPoint {
  t: string;
  latencyMs: number;
  pdr: number;
  throughputMsgS: number;
}

export interface NetworkMetric {
  latencyMs: number;
  pdr: number;
  packetLossPct: number;
  throughputMsgS: number;
  trafficKbps: number;
  nodes: number;
  gateways: number;
  coveragePct: number;
}

export interface NetworkSnapshot {
  scenario: SimulationScenario;
  summary: NetworkMetric;
  series: NetworkPoint[];
  nodesPerGateway: { gatewayId: string; nodes: number }[];
  scalability: { nodes: number; latencyMs: number; pdr: number }[];
}
