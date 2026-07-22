"use client";

import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import type { ProfessionalProjectRecord } from "@/services/ProfessionalDashboardService";

const STATUS_STYLE: Record<string, { bg: string; ic: "clock" | "check" | "close" }> = {
  ongoing: { bg: "#059669", ic: "clock" },
  active: { bg: "#059669", ic: "clock" },
  completed: { bg: "#1D4ED8", ic: "check" },
  pending: { bg: "#D97706", ic: "clock" },
  cancelled: { bg: "#DC2626", ic: "close" },
};

function statusStyle(status: string) {
  return STATUS_STYLE[status?.toLowerCase?.() ?? ""] ?? { bg: "#4B5563", ic: "clock" as const };
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Web counterpart of homedot-mobile-app's ToatalWorksCards.js — the
 * Professional-side project card. Same visual language as this app's own
 * ProjectsScreen/ProjectCard (User side), but reads `customerInfo` +
 * `projectImageList` instead of `professionalUser` + `projectImages`, and
 * has no per-card action (mobile's own screen only navigates to a detail
 * screen, out of scope for the core dashboard). */
export default function ProfessionalProjectCard({ project }: { project: ProfessionalProjectRecord }) {
  const thumb = project.projectImageList?.[0]?.projectImage;
  const st = statusStyle(project.projectStatus);
  const customerName = project.customerInfo?.[0]?.name;

  return (
    <article
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        boxShadow: shadow.sm,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: "14px 16px" }}>
        <h3
          style={{
            fontSize: fontSize.md,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project.projectName}
        </h3>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10.5,
            fontWeight: 700,
            color: colors.white,
            background: st.bg,
            padding: "5px 10px",
            borderRadius: radius.full,
            textTransform: "capitalize",
          }}
        >
          <Icon name={st.ic} size={10} color={colors.white} />
          {project.projectStatus}
        </span>
      </div>

      <div style={{ height: 1, background: colors.line, margin: "0 16px" }} />

      <div style={{ display: "flex", gap: spacing.md, padding: 14 }}>
        <div style={{ width: 82, height: 82, borderRadius: radius.md, overflow: "hidden", background: colors.primarySoft, flexShrink: 0 }}>
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: colors.muted }}>
              <Icon name="briefcase" size={24} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: spacing.sm + 2, minWidth: 0, flex: 1 }}>
          {customerName && <InfoRow icon="user" label="Customer" value={customerName} />}
          <InfoRow icon="calendar" label="Date" value={`${formatDate(project.startDate)} – ${formatDate(project.endDate)}`} />
          <InfoRow icon="location" label="Location" value={project.location || "—"} />
        </div>
      </div>

      <div style={{ height: 3, background: colors.primary, marginTop: "auto" }} />
    </article>
  );
}

function InfoRow({ icon, label, value }: { icon: "user" | "calendar" | "location"; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: colors.primarySoft,
          color: colors.primary,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={12} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 9.5, fontWeight: 700, color: colors.muted, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {label}
        </span>
        <span
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: fontSize.sm,
            fontWeight: 600,
            color: colors.ink,
          }}
        >
          {value}
        </span>
      </span>
    </div>
  );
}
