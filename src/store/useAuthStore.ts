import { create } from "zustand";
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  setAuthTokens,
  type AuthTokens,
} from "@/utils/authStorage";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setTokens: (tokens: AuthTokens) => void;
  clearTokens: () => void;
}

// Reactive mirror of the token pair persisted in localStorage (utils/authStorage).
// ApiService still reads localStorage directly for request headers, since that
// needs to work outside React — this store exists so components can subscribe
// to auth state and re-render on login/logout instead of polling localStorage.
export const useAuthStore = create<AuthState>((set) => ({
  token: getAuthToken(),
  refreshToken: getRefreshToken(),
  setTokens: ({ token, refreshToken }) => {
    setAuthTokens({ token, refreshToken });
    set({ token, refreshToken });
  },
  clearTokens: () => {
    clearAuthTokens();
    set({ token: null, refreshToken: null });
  },
}));
