"use client";

import Icon from "@/components/Icon";
import Brand from "@/components/Brand";
import { useRoleSwitchStore } from "@/store/useRoleSwitchStore";

/** Full-screen "switching to User / Professional" curtain — ported from
 * HomeDot_Web_UI_Reference's role-switch transition (app.jsx + styles.css).
 * Mounted once in the root layout, reading from useRoleSwitchStore rather
 * than local page state: the curtain has to stay mounted and animating
 * across the actual route change it covers (Profile -> Professional
 * Dashboard and back), which a page-local component would lose the instant
 * that page unmounts mid-navigation. */
export default function RoleSwitchOverlay() {
  const switching = useRoleSwitchStore((s) => s.switching);
  if (!switching) return null;

  const isPro = switching.role === "professional";

  return (
    <div className={`role-switch role-${switching.role} is-${switching.phase}`} aria-hidden="true">
      <span className="rs-panel rs-p1" />
      <span className="rs-panel rs-p2" />
      <div className="rs-content">
        <div className="rs-icon">
          <Icon name={isPro ? "hardhat" : "user"} size={38} strokeWidth={2} />
        </div>
        <div className="rs-brand">
          <Brand light />
        </div>
        <h2>{isPro ? "Professional workspace" : "User mode"}</h2>
        <p>{isPro ? "Manage enquiries, projects & your professional profile." : "Browse homes, hire pros & track your projects."}</p>
        <div className="rs-loader">
          <i />
        </div>
      </div>
    </div>
  );
}
