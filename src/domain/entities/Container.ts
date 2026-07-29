import type { GeoPoint } from './GeoPoint';

export enum ContainerStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
  FULL = 'full',
}

export interface Container {
  id: string;
  location: GeoPoint;
  address: string;
  fillLevel: number; // 0-100
  status: ContainerStatus;
  wasteTypes: string[]; // tipos aceptados
  lastUpdated: string;
  capacity: number; // litros
}

export type FillLevelCategory = 'empty' | 'quarter' | 'half' | 'threeQuarters' | 'full';

export const FILL_LEVEL_COLORS: Record<FillLevelCategory, string> = {
  empty: '#4CAF50',
  quarter: '#8BC34A',
  half: '#FFEB3B',
  threeQuarters: '#FF9800',
  full: '#F44336',
};

export function getFillLevelCategory(level: number): FillLevelCategory {
  if (level < 25) return 'empty';
  if (level < 50) return 'quarter';
  if (level < 75) return 'half';
  if (level < 90) return 'threeQuarters';
  return 'full';
}
