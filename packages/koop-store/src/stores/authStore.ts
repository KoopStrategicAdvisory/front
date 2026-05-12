import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KoopUser } from '@repo/types';

interface AuthState {
  user: KoopUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: KoopUser, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'koop.auth' },
  ),
);
