"use client";

import { useMemo, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import { useCountUp } from "@/utils/useCountUp";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { ProfessionalProjectRecord } from "@/services/ProfessionalDashboardService";

const CHART_HEIGHT = 128;

type MonthBucket = { key: string; label: string; year: number; count: number };

/** Buckets `projects` by startDate into the trailing 6 calendar months
 * (current month included). Only counts projects whose page has already
 * been fetched into the dashboard's ongoing/completed/cancelled lists —
 * same "counts what's loaded" convention the tab bar badges already use —
 * so this reads as a directional recent-activity view, not an audited total. */
function useMonthlyBuckets(projects: ProfessionalProjectRecord[]): MonthBucket[] {
  return useMemo(() => {
    const now = new Date();
    const buckets: MonthBucket[] = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-US", { month: "short" }), year: d.getFullYear(), count: 0 };
    });
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    for (const p of projects) {
      if (!p.startDate) continue;
      const d = new Date(p.startDate);
      if (Number.isNaN(d.getTime())) continue;
      const bucket = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }, [projects]);
}

/** "Attractive animated graph" companion to ProDashboardAnalytics's donut —
 * a cascading bar chart of projects-started-per-month, so the dashboard has
 * a magnitude-over-time read alongside the part-to-whole one. Built from
 * real ProfessionalProjectRecord.startDate values already in memory, no new
 * endpoint. Bars grow in with a per-bar stagger (via useCountUp's duration,
 * same hook the rest of the dashboard's animation already runs on) and show
 * an exact count on hover. */
export default function ProDashboardActivityChart({ projects }: { projects: ProfessionalProjectRecord[] }) {
  const buckets = useMonthlyBuckets(projects);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <Reveal
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        padding: "clamp(18px, 2.4vw, 26px)",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: spacing.lg }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `rgba(${hexToRgb(colors.accent)}, 0.12)`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="calendar" size={16} color={colors.accent} />
        </span>
        <div>
          <h2 style={{ fontSize: fontSize.md, fontWeight: 700, color: colors.ink, margin: 0 }}>Project activity</h2>
          <p style={{ fontSize: 11.5, color: colors.muted, margin: 0, marginTop: 1 }}>Projects started per month, last 6 months</p>
        </div>
      </div>

      {total === 0 ? (
        <div style={{ height: CHART_HEIGHT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Icon name="briefcase" size={20} color={colors.line} />
          <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0 }}>No project activity yet — this fills in once projects start.</p>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "stretch", gap: "clamp(6px, 1.6vw, 18px)", height: CHART_HEIGHT }}>
          {buckets.map((b, i) => (
            <Bar key={b.key} bucket={b} max={max} index={i} />
          ))}
        </div>
      )}
    </Reveal>
  );
}

function Bar({ bucket, max, index }: { bucket: MonthBucket; max: number; index: number }) {
  const [hovered, setHovered] = useState(false);
  // Staggered duration (not a shared 0→1 tween) so bars finish growing in a
  // left-to-right cascade rather than all snapping up together.
  const pct = useCountUp((bucket.count / max) * 100, 650 + index * 90);

  return (
    <div
      role="img"
      aria-label={`${bucket.label} ${bucket.year}: ${bucket.count} project${bucket.count === 1 ? "" : "s"}`}
      title={`${bucket.label} ${bucket.year} · ${bucket.count} project${bucket.count === 1 ? "" : "s"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", cursor: "default" }}
    >
      <div style={{ position: "relative", width: "100%", flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {hovered && bucket.count > 0 && (
          <span
            style={{
              position: "absolute",
              top: `calc(${100 - pct}% - 26px)`,
              background: colors.ink,
              color: colors.white,
              fontSize: 10.5,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: radius.full,
              whiteSpace: "nowrap",
              boxShadow: shadow.sm,
              pointerEvents: "none",
            }}
          >
            {bucket.count}
          </span>
        )}
        <div
          style={{
            width: "58%",
            maxWidth: 34,
            height: `${Math.max(pct, bucket.count > 0 ? 4 : 0)}%`,
            borderRadius: "7px 7px 3px 3px",
            background: hovered ? colors.primary : `linear-gradient(180deg, ${colors.accent}, rgba(${hexToRgb(colors.accent)}, 0.55))`,
            transition: "background 0.15s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: colors.muted, marginTop: 8 }}>{bucket.label}</span>
    </div>
  );
}
