import { create } from "zustand";

export type RoleSwitchRole = "user" | "professional";
export type RoleSwitchPhase = "in" | "out";

export interface RoleSwitchState {
  role: RoleSwitchRole;
  phase: RoleSwitchPhase;
}

interface RoleSwitchStore {
  switching: RoleSwitchState | null;
  // `action` does the real work (API call, token/role updates, router.push)
  // and resolves true/false for success — the curtain covers the screen
  // while it runs, including the route change it triggers, so nothing
  // half-loaded is ever visible mid-switch. Returns what `action` returned.
  runSwitch: (role: RoleSwitchRole, action: () => Promise<boolean>) => Promise<boolean>;
}

// Time for the two panels to fully cover the screen — matches the CSS
// .is-in rsUp animation's own duration + stagger delay (0.5s + 0.08s).
const COVER_MS = 600;
// Total time the curtain stays up (measured from t=0, NOT added on top of
// however long `action` took) before it starts lifting on success — a beat
// to read "Professional workspace" / "User mode". This is a *target*, not a
// fixed delay: if `action` (a real API call) already took longer than this,
// the remaining wait is 0 and the curtain lifts right away, so slow network
// doesn't stack extra time on top of whatever the request itself already
// cost — it only ever eats into this budget, never adds to it. Paired with
// OUT_MS below, total curtain time on success is ~3s.
const TARGET_VISIBLE_MS = 2450;
// Same idea on failure, but short — there's no new screen to reveal, just an
// error to read on the same page, so no reason to hold the curtain for a
// branding beat.
const TARGET_VISIBLE_FAIL_MS = 450;
// Panels lifting away — matches .is-out rsOut (0.45s + up to 0.05s stagger).
const OUT_MS = 550;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useRoleSwitchStore = create<RoleSwitchStore>((set, get) => ({
  switching: null,

  runSwitch: async (role, action) => {
    if (prefersReducedMotion()) {
      return action();
    }
    const start = Date.now();
    set({ switching: { role, phase: "in" } });
    const [, success] = await Promise.all([wait(COVER_MS), action()]);
    const target = success ? TARGET_VISIBLE_MS : TARGET_VISIBLE_FAIL_MS;
    const remaining = Math.max(0, target - (Date.now() - start));
    await wait(remaining);
    const current = get().switching;
    if (current) set({ switching: { ...current, phase: "out" } });
    await wait(OUT_MS);
    set({ switching: null });
    return success;
  },
}));
