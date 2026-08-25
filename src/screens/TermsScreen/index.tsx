"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import Icon from "@/components/Icon";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getActiveRole } from "@/utils/authStorage";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import { TERMS_INTRO, TERMS_SECTIONS, COPYRIGHT } from "./data";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };
const ALPHA = "abcdefghijklmnop";

/** Full, standalone Terms & Conditions page — reachable from SiteFooter's
 * "Terms" link and from the professional Settings screen's Legal section.
 * Content is copied verbatim from homedotapp.com/termsandconditions (see
 * data.ts); only the presentation (table of contents, numbered clause
 * cards, icons) is this app's own — same "gradient header band" pattern as
 * PrivacyPolicyScreen. */
export default function TermsScreen() {
  const [active, setActive] = useState(TERMS_SECTIONS[0].id);
  // Same professional-mode header reasoning as PrivacyPolicyScreen — this
  // page is also reachable from the professional Settings/Support Legal
  // section, so the public site header is omitted entirely there.
  const [professionalMode, setProfessionalMode] = useState(false);
  useEffect(() => {
    setProfessionalMode(getActiveRole() === "professional");
  }, []);

  const jumpTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      {!professionalMode && <SiteNav />}

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
              <span style={{ color: colors.white }}>Terms &amp; Conditions</span>
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
            Terms and Conditions
          </h1>
          <p style={{ position: "relative", color: "rgba(255,255,255,0.82)", fontSize: fontSize.base, marginTop: 6, maxWidth: 560 }}>
            Please read these terms carefully before using our service. Your use of Home Dot indicates acceptance of these terms.
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
            <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {TERMS_SECTIONS.map((s) => (
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
              {TERMS_INTRO.map((p, i) => (
                <p key={i} style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.7, marginBottom: spacing.md }}>
                  {p}
                </p>
              ))}

              {TERMS_SECTIONS.map((s, i) => (
                <div
                  key={s.id}
                  id={s.id}
                  style={{ scrollMarginTop: 100, paddingTop: spacing.xxl, borderTop: `1px solid ${colors.line}`, marginTop: i === 0 ? spacing.xl : spacing.xxl }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: spacing.lg }}>
                    <span
                      style={{ width: 38, height: 38, borderRadius: 12, background: `rgba(${hexToRgb(colors.primary)}, 0.1)`, display: "grid", placeItems: "center", flexShrink: 0 }}
                    >
                      <Icon name={s.icon} size={18} color={colors.primary} />
                    </span>
                    <h2 style={{ fontSize: fontSize.lg, fontWeight: 700 }}>{s.title}</h2>
                  </div>

                  {s.intro?.map((p, pi) => (
                    <p key={pi} style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.7, marginBottom: spacing.md }}>
                      {p}
                    </p>
                  ))}

                  {s.list && (
                    <ol style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
                      {s.list.map((item, ii) => (
                        <li key={ii} style={{ display: "flex", gap: 12 }}>
                          <span style={{ flexShrink: 0, fontWeight: 700, color: colors.primary, fontSize: fontSize.sm, minWidth: 20 }}>{ii + 1}.</span>
                          <div>
                            <p style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.7 }}>
                              {item.label && <strong style={{ color: colors.ink, fontWeight: 700 }}>{item.label} </strong>}
                              {item.text}
                            </p>
                            {item.sub && (
                              <ul style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                                {item.sub.items.map((sub, si) => (
                                  <li key={si} style={{ display: "flex", gap: 10, color: colors.ink2, fontSize: fontSize.sm, lineHeight: 1.65 }}>
                                    <span style={{ flexShrink: 0, fontWeight: 700, color: colors.muted, minWidth: 16 }}>{ALPHA[si] || si + 1}.</span>
                                    {sub}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  {s.outro?.map((p, pi) => (
                    <p key={pi} style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.7, marginTop: spacing.md }}>
                      {p}
                    </p>
                  ))}
                </div>
              ))}

              <div style={{ marginTop: spacing.xxl, paddingTop: spacing.xl, borderTop: `1px solid ${colors.line}`, textAlign: "center" }}>
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
