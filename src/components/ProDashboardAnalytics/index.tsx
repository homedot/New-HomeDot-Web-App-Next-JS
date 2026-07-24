"use client";

import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import { useCountUp } from "@/utils/useCountUp";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";

const GREEN = "#22c55e"; // same "good/live" green as .pdash-pulse-dot
const RED = "#C0392B"; // same tone ProfessionalDashboardScreen already uses for roleError

type Segment = { label: string; value: number; color: string };

/** Performance overview card for the professional dashboard — a donut of the
 * project pipeline (ongoing/completed/cancelled, the same three buckets the
 * tab bar already counts) plus a few progress bars derived from data this
 * screen already fetches (no new endpoint). Everything animates in via the
 * shared useCountUp tween rather than a separate CSS-keyframe path, so it
 * respects prefers-reduced-motion the same way the hero stat tiles do. */
export default function ProDashboardAnalytics({
  ongoing,
  completed,
  cancelled,
  jobCount,
  directCount,
  rating,
}: {
  ongoing: number;
  completed: number;
  cancelled: number;
  jobCount: number;
  directCount: number;
  rating: number;
}) {
  const totalProjects = ongoing + completed + cancelled;
  const totalEnquiries = jobCount + directCount;

  const segments: Segment[] = [
    { label: "Ongoing", value: ongoing, color: colors.accent },
    { label: "Completed", value: completed, color: GREEN },
    { label: "Cancelled", value: cancelled, color: RED },
  ];

  const completionPct = totalProjects > 0 ? (completed / totalProjects) * 100 : 0;
  const jobSharePct = totalEnquiries > 0 ? (jobCount / totalEnquiries) * 100 : 0;
  const ratingPct = Math.min((rating / 5) * 100, 100);

  return (
    <Reveal
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        padding: "clamp(18px, 2.4vw, 26px)",
        marginBottom: spacing.xl,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: spacing.lg }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: colors.primarySoft,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="grid" size={16} color={colors.primary} />
        </span>
        <div>
          <h2 style={{ fontSize: fontSize.md, fontWeight: 700, color: colors.ink, margin: 0 }}>Performance overview</h2>
          <p style={{ fontSize: 11.5, color: colors.muted, margin: 0, marginTop: 1 }}>Live snapshot of your pipeline and enquiries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr]" style={{ gap: spacing.xxl, alignItems: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: spacing.xl, justifyContent: "center" }}>
          <PipelineDonut segments={segments} total={totalProjects} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {segments.map((s) => (
              <LegendRow key={s.label} segment={s} total={totalProjects} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
          <ProgressRow
            label="Project completion rate"
            valueLabel={totalProjects > 0 ? `${completed} of ${totalProjects} completed` : "No projects yet"}
            pct={completionPct}
            tint={GREEN}
          />
          <ProgressRow
            label="Job vs. Direct enquiries"
            valueLabel={totalEnquiries > 0 ? `${jobCount} job · ${directCount} direct` : "No enquiries yet"}
            pct={jobSharePct}
            tint={colors.accent}
          />
          <ProgressRow label="Average client rating" valueLabel={`${rating.toFixed(1)} / 5`} pct={ratingPct} tint={colors.goldDeep} />
        </div>
      </div>
    </Reveal>
  );
}

function PipelineDonut({ segments, total, size = 148, strokeWidth = 16 }: { segments: Segment[]; total: number; size?: number; strokeWidth?: number }) {
  // Single 0→1 tween drives every segment's dash-offset together, so the ring
  // reads as "filling up" on mount instead of a static pie appearing at once.
  const t = useCountUp(1, 1100);
  const animatedTotal = useCountUp(total);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.bg} strokeWidth={strokeWidth} />
        {total > 0 &&
          segments.map((s) => {
            if (s.value <= 0) return null;
            const fraction = s.value / total;
            const deg = -90 + cumulative * 360;
            cumulative += fraction;
            return (
              <circle
                key={s.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - fraction * t)}
                transform={`rotate(${deg} ${cx} ${cy})`}
              />
            );
          })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: fontSize.xxl, fontWeight: 700, color: colors.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(animatedTotal)}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 3 }}>
          {total === 1 ? "Project" : "Projects"}
        </span>
      </div>
    </div>
  );
}

function LegendRow({ segment, total }: { segment: Segment; total: number }) {
  const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 150 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: segment.color, flexShrink: 0 }} />
      <span style={{ fontSize: fontSize.xs, color: colors.ink2, fontWeight: 600, flex: 1 }}>{segment.label}</span>
      <span style={{ fontSize: fontSize.xs, color: colors.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{segment.value}</span>
      <span style={{ fontSize: 10.5, color: colors.muted, width: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}

function ProgressRow({ label, valueLabel, pct, tint }: { label: string; valueLabel: string; pct: number; tint: string }) {
  const animatedPct = useCountUp(pct);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7, gap: spacing.sm }}>
        <span style={{ fontSize: fontSize.xs, fontWeight: 700, color: colors.ink }}>{label}</span>
        <span style={{ fontSize: 11, color: colors.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{valueLabel}</span>
      </div>
      <div style={{ height: 8, borderRadius: radius.full, background: colors.bg, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${animatedPct}%`,
            borderRadius: radius.full,
            background: `linear-gradient(90deg, rgba(${hexToRgb(tint)}, 0.75), ${tint})`,
          }}
        />
      </div>
    </div>
  );
}
