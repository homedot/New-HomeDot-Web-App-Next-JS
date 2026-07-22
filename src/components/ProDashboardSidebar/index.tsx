"use client";

import { usePathname, useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Brand from "@/components/Brand";
import Reveal from "@/components/Reveal";

type SidebarNavEntry = { icon: IconName; label: string; href?: string; onClick?: () => void; danger?: boolean; chip?: string };

/** #rgb/#rrggbb → "r, g, b" for use inside an rgba() string — palette tokens
 * (colors.accent etc.) are hex, but the soon-chip tint needs an alpha
 * channel, so this avoids hand-maintaining a parallel rgba palette. */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

/** Sidebar shell mirrors ProfileScreen's sidebar (same gradient/Reveal/sticky
 * treatment, src/screens/ProfileScreen/index.tsx:299-419) — nav items are
 * limited to routes that actually exist; reference screen-pro-dashboard.jsx's
 * extra items (Blogs, Refer & earn, Support…) are shown as a
 * disabled "Coming soon" group rather than dead links. Shared by
 * ProfessionalDashboardScreen and ProfessionalEnquiriesScreen — computes its
 * own active state from the current route (usePathname) rather than being
 * told which item is active, so it stays correct across both pages. */
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
      className="relative xl:sticky xl:top-24"
      style={{
        overflow: "hidden",
        background: colors.primary,
        borderRadius: radius.lg,
        padding: "20px 16px",
        boxShadow: shadow.md,
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
      }}
    >
      <span
        className="animate-glow-pulse"
        style={{ position: "absolute", right: -50, top: -60, width: 180, height: 180, borderRadius: "50%", background: colors.accent, filter: "blur(60px)", opacity: 0.3 }}
      />
      <span
        className="animate-glow-pulse"
        style={{
          position: "absolute",
          left: -60,
          bottom: -40,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: colors.gold,
          filter: "blur(56px)",
          opacity: 0.16,
          animationDelay: "-2.5s",
        }}
      />

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 14px" }}>
        <Brand light />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            background: colors.accent,
            color: colors.white,
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          Pro
        </span>
      </div>

      <nav style={{ position: "relative", display: "flex", flexDirection: "column", gap: 2 }}>
        {live.map((n) => (
          <SidebarNavItem key={n.label} {...n} active={!!n.href && pathname === n.href} onClick={n.href ? () => router.push(n.href!) : n.onClick} />
        ))}
      </nav>

      <div style={{ position: "relative", borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: spacing.md, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 14px 6px" }}>
          Coming soon
        </span>
        {soon.map((n) => (
          <SidebarNavItem key={n.label} {...n} />
        ))}
      </div>

      <div style={{ position: "relative", borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: spacing.md }}>
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
      className={(active || disabled ? "" : "pr-navitem ") + (disabled && chip ? "pdash-soon-chip" : "")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 12,
        background: active ? colors.white : "transparent",
        color: danger ? "#F87171" : active ? colors.primary : disabled ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.82)",
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
            background: `rgba(${hexToRgb(chip)}, 0.16)`,
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
            color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.1)",
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
