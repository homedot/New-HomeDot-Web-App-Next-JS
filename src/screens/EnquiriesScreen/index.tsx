"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import { getAuthToken } from "@/utils/authStorage";
import EnquiriesPanel from "./EnquiriesPanel";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

/** Standalone "My Enquiries" screen — same top-level pattern as
 * ProjectsScreen/MyPropertyScreen (hero banner, signed-out gate, own route),
 * rather than living inline as a Profile tab. EnquiriesPanel does the actual
 * listing/list-management work; this just supplies the page chrome. */
export default function EnquiriesScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      return;
    }
    setSignedIn(true);
  }, []);

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <LoginModal ref={loginModalRef} hideTrigger />

      <section style={{ ...wrap, paddingTop: spacing.xl }}>
        <Reveal
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: radius.lg,
            padding: "clamp(28px, 5vw, 44px)",
            background: `linear-gradient(120deg, ${colors.primary} 0%, #1c3155 60%, ${colors.price} 130%)`,
            boxShadow: shadow.md,
            marginBottom: spacing.xl,
          }}
        >
          <span
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: colors.accent,
              filter: "blur(70px)",
              opacity: 0.35,
            }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: "rgba(255,255,255,0.75)" }}>
            <span>Home</span>
            <Icon name="arrow" size={13} />
            <span style={{ color: colors.white }}>My Enquiries</span>
          </div>
          <h1
            style={{
              position: "relative",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.4vw, 38px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: colors.white,
              marginTop: spacing.sm,
            }}
          >
            My Enquiries
          </h1>
          <p style={{ position: "relative", color: "rgba(255,255,255,0.82)", fontSize: fontSize.base, marginTop: 6 }}>
            Track every enquiry you&apos;ve sent to a HomeDot professional, and their responses.
          </p>
        </Reveal>
      </section>

      <section style={{ ...wrap, paddingBottom: spacing.huge }}>
        {signedIn === false && (
          <EmptyState
            title="Sign in to see your enquiries"
            subtitle="Enquiries you send to professionals, and their responses, show up here once you're signed in."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
                Log in
              </Button>
            }
          />
        )}

        {signedIn && <EnquiriesPanel />}

        {signedIn && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: spacing.xxl }}>
            <button
              onClick={() => router.push("/professionals")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: fontSize.sm,
                fontWeight: 600,
                color: colors.primary,
              }}
            >
              <Icon name="search" size={15} /> Browse professionals to send a new enquiry
            </button>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function EmptyState({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "70px 20px",
        border: `1px dashed ${colors.line}`,
        borderRadius: radius.lg,
        background: colors.card,
      }}
    >
      <span
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: colors.primarySoft,
          color: colors.primary,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 18px",
        }}
      >
        <Icon name="mail" size={28} />
      </span>
      <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: colors.muted, marginBottom: spacing.lg, maxWidth: 420, marginInline: "auto" }}>{subtitle}</p>
      {action}
    </div>
  );
}
