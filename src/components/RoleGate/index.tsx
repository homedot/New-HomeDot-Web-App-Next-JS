"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthToken, getActiveRole } from "@/utils/authStorage";

const PROFESSIONAL_PREFIX = "/professional";

// Plain `pathname.startsWith(PROFESSIONAL_PREFIX)` false-positives on
// "/professionals" — the public browse-professionals listing — since that
// string also starts with "/professional". Require the prefix to end at a
// path segment boundary (or be an exact match) so only /professional and
// /professional/* (the dashboard) count.
function isProfessionalRoute(pathname: string): boolean {
  return pathname === PROFESSIONAL_PREFIX || pathname.startsWith(`${PROFESSIONAL_PREFIX}/`);
}

/** App-wide mode gate — mirrors homedot-mobile-app's root navigator, which
 * mounts either the whole User stack or the whole Professional stack based
 * on `isScreenUserOrProfessional`, never both. There's no such split-tree
 * render on web (every route is reachable by URL), so this enforces the same
 * invariant by redirecting: a signed-in account in Professional mode is
 * bounced to the dashboard from anywhere else in the site, and a User-mode
 * account is bounced out of anything under /professional. Mounted once at
 * the root layout so it runs on every navigation, not just first load. */
export default function RoleGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getAuthToken()) return;
    const onProfessionalRoute = isProfessionalRoute(pathname);
    const role = getActiveRole();
    if (role === "professional" && !onProfessionalRoute) {
      router.replace("/professional/dashboard");
    } else if (role === "user" && onProfessionalRoute) {
      router.replace("/");
    }
  }, [pathname, router]);

  return null;
}
