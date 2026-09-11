"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { colors } from "@/constants/colors";
import { fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";

const CONFETTI_COLORS = [colors.accent, colors.gold, colors.price, "#34D399", "#F472B6"];
const CONFETTI_COUNT = 32;

interface ConfettiPiece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  drift: number;
  size: number;
}

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2.4 + Math.random() * 1.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.round(Math.random() * 360),
    drift: Math.round((Math.random() - 0.5) * 140),
    size: 6 + Math.random() * 6,
  }));
}

/** Full "wow" celebration — confetti burst + a popping verified badge —
 * for the socket "professionalVerification" push (see
 * useProfessionalVerificationSocket / ProfessionalDashboardScreen). Mirrors
 * the intent behind homedot-mobile-app's ProfessionalHomeScreen.js
 * "Congratulation" Lottie modal (badge + confetti animations, same
 * moment), which that screen builds but never actually triggers — this is
 * the working version of that idea. Portaled to document.body per this
 * app's established modal pattern (LoginModal, ContactModal, ...), since a
 * `position: fixed` overlay rendered inline can get trapped by an
 * ancestor's stacking context. */
export default function VerifiedCelebrationModal({
  open,
  onClose,
  title = "You're verified!",
  subtitle = "Your profile is now visible to everyone.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}) {
  // Portal target guard: `document` doesn't exist during SSR, and even on
  // the client the very first render must match the server's markup to
  // avoid a hydration mismatch — so this flips true only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-detection guard for the portal target (document.body), which doesn't exist during SSR
    setMounted(true);
  }, []);

  // Re-rolled fresh each time the modal opens, not just once ever — a
  // professional could in principle see this more than once (re-verified
  // after an edit, say), and a stale confetti layout would look frozen.
  const confetti = useMemo(() => (open ? makeConfetti() : []), [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="pv-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: colors.overlay,
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        overflow: "hidden",
      }}
    >
      <div className="pv-confetti-layer" aria-hidden="true">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="pv-confetti"
            style={
              {
                left: `${c.left}%`,
                width: c.size,
                height: c.size * 1.6,
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                "--pv-rotate": `${c.rotate}deg`,
                "--pv-drift": `${c.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div
        className="pv-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          background: colors.card,
          borderRadius: 28,
          padding: "48px 32px 32px",
          textAlign: "center",
          boxShadow: "0 50px 100px -30px rgba(10,20,34,0.55)",
        }}
      >
        <span className="pv-ring" aria-hidden="true" />
        <span className="pv-badge">
          <Icon name="verified" size={44} color={colors.white} />
          <span className="pv-sparkle pv-sparkle-a" aria-hidden="true">
            <Icon name="sparkle" size={16} color={colors.gold} />
          </span>
          <span className="pv-sparkle pv-sparkle-b" aria-hidden="true">
            <Icon name="sparkle" size={12} color={colors.accent} />
          </span>
        </span>

        <h2
          style={{
            marginTop: 26,
            fontFamily: "var(--font-display)",
            fontSize: 26,
            letterSpacing: "-0.02em",
            color: colors.ink,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            marginTop: 10,
            fontSize: fontSize.base,
            color: colors.muted,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </p>

        <div style={{ marginTop: 28 }}>
          <Button variant="primary" size="lg" full onClick={onClose}>
            Awesome!
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
