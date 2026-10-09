import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthRepositoryImpl } from '@/data/repositories/AuthRepositoryImpl';
import type { User, TokenPair, RegisterData } from '@/domain/entities/User';
import { loginUseCase, registerUseCase, logoutUseCase, resetPasswordUseCase } from '@/data/di/container';

interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  registerUser: (data: RegisterData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
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
      isLoading: false,
      error: null,

      loginWithCredentials: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await loginUseCase.execute(email, password);
          set({
            user: result.user,
            tokens: result.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      registerUser: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await registerUseCase.execute(data);
          set({
            user: result.user,
            tokens: result.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al registrarse';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await resetPasswordUseCase.execute(email);
          set({ isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al enviar correo de recuperación';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await logoutUseCase.execute(get().tokens?.accessToken);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User) => set({ user }),

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
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
