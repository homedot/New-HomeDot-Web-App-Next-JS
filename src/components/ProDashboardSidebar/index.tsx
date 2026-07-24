"use client";

import { usePathname, useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import Icon, { type IconName } from "@/components/Icon";
import Brand from "@/components/Brand";
import Reveal from "@/components/Reveal";

type SidebarNavEntry = { icon: IconName; label: string; href?: string; onClick?: () => void; danger?: boolean; chip?: string };

/** Nav rail for the professional area — light theme (colors.card/line/ink),
 * matching the rest of the dashboard rather than the dark-navy treatment
 * reference screen-pro-dashboard.jsx used, which read as a mismatched,
 * bolted-on panel next to the light cards around it.
 *
 * `bare` drops this component's own card chrome (background/border/shadow/
 * radius/padding/sticky) and its "HomeDot Pro" header row, for embedding
 * directly beneath ProfileRailCard inside ProfessionalDashboardScreen's
 * single unified container — that page supplies the shared card boundary,
 * the tinted rail background and the sticky wrapper itself, and the profile
 * card above it already establishes identity so the header would just
 * repeat it. ProfessionalEnquiriesScreen, ProfessionalProfileScreen and
 * ProfessionalWorkfolioScreen render it standalone (no profile card, no
 * shared container), so they get the default full-card version.
 *
 * Nav items are limited to routes that actually exist; the reference's extra
 * items (Blogs, Refer & earn, Support…) are shown as a disabled "Coming
 * soon" group rather than dead links. Computes its own active state from the
 * current route (usePathname) rather than being told which item is active,
 * so it stays correct across every page it's used on. */
export default function ProDashboardSidebar({ onLogout, loggingOut, bare = false }: { onLogout: () => void; loggingOut: boolean; bare?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const live: SidebarNavEntry[] = [
    { icon: "grid", label: "Dashboard", href: "/professional/dashboard" },
    { icon: "mail", label: "Enquiries", href: "/professional/enquiries" },
    { icon: "user", label: "Profile", href: "/professional/profile" },
    { icon: "briefcase", label: "Workfolio", href: "/professional/workfolio" },
    { icon: "heart", label: "Favourites", href: "/favorites" },
  ];
  const soon: SidebarNavEntry[] = [
    { icon: "chat", label: "Blogs", chip: colors.gold },
    { icon: "share", label: "Refer & earn", chip: colors.price },
    { icon: "settings", label: "Settings", chip: colors.accent },
    { icon: "phone", label: "Support", chip: colors.gold },
  ];
  // The "Soon" chip needs to pop against whatever sits behind this
  // component: colors.bg on the standalone white card, colors.card on the
  // dashboard's tinted (colors.bg) rail — otherwise it'd blend invisibly.
  const chipSurface = bare ? colors.card : colors.bg;

  return (
    <Reveal
      className={bare ? undefined : "xl:sticky xl:top-24"}
      style={
        bare
          ? { padding: "0 14px 16px", display: "flex", flexDirection: "column", gap: spacing.md }
          : {
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.lg,
              padding: "18px 14px",
              boxShadow: shadow.sm,
              display: "flex",
              flexDirection: "column",
              gap: spacing.md,
            }
      }
    >
      {!bare && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 14px", borderBottom: `1px solid ${colors.line}` }}>
          <Brand />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              background: colors.primarySoft,
              color: colors.primary,
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            Pro
          </span>
        </div>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {live.map((n) => (
          <SidebarNavItem key={n.label} {...n} active={!!n.href && pathname === n.href} onClick={n.href ? () => router.push(n.href!) : n.onClick} chipSurface={chipSurface} />
        ))}
      </nav>

      <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: spacing.md, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, padding: "0 14px 6px" }}>
          Coming soon
        </span>
        {soon.map((n) => (
          <SidebarNavItem key={n.label} {...n} chipSurface={chipSurface} />
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: spacing.md }}>
        <SidebarNavItem icon="logout" label={loggingOut ? "Logging out…" : "Log out"} onClick={onLogout} danger chipSurface={chipSurface} />
      </div>
    </Reveal>
  );
}

function SidebarNavItem({ icon, label, active, danger, onClick, chip, chipSurface }: SidebarNavEntry & { active?: boolean; chipSurface: string }) {
  const disabled = !active && !onClick;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={(active || disabled ? "" : "pdash-navitem ") + (disabled && chip ? "pdash-soon-chip" : "")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 12,
        background: active ? colors.primary : "transparent",
        color: danger ? "#C0392B" : active ? colors.white : disabled ? colors.muted : colors.ink2,
        fontSize: fontSize.sm,
        fontWeight: active ? 600 : 500,
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {disabled && chip ? (
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: `rgba(${hexToRgb(chip)}, 0.14)`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={15} color={chip} />
        </span>
      ) : (
        <Icon name={icon} size={17} />
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {active && <Icon name="arrow" size={14} />}
      {disabled && chip && (
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: colors.muted,
            background: chipSurface,
            padding: "3px 7px",
            borderRadius: radius.full,
            flexShrink: 0,
          }}
        >
          Soon
        </span>
      )}
    </button>
  );
}
