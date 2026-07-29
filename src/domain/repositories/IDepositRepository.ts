import type { Deposit, DepositStats, DepositFilter } from '../entities/Deposit';
import type { WasteType } from '../entities/WasteClassification';

export interface IDepositRepository {
  register(deposit: Omit<Deposit, 'id' | 'pointsEarned'>): Promise<Deposit>;
  getHistory(filter?: DepositFilter): Promise<Deposit[]>;
  getById(id: string): Promise<Deposit | null>;
  getStats(userId: string): Promise<DepositStats>;
  correctDeposit(depositId: string, correctType: WasteType): Promise<void>;
}
