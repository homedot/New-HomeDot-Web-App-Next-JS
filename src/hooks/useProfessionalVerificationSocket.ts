"use client";

import { useSocketEvent } from "./useSocketEvent";

// Mirrors what homedot-mobile-app's ProfessionalHomeScreen.js reads off the
// payload (varification?.professionalInfo?.token / .refreshToken) — a fresh
// token pair reflecting the now-verified account, issued the moment an
// admin approves it.
export interface ProfessionalVerificationPush {
  professionalInfo?: {
    token?: string;
    refreshToken?: string;
  };
}

/** Subscribes to the live "professionalVerification" event — pushed once,
 * the moment an admin approves this professional's verification while
 * they're active in the app. Mirrors ProfessionalHomeScreen.js's
 * `socket.on("professionalVerification", ...)`: the previous token pair
 * doesn't yet reflect the account's new verified status (it was issued
 * before approval), so the payload carries a fresh pair to swap in without
 * forcing a re-login, right before mobile re-fetches the professional's own
 * details and enquiry list with it.
 *
 * `userId` — see useNotificationSocket's comment; same
 * `professionalInfo[0].userId` sourcing applies here, not `profile._id`.
 * Unlike ProDashboardSidebar's notification bell (mounted on every
 * /professional/* screen), mobile only ever wires this listener on the Home
 * screen — ProfessionalHomeScreen.js — so this is meant to be used the same
 * way: from ProfessionalDashboardScreen only, not globally. */
export function useProfessionalVerificationSocket(
  userId: string | undefined,
  onVerified: (payload: ProfessionalVerificationPush) => void,
) {
  useSocketEvent<ProfessionalVerificationPush>(
    userId,
    "professionalVerification",
    onVerified,
  );
}
