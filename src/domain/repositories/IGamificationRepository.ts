import type { GamificationState, LeaderboardEntry } from '../entities/Badge';

export interface IGamificationRepository {
  getState(userId: string): Promise<GamificationState>;
  addPoints(userId: string, points: number, reason: string): Promise<GamificationState>;
  getLeaderboard(neighborhood?: string, limit?: number): Promise<LeaderboardEntry[]>;
  checkBadges(userId: string): Promise<string[]>; // retorna IDs de badges nuevos
}
