import type { CSSProperties } from "react";
import Link from "next/link";
import { colors } from "@/constants/colors";
import { spacing, fontSize, radius, maxWidth } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Brand from "@/components/Brand";
import StoreButtons from "@/components/StoreButtons";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

// Every link below points at a real, working route — no placeholder/dead
// stubs. Split into "For Homeowners" / "My Account" / "For Professionals"
// rather than the old generic Properties/Professionals/Company/Support
// grouping, so the footer actually surveys both sides of the platform
// (mirrors the split RoleGate enforces between the user site and
// /professional/*) instead of just marketing categories. Property-type
// (Buy/Rent) and professional-category deep-links aren't wired here since
// both are resolved against dynamic ids fetched at runtime (see
// MarketplaceScreen's requestedPropertyTypeId / ProfessionalsScreen's
// requestedCategoryId) — nothing static to link to — so those go to the
// screen itself rather than a specific tab/filter.
const COLS: { h: string; icon: IconName; links: { label: string; href: string }[] }[] = [
  {
    h: "For Homeowners",
    icon: "house",
    links: [
      { label: "Browse properties", href: "/marketplace" },
      { label: "Find professionals", href: "/professionals" },
      { label: "Read our blog", href: "/blog" },
      { label: "List a property", href: "/property/add" },
    ],
  },
  {
    h: "My Account",
    icon: "user",
    links: [
      { label: "My favorites", href: "/favorites" },
      { label: "My enquiries", href: "/enquiries" },
      { label: "My properties", href: "/property/my" },
      { label: "My projects", href: "/projects" },
      { label: "My profile", href: "/profile" },
    ],
  },
  {
    h: "For Professionals",
    icon: "hardhat",
    links: [
      { label: "Professional dashboard", href: "/professional/dashboard" },
      { label: "Enquiries", href: "/professional/enquiries" },
      { label: "My blogs", href: "/professional/blogs" },
      { label: "Workfolio", href: "/professional/workfolio" },
      { label: "Refer & earn", href: "/professional/refer" },
    ],
  },
  {
    h: "Company & Support",
    icon: "shield",
    links: [
      { label: "Contact us", href: "/#contact" },
      { label: "Professional support", href: "/professional/support" },
      { label: "Terms & conditions", href: "/termsandconditions" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
];

const SOCIALS: { name: IconName; href: string; label: string }[] = [
  { name: "facebook", href: "https://www.facebook.com/homedotapps/", label: "HomeDot on Facebook" },
  { name: "instagram", href: "https://www.instagram.com/homedotapp/", label: "HomeDot on Instagram" },
  { name: "linkedin", href: "https://in.linkedin.com/company/homedotapp", label: "HomeDot on LinkedIn" },
  { name: "youtube", href: "https://www.youtube.com/@Hometechmalayalam", label: "HomeDot on YouTube" },
  { name: "whatsapp", href: "https://wa.me/917012303017", label: "Chat with HomeDot on WhatsApp" },
];

const linkStyle: CSSProperties = {
  color: "rgba(255,255,255,0.78)",
  fontSize: fontSize.base,
  padding: "7px 0",
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
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        style={{
          ...wrap,
          padding: `${spacing.huge}px ${spacing.xl}px ${spacing.xxl + 8}px`,
          gap: spacing.xxl,
        }}
      >
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <Link href="/">
            <Brand light />
          </Link>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: fontSize.base,
              lineHeight: 1.6,
              margin: `${spacing.md}px 0 ${spacing.lg}px`,
              maxWidth: 280,
            }}
          >
            Plan, design, build and maintain your dream home — with verified
            professionals near you.
          </p>
          <StoreButtons size="sm" />
          <div style={{ display: "flex", gap: 10, marginTop: spacing.lg }}>
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  display: "grid",
                  placeItems: "center",
                  color: "rgba(255,255,255,0.85)",
                  flexShrink: 0,
                }}
              >
                <Icon name={s.name} size={17} color="rgba(255,255,255,0.85)" />
              </a>
            ))}
          </div>
        </div>
        {COLS.map((c) => (
          <div key={c.h}>
            <h4
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: fontSize.sm,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "rgba(255,255,255,0.55)",
                marginBottom: spacing.md,
                fontWeight: 700,
              }}
            >
              <Icon name={c.icon} size={14} color="rgba(255,255,255,0.5)" />
              {c.h}
            </h4>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {c.links.map((l) => (
                <Link key={l.label} href={l.href} style={linkStyle}>
                  {l.label}
                </Link>
              ))}
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
        <span style={{ display: "flex", alignItems: "center", gap: spacing.lg }}>
          <Link href="/termsandconditions" style={{ color: "inherit" }}>
            Terms
          </Link>
          <Link href="/privacy" style={{ color: "inherit" }}>
            Privacy
          </Link>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: fontSize.xs,
              color: "rgba(255,255,255,0.4)",
              padding: "4px 10px",
              borderRadius: radius.full,
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <Icon name="verified" size={11} color="rgba(255,255,255,0.5)" /> Verified professionals only
          </span>
        </span>
      </div>
    </footer>
  );
}
