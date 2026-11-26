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
  localStorage.removeItem(ACTIVE_ROLE_KEY);
  localStorage.removeItem(HAS_PROFESSIONAL_ROLE_KEY);
}

export type AccountRole = "user" | "professional";

const ACTIVE_ROLE_KEY = "hd_active_role";

// Mirrors homedot-mobile-app's `isScreenUserOrProfessional` (StorageServices
// setScreenUserOrProfessional) — a client-only flag for which role a session
// with both roles is currently browsing as. The backend has no concept of a
// "current" role beyond which token you're holding (SWITCH_ROLE just hands
// back a differently-scoped token pair), so this is tracked locally, same as
// mobile.
export function getActiveRole(): AccountRole {
  if (typeof window === "undefined") return "user";
  return localStorage.getItem(ACTIVE_ROLE_KEY) === "professional" ? "professional" : "user";
}

export function setActiveRole(role: AccountRole): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_ROLE_KEY, role);
}

const HAS_PROFESSIONAL_ROLE_KEY = "hd_has_professional_role";

// The /profile endpoint's userType array can come back scoped to just the
// role the current token was issued for, so "this account also has a
// professional profile" isn't safe to re-derive from the latest fetch
// alone — once any fetch this login has shown userType.length >= 2, this
// sticks for the rest of the login (through role switches) instead of
// flipping back to "Become a Professional". Cleared on logout above.
export function getHasProfessionalRole(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HAS_PROFESSIONAL_ROLE_KEY) === "1";
}

export function setHasProfessionalRole(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HAS_PROFESSIONAL_ROLE_KEY, "1");
}
