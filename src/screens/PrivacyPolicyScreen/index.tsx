"use client";

import { useState, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import Icon from "@/components/Icon";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import { PRIVACY_SECTIONS, SUPPORT_EMAIL, EFFECTIVE_DATE, COPYRIGHT } from "./data";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

/** Full, standalone Privacy Policy page — reachable from SiteFooter's
 * "Privacy" link and from the professional Settings screen's Legal section.
 * Content is copied verbatim from homedotapp.com/privacy (see data.ts); only
 * the presentation (table of contents, section cards, icons) is this app's
 * own, matching the "gradient header band" pattern FavoritesScreen/
 * ProjectsScreen already use for general (non-professional) content pages. */
export default function PrivacyPolicyScreen() {
  const [active, setActive] = useState(PRIVACY_SECTIONS[0].id);

  const jumpTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {/* header */}
        <Reveal
          style={{
            position: "relative",
            borderRadius: radius.lg,
            overflow: "hidden",
            padding: "clamp(28px, 5vw, 44px)",
            background: `linear-gradient(120deg, ${colors.primary} 0%, #1c3155 60%, ${colors.price} 130%)`,
            boxShadow: shadow.md,
            marginBottom: spacing.xl,
          }}
        >
          <span
            className="pd-map-glow"
            style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: colors.accent, filter: "blur(70px)", opacity: 0.35 }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: spacing.md, color: colors.white }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: "rgba(255,255,255,0.75)" }}>
              <span>Home</span>
              <Icon name="arrow" size={13} />
              <span style={{ color: colors.white }}>Privacy Policy</span>
            </div>
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
            Privacy Policy
          </h1>
          <p style={{ position: "relative", color: "rgba(255,255,255,0.82)", fontSize: fontSize.base, marginTop: 6, maxWidth: 560 }}>
            Your privacy matters to us. Learn how we collect, use, and protect your personal information.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr]" style={{ gap: spacing.xl, alignItems: "start" }}>
          {/* table of contents */}
          <Reveal
            className="hidden xl:block xl:sticky xl:top-24"
            style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, padding: "16px 12px", boxShadow: shadow.sm }}
          >
            <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, padding: "0 10px 8px" }}>
              On this page
            </span>
            <nav style={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: "60vh", overflowY: "auto" }}>
              {PRIVACY_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => jumpTo(s.id)}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 10,
                    fontSize: 12.5,
                    fontWeight: active === s.id ? 700 : 500,
                    color: active === s.id ? colors.primary : colors.ink2,
                    background: active === s.id ? colors.primarySoft : "transparent",
                  }}
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </Reveal>

          {/* content */}
          <main style={{ minWidth: 0 }}>
            <Reveal style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, padding: "clamp(20px, 3vw, 34px)", boxShadow: shadow.sm }}>
              <p style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.7, marginBottom: spacing.xl, fontStyle: "italic" }}>
                &ldquo;We appreciate you taking the time to come and read our privacy policy. We believe you always know what data we collect from you and how we use it, and
                that you should have meaningful control over both.&rdquo;
              </p>
              <p style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.7, marginBottom: spacing.xxl }}>
                Home Dot Construction Solution Pvt Ltd developed the Home Dot app as a free application. This SERVICE is provided by Home Dot Construction Solution Pvt Ltd at
                no cost and is intended for use as is. The company uses collected Personal Information &ldquo;for providing and improving the Service&rdquo; and will not
                share it except as described in this policy.
              </p>

              {PRIVACY_SECTIONS.map((s, i) => (
                <div key={s.id} id={s.id} style={{ scrollMarginTop: 100, paddingTop: i === 0 ? 0 : spacing.xxl, borderTop: i === 0 ? undefined : `1px solid ${colors.line}`, marginTop: i === 0 ? 0 : spacing.xxl }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: spacing.md }}>
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: `rgba(${hexToRgb(colors.primary)}, 0.1)`,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={s.icon} size={18} color={colors.primary} />
                    </span>
                    <h2 style={{ fontSize: fontSize.lg, fontWeight: 700 }}>{s.title}</h2>
                  </div>

                  {s.paragraphs?.map((p, pi) => (
                    <p key={pi} style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.7, marginBottom: spacing.md }}>
                      {p}
                    </p>
                  ))}

                  {s.lists?.map((l, li) => (
                    <div key={li} style={{ marginBottom: spacing.md }}>
                      {l.heading && <h3 style={{ fontSize: fontSize.sm, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>{l.heading}</h3>}
                      <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {l.items.map((item, ii) => (
                          <li key={ii} style={{ display: "flex", gap: 10, color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.6 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: colors.price, marginTop: 9, flexShrink: 0 }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}

              <div style={{ marginTop: spacing.xxl, paddingTop: spacing.xl, borderTop: `1px solid ${colors.line}`, textAlign: "center" }}>
                <p style={{ color: colors.muted, fontSize: fontSize.xs, marginBottom: 8 }}>Effective Date: {EFFECTIVE_DATE}</p>
                <p style={{ display: "inline-flex", alignItems: "center", gap: 6, color: colors.ink2, fontSize: fontSize.sm, fontWeight: 600, marginBottom: 8 }}>
                  <Icon name="mail" size={14} color={colors.primary} /> Contact: {SUPPORT_EMAIL}
                </p>
                <p style={{ color: colors.muted, fontSize: fontSize.xs }}>{COPYRIGHT}</p>
              </div>
            </Reveal>
          </main>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
