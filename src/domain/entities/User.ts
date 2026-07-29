export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  neighborhood?: string;
  points: number;
  level: number;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  neighborhood?: string;
}

export interface AuthResult {
  user: User;
  tokens: TokenPair;
}
