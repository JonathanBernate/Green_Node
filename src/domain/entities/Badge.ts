export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt?: string;
  requirement: string;
  category: BadgeCategory;
}

export enum BadgeCategory {
  CLASSIFICATION = 'classification',
  STREAK = 'streak',
  EDUCATION = 'education',
  COMMUNITY = 'community',
  SPECIAL = 'special',
}

export interface GamificationState {
  points: number;
  level: number;
  pointsToNextLevel: number;
  badges: Badge[];
  currentStreak: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatarUrl?: string;
  neighborhood: string;
  points: number;
  level: number;
  rank: number;
}
