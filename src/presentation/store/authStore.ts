import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthRepositoryImpl } from '@/data/repositories/AuthRepositoryImpl';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  neighborhood?: string;
  points: number;
  level: number;
}

interface AuthState {
  user: User | null;
  tokens: { accessToken: string; refreshToken: string } | null;
  isAuthenticated: boolean;
  login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  setUser: (user: User) => void;
  fetchUser: () => Promise<void>;
  clearPersistedData: () => Promise<void>;
}

const authRepository = new AuthRepositoryImpl();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      login: (user, tokens) => {
        console.log('[AuthStore] login:', JSON.stringify(user));
        set({ user, tokens, isAuthenticated: true });
      },
      logout: () => set({ user: null, tokens: null, isAuthenticated: false }),
      setUser: (user) => set({ user }),
      fetchUser: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          console.log('[AuthStore] fetchUser: no token');
          return;
        }
        try {
          console.log('[AuthStore] fetchUser: calling API...');
          const user = await authRepository.getCurrentUser(tokens.accessToken);
          console.log('[AuthStore] fetchUser: got user:', JSON.stringify(user));
          set({ user });
        } catch (error) {
          console.log('[AuthStore] fetchUser error:', error);
        }
      },
      clearPersistedData: async () => {
        await AsyncStorage.removeItem('auth-storage');
        set({ user: null, tokens: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
