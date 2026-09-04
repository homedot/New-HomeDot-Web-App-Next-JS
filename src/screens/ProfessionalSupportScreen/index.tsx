"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import AmbientBackground from "@/components/AmbientBackground";
import ProDashboardHero from "@/components/ProDashboardHero";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import EmptyState from "@/components/EmptyState";
import ProDashboardSidebar from "@/components/ProDashboardSidebar";
import ProDashboardSkeleton from "@/components/ProDashboardSkeleton";
import { getAuthToken } from "@/utils/authStorage";
import ProfileService from "@/services/ProfileService";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

// Mirrors homedot-mobile-app's HelpScreen — same two contact channels, same
// hardcoded phone/email (there's no support-ticket API on either side).
const SUPPORT_PHONE = "7012303017";
const SUPPORT_EMAIL = "mail@homedotapp.com";

/** Web counterpart of homedot-mobile-app's HelpScreen — reachable from
 * ProDashboardSidebar's "Support" item. No backend beyond tel:/mailto: links
 * (mobile's Help screen doesn't call an API either), plus quick links into
 * the Privacy/Terms pages so a professional never has to hunt for them. */
export default function ProfessionalSupportScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
    setSignedIn(!!getAuthToken());
  }, []);

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
            <span style={{ color: colors.white }}>Support</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4.2vw, 44px)", fontWeight: 600, color: colors.white, letterSpacing: "-0.02em" }}>
            Help &amp; Support
          </h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: fontSize.md, maxWidth: 480 }}>
            Having issues with HomeDot? Reach out to us — we&apos;re happy to assist you.
          </p>
        </ProDashboardHero>
      )}

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in for support"
            subtitle="Sign in to reach the HomeDot support team as a professional."
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
              <Reveal
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.lg,
                  padding: "clamp(28px, 4vw, 44px)",
                  boxShadow: shadow.sm,
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: colors.primarySoft,
                    color: colors.primary,
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 18px",
                  }}
                >
                  <Icon name="chat" size={30} />
                </span>
                <h2 style={{ fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 700, marginBottom: 8 }}>How can we help you?</h2>
                <p style={{ color: colors.muted, fontSize: fontSize.base, maxWidth: 440, margin: "0 auto" }}>
                  Having issues with the HomeDot app? Reach out to us — we&apos;re happy to assist you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: spacing.lg, marginTop: spacing.xxl, maxWidth: 460, marginInline: "auto" }}>
                  <ContactCard icon="phone" label="Phone" sub="Tap to call" href={`tel:${SUPPORT_PHONE}`} />
                  <ContactCard icon="mail" label="Email" sub="Tap to email" href={`mailto:${SUPPORT_EMAIL}`} />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    background: `rgba(${hexToRgb(colors.accent)}, 0.08)`,
                    borderRadius: radius.md,
                    padding: 14,
                    marginTop: spacing.xl,
                    maxWidth: 460,
                    marginInline: "auto",
                    textAlign: "left",
                  }}
                >
                  <Icon name="clock" size={16} color={colors.accent} />
                  <p style={{ color: colors.ink2, fontSize: fontSize.sm, lineHeight: 1.5 }}>Our support team typically responds within 24 hours on business days.</p>
                </div>
              </Reveal>

              <Reveal style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, padding: "clamp(18px, 2.4vw, 26px)", boxShadow: shadow.sm }}>
                <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>
                  Legal
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <LegalRow icon="shield" label="Privacy Policy" href="/privacy" />
                  <LegalRow icon="book" label="Terms & Conditions" href="/termsandconditions" />
                </div>
              </Reveal>
            </main>
          </div>
        )}
      </section>

      <SiteFooter variant="professional" />
    </div>
  );
}

function ContactCard({ icon, label, sub, href }: { icon: IconName; label: string; sub: string; href: string }) {
  return (
    <a
      href={href}
      className="pdash-navitem"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "22px 16px",
        borderRadius: radius.md,
        background: colors.bg,
        border: `1px solid ${colors.line}`,
      }}
    >
      <span style={{ width: 48, height: 48, borderRadius: 14, background: colors.primarySoft, color: colors.primary, display: "grid", placeItems: "center", marginBottom: 8 }}>
        <Icon name={icon} size={20} />
      </span>
      <span style={{ fontSize: fontSize.sm, fontWeight: 700, color: colors.ink }}>{label}</span>
      <span style={{ fontSize: fontSize.xs, color: colors.muted }}>{sub}</span>
    </a>
  );
}

// In-app PrivacyPolicyScreen/TermsScreen — RoleGate exempts these two
// routes from the professional-mode confinement (see its EXEMPT_ROUTES) so
// this Link isn't bounced back to the dashboard before the page renders.
function LegalRow({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 10px",
        borderRadius: 12,
        color: colors.ink2,
        fontSize: fontSize.sm,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 34, height: 34, borderRadius: 10, background: colors.bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={16} color={colors.primary} />
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <Icon name="arrow" size={14} color={colors.muted} />
    </Link>
  );
}
