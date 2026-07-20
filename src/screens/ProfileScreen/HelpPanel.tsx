"use client";

import { colors } from "@/constants/colors";
import { radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";

// Mirrors homedot-mobile-app's HelpScreen — same support number/email.
const PHONE = "7012303017";
const EMAIL = "mail@homedotapp.com";

/** Web counterpart of homedot-mobile-app's HelpScreen — same headline and
 * phone/email contact cards, using tel:/mailto: links instead of the native
 * dialer/mail-composer intents. */
export default function HelpPanel() {
  return (
    <Reveal style={{ textAlign: "center", padding: "8px 4px" }}>
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
        <Icon name="shield" size={26} />
      </span>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xl, fontWeight: 600, marginBottom: 8 }}>
        How can we help you?
      </h2>
      <p style={{ color: colors.muted, maxWidth: 380, marginInline: "auto", lineHeight: 1.6 }}>
        Having issues with the HomeDot app? Reach out to us — we&apos;re happy to assist you.
      </p>

      <div style={{ height: 1, background: colors.line, margin: "24px 0" }} />

      <p
        style={{
          fontSize: fontSize.xs,
          fontWeight: 700,
          color: colors.muted,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          textAlign: "left",
          marginBottom: 14,
        }}
      >
        Contact us via
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14, marginBottom: 20 }}>
        <a
          href={`tel:${PHONE}`}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            background: colors.bg,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.md,
            padding: "22px 12px",
            color: "inherit",
          }}
        >
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: colors.primarySoft,
              color: colors.primary,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="phone" size={22} />
          </span>
          <span style={{ fontSize: fontSize.base, fontWeight: 700, color: colors.ink }}>Phone</span>
          <span style={{ fontSize: fontSize.xs, color: colors.muted, fontWeight: 500 }}>Tap to call</span>
        </a>

        <a
          href={`mailto:${EMAIL}`}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            background: colors.bg,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.md,
            padding: "22px 12px",
            color: "inherit",
          }}
        >
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: colors.primarySoft,
              color: colors.primary,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="mail" size={22} />
          </span>
          <span style={{ fontSize: fontSize.base, fontWeight: 700, color: colors.ink }}>Email</span>
          <span style={{ fontSize: fontSize.xs, color: colors.muted, fontWeight: 500 }}>Tap to email</span>
        </a>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          background: colors.primarySoft,
          borderRadius: radius.md,
          padding: 14,
          textAlign: "left",
          boxShadow: shadow.sm,
        }}
      >
        <Icon name="clock" size={16} color={colors.primary} />
        <p style={{ fontSize: fontSize.sm - 0.5, color: colors.ink2, lineHeight: 1.6, margin: 0 }}>
          Our support team typically responds within 24 hours on business days.
        </p>
      </div>
    </Reveal>
  );
}
