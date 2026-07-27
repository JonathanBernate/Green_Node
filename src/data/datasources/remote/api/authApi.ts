import { apiClient } from './apiClient';

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    points: number;
    level: number;
  };
  token: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  points: number;
  level: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/api/login', { email, password }),

  getUser: (token: string) =>
    apiClient.get<UserResponse>('/api/user', token),

  logout: (token: string) =>
    apiClient.post<Record<string, never>>('/api/logout', undefined, token),
};
