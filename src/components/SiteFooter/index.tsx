import type { CSSProperties } from "react";
import Link from "next/link";
import { colors } from "@/constants/colors";
import { spacing, fontSize, maxWidth } from "@/utils/size";
import Brand from "@/components/Brand";
import StoreButtons from "@/components/StoreButtons";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

const COLS: { h: string; links: { label: string; href?: string }[] }[] = [
  {
    h: "Properties",
    links: [
      { label: "Buy a home", href: "/marketplace" },
      { label: "Rent a home", href: "/marketplace" },
      { label: "New projects" },
      { label: "Add your property" },
    ],
  },
  {
    h: "Professionals",
    links: [
      { label: "Architects" },
      { label: "Interior Designers" },
      { label: "Contractors" },
      { label: "Household Services" },
    ],
  },
  {
    h: "Company",
    links: [{ label: "About HomeDot" }, { label: "Blogs" }, { label: "Careers" }, { label: "Contact" }],
  },
  {
    h: "Support",
    links: [{ label: "Help center" }, { label: "Safety & trust" }, { label: "Terms", href: "/termsandconditions" }, { label: "Privacy", href: "/privacy" }],
  },
];

const linkStyle: CSSProperties = {
  color: "rgba(255,255,255,0.78)",
  fontSize: fontSize.sm + 1,
  padding: "6px 0",
  cursor: "pointer",
  display: "block",
};

export default function SiteFooter({ flush = false }: { flush?: boolean } = {}) {
  return (
    <footer
      style={{
        background: colors.ink,
        color: colors.white,
        // The default gap reads as intentional breathing room over the
        // page's light background — but it shows as a stray light-colored
        // seam when the section right above (e.g. StoryBand) is already
        // dark, so callers with a dark section immediately before the
        // footer pass `flush` to remove it.
        marginTop: flush ? 0 : spacing.xl,
      }}
    >
      <div
        className="grid grid-cols-2 lg:grid-cols-5"
        style={{
          ...wrap,
          padding: `${spacing.huge - 8}px ${spacing.xl}px ${spacing.xxl}px`,
          gap: spacing.xxl,
        }}
      >
        <div className="col-span-2 lg:col-span-1">
          <Link href="/">
            <Brand light />
          </Link>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: fontSize.sm + 1,
              lineHeight: 1.6,
              margin: `${spacing.md}px 0 ${spacing.lg}px`,
              maxWidth: 280,
            }}
          >
            Plan, design, build and maintain your dream home — with verified
            professionals near you.
          </p>
          <StoreButtons size="sm" />
        </div>
        {COLS.map((c) => (
          <div key={c.h}>
            <h4
              style={{
                fontSize: fontSize.xs,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: spacing.md,
                fontWeight: 700,
              }}
            >
              {c.h}
            </h4>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {c.links.map((l) =>
                l.href ? (
                  <Link key={l.label} href={l.href} style={linkStyle}>
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.label} style={linkStyle}>
                    {l.label}
                  </a>
                )
              )}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          ...wrap,
          padding: `${spacing.lg}px ${spacing.xl}px`,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: spacing.md,
          fontSize: fontSize.sm,
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <span>© 2026 HomeDot · Made in Kerala, India</span>
        <span style={{ display: "flex", gap: spacing.lg }}>
          <Link href="/termsandconditions" style={{ color: "inherit" }}>
            Terms
          </Link>
          <Link href="/privacy" style={{ color: "inherit" }}>
            Privacy
          </Link>
          <a style={{ cursor: "pointer" }}>Cookies</a>
        </span>
      </div>
    </footer>
  );
}
