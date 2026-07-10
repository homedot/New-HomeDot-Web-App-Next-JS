"use client";

import type { CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

export default function PropertyAddScreen() {
  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <section style={{ ...wrap, padding: `${spacing.huge}px ${spacing.xl}px` }}>
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.lg,
            padding: "clamp(28px, 4vw, 48px)",
            textAlign: "center",
            maxWidth: 560,
            margin: "0 auto",
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: colors.primarySoft,
              color: colors.primary,
              display: "grid",
              placeItems: "center",
              margin: "0 auto",
              marginBottom: spacing.lg,
            }}
          >
            <Icon name="house" size={26} />
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: fontSize.xxl,
              fontWeight: 600,
              marginBottom: spacing.sm,
            }}
          >
            List your property
          </h1>
          <p style={{ color: colors.muted, fontSize: fontSize.md, lineHeight: 1.6 }}>
            You&apos;re signed in — the property listing form is on its way. Check
            back soon to add your villa, flat, plot or office space to HomeDot.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
