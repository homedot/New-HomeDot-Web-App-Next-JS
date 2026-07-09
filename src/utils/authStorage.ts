const TOKEN_KEY = "hd_token";
const REFRESH_TOKEN_KEY = "hd_refresh_token";

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

// Global token storage — set once on login/OTP verify, read by ApiService
// on every request so any screen's API calls are authenticated automatically.
export function setAuthTokens({ token, refreshToken }: AuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
