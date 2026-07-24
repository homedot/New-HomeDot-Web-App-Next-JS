"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import { useCountUp } from "@/utils/useCountUp";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { ProfessionalProjectRecord } from "@/services/ProfessionalDashboardService";

const CHART_W = 300;
const CHART_H = 116;
const LABEL_H = 24;
const TOTAL_H = CHART_H + LABEL_H;
const PAD_X = 6;
const PAD_TOP = 16;
const PAD_BOTTOM = 8;

type MonthBucket = { key: string; label: string; year: number; count: number };
type Point = { x: number; y: number };

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

/** Catmull-Rom → cubic-Bezier smoothing (tension 1/6, the standard
 * conversion) so the trend reads as one continuous curve through every
 * point rather than sharp straight-line joins. */
function smoothPath(pts: Point[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** "Attractive animated graph" companion to ProDashboardAnalytics's donut —
 * a smooth trend line + gradient area of projects-started-per-month, so the
 * dashboard has a magnitude-over-time read alongside the part-to-whole one.
 * Built from real ProfessionalProjectRecord.startDate values already in
 * memory, no new endpoint. Chrome-less like ProDashboardAnalytics — sits
 * flush inside the dashboard's single unified container instead of its own
 * card. */
export default function ProDashboardActivityChart({ projects }: { projects: ProfessionalProjectRecord[] }) {
  const buckets = useMonthlyBuckets(projects);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const animatedTotal = useCountUp(total);
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <Reveal style={{ padding: "clamp(18px, 2.4vw, 26px)", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: spacing.lg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
        {total > 0 && (
          <span style={{ fontSize: fontSize.lg, fontWeight: 700, color: colors.ink, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {Math.round(animatedTotal)}
          </span>
        )}
      </div>

      {total === 0 ? (
        <div style={{ height: CHART_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Icon name="briefcase" size={20} color={colors.line} />
          <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0 }}>No project activity yet — this fills in once projects start.</p>
        </div>
      ) : (
        <TrendChart buckets={buckets} max={max} />
      )}
    </Reveal>
  );
}

function TrendChart({ buckets, max }: { buckets: MonthBucket[]; max: number }) {
  const gradientId = useId();
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- matchMedia is a client-only read, same convention as useCountUp's reduced-motion check
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const points = useMemo<Point[]>(() => {
    const innerW = CHART_W - PAD_X * 2;
    const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
    return buckets.map((b, i) => ({
      x: PAD_X + (buckets.length === 1 ? innerW / 2 : (i * innerW) / (buckets.length - 1)),
      y: PAD_TOP + innerH - (b.count / max) * innerH,
    }));
  }, [buckets, max]);

  const linePath = useMemo(() => smoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const base = CHART_H - PAD_BOTTOM;
    return `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${base} L ${points[0].x.toFixed(2)} ${base} Z`;
  }, [linePath, points]);

  // Measure the real curve length before paint (useLayoutEffect, not
  // useEffect) so the line never flashes fully-drawn before hiding —
  // dasharray/dashoffset start at that length (fully retracted) and the
  // separate reveal effect below flips them to 0 a frame later, which the
  // CSS transition then animates as a "drawing in" stroke.
  useLayoutEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());
  }, [linePath]);

  useEffect(() => {
    if (length === 0) return;
    if (reducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion bypass jumps straight to the drawn state, no tween to run
      setRevealed(true);
      return;
    }
    const raf = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, [length, reducedMotion]);

  const handleMove = (e: ReactMouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHover(nearest);
  };

  const hoveredPoint = hover != null ? points[hover] : null;
  const hoveredBucket = hover != null ? buckets[hover] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${CHART_W} ${TOTAL_H}`}
        width="100%"
        height={TOTAL_H}
        style={{ display: "block", overflow: "visible" }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.accent} stopOpacity={0.34} />
            <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </linearGradient>
        </defs>

        <line x1={PAD_X} y1={CHART_H - PAD_BOTTOM} x2={CHART_W - PAD_X} y2={CHART_H - PAD_BOTTOM} stroke={colors.line} strokeWidth={1} />

        <path d={areaPath} fill={`url(#${gradientId})`} opacity={revealed ? 1 : 0} style={{ transition: reducedMotion ? "none" : "opacity 700ms ease 250ms" }} />

        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={PAD_TOP}
            x2={hoveredPoint.x}
            y2={CHART_H - PAD_BOTTOM}
            stroke={colors.muted}
            strokeWidth={1}
            strokeDasharray="2 3"
            pointerEvents="none"
          />
        )}

        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={length}
          strokeDashoffset={revealed ? 0 : length}
          style={{ transition: reducedMotion || length === 0 ? "none" : "stroke-dashoffset 1000ms cubic-bezier(0.2, 0.8, 0.3, 1)" }}
        />

        {points.map((p, i) => {
          const b = buckets[i];
          const isHover = hover === i;
          const isZero = b.count === 0;
          return (
            <circle
              key={b.key}
              cx={p.x}
              cy={p.y}
              r={isHover ? 5 : isZero ? 2.5 : 3.5}
              fill={isZero ? colors.card : colors.accent}
              stroke={colors.accent}
              strokeWidth={isZero ? 1.5 : 0}
              opacity={revealed ? 1 : 0}
              pointerEvents="none"
              style={{ transition: reducedMotion ? "none" : `opacity 400ms ease ${280 + i * 90}ms, r 150ms ease, fill 150ms ease` }}
            />
          );
        })}

        {buckets.map((b, i) => (
          <text key={b.key} x={points[i].x} y={CHART_H + 15} textAnchor="middle" fontSize={9} fontWeight={600} fill={hover === i ? colors.ink : colors.muted}>
            {b.label}
          </text>
        ))}

        {/* Transparent hit-testing layer, painted last so it sits above the
            curve/dots and captures hover across the whole plot regardless of
            where exactly the pointer lands. */}
        <rect x={0} y={0} width={CHART_W} height={CHART_H} fill="transparent" onMouseMove={handleMove} style={{ cursor: "crosshair" }} />
      </svg>

      {hoveredPoint && hoveredBucket && (
        <span
          style={{
            position: "absolute",
            left: `${(hoveredPoint.x / CHART_W) * 100}%`,
            top: `${(hoveredPoint.y / TOTAL_H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
            background: colors.ink,
            color: colors.white,
            fontSize: 10.5,
            fontWeight: 700,
            padding: "4px 9px",
            borderRadius: radius.full,
            whiteSpace: "nowrap",
            boxShadow: shadow.sm,
            pointerEvents: "none",
          }}
        >
          {hoveredBucket.count} {hoveredBucket.count === 1 ? "project" : "projects"} · {hoveredBucket.label}
        </span>
      )}
    </div>
  );
}
