"use client";

import { usePathname, useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import Icon, { type IconName } from "@/components/Icon";
import Brand from "@/components/Brand";
import Reveal from "@/components/Reveal";

type SidebarNavEntry = { icon: IconName; label: string; href?: string; onClick?: () => void; danger?: boolean; chip?: string };

/** Nav rail for the professional area — light card (colors.card/line/ink),
 * matching the rest of ProfessionalDashboardScreen's bento cards rather than
 * the dark-navy treatment reference screen-pro-dashboard.jsx used: sitting
 * directly under the profile card in one sticky rail, a dark block there
 * read as a mismatched, bolted-on panel instead of part of the same design.
 * Nav items are limited to routes that actually exist; the reference's extra
 * items (Blogs, Refer & earn, Support…) are shown as a disabled "Coming
 * soon" group rather than dead links. Shared by ProfessionalDashboardScreen,
 * ProfessionalEnquiriesScreen, ProfessionalProfileScreen and
 * ProfessionalWorkfolioScreen — computes its own active state from the
 * current route (usePathname) rather than being told which item is active,
 * so it stays correct across all four pages. */
export default function ProDashboardSidebar({ onLogout, loggingOut }: { onLogout: () => void; loggingOut: boolean }) {
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

  return (
    <Reveal
      className="xl:sticky xl:top-24"
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        padding: "18px 14px",
        boxShadow: shadow.sm,
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
      }}
    >
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

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {live.map((n) => (
          <SidebarNavItem key={n.label} {...n} active={!!n.href && pathname === n.href} onClick={n.href ? () => router.push(n.href!) : n.onClick} />
        ))}
      </nav>

      <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: spacing.md, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, padding: "0 14px 6px" }}>
          Coming soon
        </span>
        {soon.map((n) => (
          <SidebarNavItem key={n.label} {...n} />
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: spacing.md }}>
        <SidebarNavItem icon="logout" label={loggingOut ? "Logging out…" : "Log out"} onClick={onLogout} danger />
      </div>
    </Reveal>
  );
}

function SidebarNavItem({ icon, label, active, danger, onClick, chip }: SidebarNavEntry & { active?: boolean }) {
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
            background: colors.bg,
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
