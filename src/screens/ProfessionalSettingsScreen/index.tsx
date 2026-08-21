"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import AmbientBackground from "@/components/AmbientBackground";
import ProDashboardHero from "@/components/ProDashboardHero";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import EmptyState from "@/components/EmptyState";
import ProDashboardSidebar from "@/components/ProDashboardSidebar";
import ProDashboardSkeleton from "@/components/ProDashboardSkeleton";
import { getAuthToken, setActiveRole } from "@/utils/authStorage";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";
import { useRoleSwitchStore } from "@/store/useRoleSwitchStore";
import ProfileService from "@/services/ProfileService";
import SwitchProfessionalService from "@/services/SwitchProfessionalService";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

/** Web counterpart of homedot-mobile-app's SettingsScreen, reached from
 * ProDashboardSidebar's "Settings" item. Account fields are read-only
 * summaries linking into Profile's real edit form rather than duplicating
 * it; "Switch to Home Owner" and "Log out" reuse the exact same actions
 * ProfessionalDashboardScreen already wires up. */
export default function ProfessionalSettingsScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      return;
    }
    setSignedIn(true);
    useProfileStore.getState().fetch();
    useProfessionalHomeStore.getState().refresh();
  }, []);

  const switchToUser = async () => {
    setSwitchingRole(true);
    setRoleError(null);
    await useRoleSwitchStore.getState().runSwitch("user", async () => {
      const res = await SwitchProfessionalService.switchRole();
      if (!res.success || res.data?.status === false) {
        setRoleError(res.data?.message || res.message || "Couldn't switch modes. Please try again.");
        return false;
      }
      const pair = res.data?.data?.[0];
      if (pair) useAuthStore.getState().setTokens({ token: pair.token, refreshToken: pair.reToken });
      setActiveRole("user");
      router.push("/");
      return true;
    });
    setSwitchingRole(false);
  };

  const logout = async () => {
    setLoggingOut(true);
    await ProfileService.logout().catch(() => null);
    useAuthStore.getState().clearTokens();
    useProfileStore.getState().clear();
    useProfessionalHomeStore.getState().clear();
    router.push("/");
  };

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <LoginModal ref={loginModalRef} hideTrigger />

      {signedIn && (
        <ProDashboardHero minHeight="clamp(220px, 22vw, 280px)">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: "rgba(255,255,255,0.75)" }}>
            <span>Dashboard</span>
            <Icon name="arrow" size={13} />
            <span style={{ color: colors.white }}>Settings</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4.2vw, 44px)", fontWeight: 600, color: colors.white, letterSpacing: "-0.02em" }}>Settings</h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: fontSize.md, maxWidth: 480 }}>Manage your account and legal preferences.</p>
        </ProDashboardHero>
      )}

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in to manage settings"
            subtitle="Account, notification and legal settings show up here once you're signed in."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
                Log in
              </Button>
            }
          />
        ) : signedIn === null ? (
          <ProDashboardSkeleton />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[264px_1fr]" style={{ gap: spacing.xl, alignItems: "start" }}>
            <ProDashboardSidebar onLogout={logout} loggingOut={loggingOut} />

            <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: spacing.xl }}>
              {/* Account mode */}
              <SettingsCard title="Account mode">
                <SettingRow
                  icon="house"
                  label="Switch to Home Owner"
                  sub="Move back to the homeowner side of your account"
                  onClick={switchToUser}
                  action={<Icon name="arrow" size={15} color={colors.muted} />}
                  disabled={switchingRole}
                />
                {roleError && <p style={{ color: "#C0392B", fontSize: fontSize.xs, padding: "0 10px 10px" }}>{roleError}</p>}
              </SettingsCard>

              {/* Legal */}
              <SettingsCard title="Legal">
                <SettingLinkRow icon="shield" label="Privacy Policy" href="/privacy" />
                <SettingLinkRow icon="book" label="Terms & Conditions" href="/termsandconditions" />
              </SettingsCard>

              {/* Danger zone */}
              <SettingsCard title="Account actions">
                <SettingRow
                  icon="logout"
                  label={loggingOut ? "Logging out…" : "Log out"}
                  onClick={logout}
                  disabled={loggingOut}
                  action={<Icon name="arrow" size={15} color={colors.muted} />}
                />
              </SettingsCard>
            </main>
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, padding: "10px 8px", boxShadow: shadow.sm }}>
      <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, padding: "8px 12px 6px" }}>
        {title}
      </span>
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
    </Reveal>
  );
}

function SettingRow({
  icon,
  label,
  sub,
  value,
  action,
  onClick,
  disabled,
  danger,
}: {
  icon: IconName;
  label: string;
  sub?: string;
  value?: string;
  action?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 10px",
        borderRadius: 12,
        width: "100%",
        textAlign: "left",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ width: 36, height: 36, borderRadius: 11, background: colors.bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={16} color={danger ? "#C0392B" : colors.primary} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: fontSize.sm, fontWeight: 600, color: danger ? "#C0392B" : colors.ink }}>{label}</span>
        {sub && <span style={{ display: "block", fontSize: fontSize.xs, color: colors.muted, marginTop: 1 }}>{sub}</span>}
      </span>
      {value !== undefined && (
        <span style={{ fontSize: fontSize.sm, color: colors.muted, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
      )}
      {action}
    </Tag>
  );
}

// In-app PrivacyPolicyScreen/TermsScreen — RoleGate exempts these two
// routes from the professional-mode confinement (see its EXEMPT_ROUTES) so
// this Link isn't bounced back to the dashboard before the page renders.
function SettingLinkRow({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return (
    <Link href={href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 10px", borderRadius: 12, color: colors.ink }}>
      <span style={{ width: 36, height: 36, borderRadius: 11, background: colors.bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={16} color={colors.primary} />
      </span>
      <span style={{ flex: 1, fontSize: fontSize.sm, fontWeight: 600 }}>{label}</span>
      <Icon name="arrow" size={15} color={colors.muted} />
    </Link>
  );
}

