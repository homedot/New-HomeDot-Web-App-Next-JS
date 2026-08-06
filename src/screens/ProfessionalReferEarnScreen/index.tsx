"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
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
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import EmptyState from "@/components/EmptyState";
import ProDashboardSidebar from "@/components/ProDashboardSidebar";
import ProDashboardSkeleton from "@/components/ProDashboardSkeleton";
import { getAuthToken } from "@/utils/authStorage";
import ProfileService from "@/services/ProfileService";
import ProfessionalsScreenService, { toInviteUrl } from "@/services/ProfessionalsScreenService";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

// Verbatim the shareable message homedot-mobile-app's InviteaFriendScreen
// passes to Share.share — kept identical so an invite reads the same
// whether it was sent from the app or from here.
const SHARE_QUOTE =
  "Join us on HomeDot — a fantastic app that simplifies house building and household management. Let's create and maintain our dream homes together!";

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: "share", title: "Share your link", body: "Send your personal invite link to homeowners and fellow professionals." },
  { icon: "user", title: "They join HomeDot", body: "Your contact signs up using your link and starts exploring the platform." },
  { icon: "briefcase", title: "You grow your network", body: "Every professional and homeowner you bring in strengthens your reach on HomeDot." },
];

/** Web counterpart of homedot-mobile-app's InviteaFriendScreen, reached from
 * ProDashboardSidebar's "Refer & earn" item. Pulls the real referral link
 * from ProfessionalsScreenService.getInviteLink() (PROFESSIONALS.REFER_A_FRIEND)
 * — the same endpoint mobile's screen calls — rather than inventing one. */
export default function ProfessionalReferEarnScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [link, setLink] = useState<string | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      setLoadingLink(false);
      return;
    }
    setSignedIn(true);
    ProfessionalsScreenService.getInviteLink().then((res) => {
      setLoadingLink(false);
      const raw = res.data?.data?.[0]?.inviteLink;
      if (res.success && res.data?.status && raw) setLink(toInviteUrl(raw));
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const logout = async () => {
    setLoggingOut(true);
    await ProfileService.logout().catch(() => null);
    useAuthStore.getState().clearTokens();
    useProfileStore.getState().clear();
    useProfessionalHomeStore.getState().clear();
    router.push("/");
  };

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setToast("Link copied to clipboard");
    } catch {
      setToast("Couldn't copy the link");
    }
  };

  const shareLink = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join HomeDot", text: SHARE_QUOTE, url: link });
      } catch {
        // user dismissed the native share sheet — nothing to do
      }
    } else {
      copyLink();
    }
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
            <span style={{ color: colors.white }}>Refer &amp; Earn</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4.2vw, 44px)", fontWeight: 600, color: colors.white, letterSpacing: "-0.02em" }}>
            Share HomeDot, grow together
          </h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: fontSize.md, maxWidth: 480 }}>
            Invite homeowners and fellow professionals to discover the easiest way to plan, build and manage a home.
          </p>
        </ProDashboardHero>
      )}

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in to get your referral link"
            subtitle="Your personal HomeDot invite link shows up here once you're signed in."
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
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: radius.lg,
                  padding: "clamp(28px, 4vw, 44px)",
                  background: `linear-gradient(120deg, ${colors.primary} 0%, #1c3155 60%, ${colors.price} 130%)`,
                  boxShadow: shadow.md,
                  textAlign: "center",
                }}
              >
                <span
                  className="pd-map-glow"
                  style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: colors.accent, filter: "blur(70px)", opacity: 0.35 }}
                />
                <span
                  style={{
                    position: "relative",
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.14)",
                    color: colors.white,
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Icon name="share" size={28} />
                </span>
                <h2 style={{ position: "relative", fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 700, color: colors.white, marginBottom: 8 }}>Your referral link</h2>
                <p style={{ position: "relative", color: "rgba(255,255,255,0.78)", fontSize: fontSize.base, maxWidth: 440, margin: "0 auto" }}>
                  Copy it, share it anywhere — every signup through your link is credited to you.
                </p>

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: spacing.xl,
                    maxWidth: 480,
                    marginInline: "auto",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: radius.full,
                    padding: 6,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                      padding: "0 14px",
                      fontSize: fontSize.sm,
                      color: colors.white,
                      fontWeight: 600,
                    }}
                  >
                    {loadingLink ? "Loading your link…" : link || "Your link will appear here"}
                  </span>
                  <button
                    onClick={copyLink}
                    disabled={!link}
                    style={{
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 40,
                      padding: "0 16px",
                      borderRadius: radius.full,
                      background: colors.white,
                      color: colors.primary,
                      fontSize: fontSize.sm,
                      fontWeight: 700,
                    }}
                  >
                    <Icon name="bookmark" size={14} /> Copy
                  </button>
                </div>

                <div style={{ position: "relative", marginTop: spacing.lg }}>
                  <Button variant="light" size="lg" icon={<Icon name="share" size={16} />} onClick={shareLink}>
                    Invite friends
                  </Button>
                </div>
              </Reveal>

              <Reveal style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, padding: "clamp(18px, 2.4vw, 26px)", boxShadow: shadow.sm }}>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    background: colors.bg,
                    borderRadius: radius.md,
                    padding: 16,
                    borderLeft: `4px solid ${colors.primary}`,
                  }}
                >
                  <p style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.65, fontStyle: "italic" }}>&ldquo;{SHARE_QUOTE}&rdquo;</p>
                </div>
              </Reveal>

              <Reveal stagger className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: spacing.lg }}>
                {STEPS.map((s, i) => (
                  <div
                    key={s.title}
                    style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, padding: "clamp(18px, 2.4vw, 24px)", boxShadow: shadow.sm }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 42,
                        height: 42,
                        borderRadius: 13,
                        background: `rgba(${hexToRgb(colors.primary)}, 0.1)`,
                        color: colors.primary,
                        marginBottom: 14,
                      }}
                    >
                      <Icon name={s.icon} size={19} />
                    </span>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Step {i + 1}</p>
                    <h3 style={{ fontSize: fontSize.md, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                    <p style={{ color: colors.muted, fontSize: fontSize.sm, lineHeight: 1.55 }}>{s.body}</p>
                  </div>
                ))}
              </Reveal>
            </main>
          </div>
        )}
      </section>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100,
            background: colors.ink,
            color: colors.white,
            padding: "12px 20px",
            borderRadius: radius.full,
            fontSize: fontSize.sm,
            fontWeight: 600,
            boxShadow: "0 20px 40px -14px rgba(0,0,0,0.35)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
