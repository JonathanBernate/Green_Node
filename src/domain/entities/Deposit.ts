import type { WasteType } from './WasteClassification';
import type { GeoPoint } from './GeoPoint';

export interface Deposit {
  id: string;
  userId: string;
  containerId: string;
  wasteType: WasteType;
  confidence: number;
  imageUri?: string;
  location: GeoPoint;
  timestamp: string;
  pointsEarned: number;
  corrected: boolean;
  correctedType?: WasteType;
}

export interface DepositStats {
  totalDeposits: number;
  totalPoints: number;
  byWasteType: Record<WasteType, number>;
  currentStreak: number;
  bestStreak: number;
  averageConfidence: number;
}

export interface DepositFilter {
  wasteType?: WasteType;
  dateFrom?: string;
  dateTo?: string;
  containerId?: string;
}
