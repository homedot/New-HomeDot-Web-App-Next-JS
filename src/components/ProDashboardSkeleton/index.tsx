"use client";

import { spacing, radius } from "@/utils/size";

/** Loading placeholder shaped like the professional area's own 2/3-column
 * layout (sidebar + hero + card blocks, optionally a profile rail) — used
 * by ProfessionalDashboardScreen/ProfessionalProfileScreen/ProfessionalEnquiriesScreen
 * while their initial data is in flight. Replaces a single thin shimmer bar,
 * which left most of the viewport uncovered during the brief loading window
 * right after navigating here (see globals.css's `body` background fix for
 * the flash-of-black issue that made that gap especially visible). */
export default function ProDashboardSkeleton({ rail = false }: { rail?: boolean }) {
  return (
    <div
      className={`grid grid-cols-1 ${rail ? "xl:grid-cols-[264px_1fr_280px]" : "xl:grid-cols-[264px_1fr]"}`}
      style={{ gap: spacing.xl, alignItems: "start" }}
    >
      <div className="skeleton-shimmer" style={{ height: 420, borderRadius: radius.lg }} />
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
        <div className="skeleton-shimmer" style={{ height: 160, borderRadius: radius.lg }} />
        <div className="skeleton-shimmer" style={{ height: 280, borderRadius: radius.lg }} />
      </div>
      {rail && <div className="skeleton-shimmer" style={{ height: 360, borderRadius: radius.lg }} />}
    </div>
  );
}
