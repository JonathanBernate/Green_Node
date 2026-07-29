import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
          await logoutUseCase.execute();
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
