import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../lib/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  selectedStoreId: string | null;
  selectedStoreName: string | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  selectStore: (storeId: string, storeName: string) => void;
  clearStore: () => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      selectedStoreId: null,
      selectedStoreName: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          selectedStoreId: user.role === 'vendedor' ? user.storeId : null,
          selectedStoreName: user.role === 'vendedor' ? user.storeName : null,
        }),

      selectStore: (storeId, storeName) =>
        set({ selectedStoreId: storeId, selectedStoreName: storeName }),

      clearStore: () =>
        set({ selectedStoreId: null, selectedStoreName: null }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          selectedStoreId: null,
          selectedStoreName: null,
          isAuthenticated: false,
        }),

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: 'malote-lab-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        selectedStoreId: state.selectedStoreId,
        selectedStoreName: state.selectedStoreName,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
