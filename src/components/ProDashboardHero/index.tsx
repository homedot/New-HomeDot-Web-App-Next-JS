"use client";

import type { ReactNode } from "react";
import { colors } from "@/constants/colors";
import { spacing, maxWidth as siteMaxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import HeroScene from "@/components/HeroScene";

/** Full-bleed, animated hero band shared by every top-level professional
 * screen (Dashboard, Enquiries, Profile) — same gradient mesh, drifting
 * blob layer, decorative tools illustration and sheen sweep everywhere, so
 * navigating between them feels like one consistent, finished area rather
 * than the Dashboard alone getting the "premium" treatment. Callers supply
 * their own eyebrow/title/subtitle content as children; only the animated
 * shell itself lives here.
 *
 * `maxWidth` defaults to the shared site width but can be overridden — the
 * Dashboard screen passes its own slightly wider value so this hero's title
 * column still lines up with its unified container below, which needs the
 * extra room. */
export default function ProDashboardHero({
  children,
  minHeight = "clamp(320px, 34vw, 420px)",
  maxWidth = siteMaxWidth,
}: {
  children: ReactNode;
  minHeight?: string;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        overflow: "hidden",
        minHeight,
        background: colors.primary,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: `radial-gradient(130% 100% at 88% -10%, ${colors.primaryDeep} 0%, transparent 55%), radial-gradient(85% 75% at 4% 118%, rgba(41,151,255,0.32) 0%, transparent 52%), radial-gradient(60% 50% at 20% 20%, rgba(245,166,35,0.10) 0%, transparent 60%)`,
        }}
      />
      <HeroScene dense />
      <HeroIllustration />
      <span className="pdash-sheen" aria-hidden="true" />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth,
          margin: "0 auto",
          padding: `${spacing.xl}px ${spacing.xl}px clamp(48px, 6vw, 72px)`,
          minHeight,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: spacing.md,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Decorative, code-built line-art (compass/ruler/hardhat — no stock photos in
 * this codebase) drifting slowly in the hero's bottom-right corner, echoed
 * by smaller clusters in the other three corners so a full-bleed band this
 * wide never reads as empty. Moved here from ProfessionalDashboardScreen so
 * every hero using ProDashboardHero gets the same treatment. */
function HeroIllustration() {
  return (
    <div className="pdash-illustration-scene" aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden", pointerEvents: "none" }}>
      {/* Huge, near-invisible mark filling the vast middle of the full-bleed
          band — pure depth, not meant to be consciously "read". */}
      <span style={{ position: "absolute", left: "38%", top: "-14%" }}>
        <Icon name="compass" size={620} strokeWidth={0.6} color="rgba(255,255,255,0.045)" />
      </span>

      {/* Bottom-right cluster (tools) */}
      <div className="pdash-illustration" style={{ position: "absolute", right: "1%", bottom: "-8%", width: 340, height: 300 }}>
        <span style={{ position: "absolute", right: 0, bottom: 0 }}>
          <Icon name="compass" size={220} strokeWidth={1} color="rgba(255,255,255,0.14)" />
        </span>
        <span className="pdash-illustration-sub" style={{ position: "absolute", left: 0, top: 40 }}>
          <Icon name="ruler" size={110} strokeWidth={1} color="rgba(255,255,255,0.16)" />
        </span>
        <span className="pdash-illustration-sub2" style={{ position: "absolute", right: 160, top: 0 }}>
          <Icon name="hardhat" size={86} strokeWidth={1} color="rgba(255,255,255,0.18)" />
        </span>
      </div>

      {/* Top-right, smaller and higher up so the right margin doesn't read
          as empty above the tools cluster. */}
      <div className="pdash-illustration-sub" style={{ position: "absolute", right: "6%", top: "6%", width: 160, height: 140 }}>
        <span style={{ position: "absolute", right: 0, top: 0 }}>
          <Icon name="cube" size={70} strokeWidth={1} color="rgba(255,255,255,0.12)" />
        </span>
        <span style={{ position: "absolute", right: 90, top: 30 }}>
          <Icon name="bolt" size={46} strokeWidth={1} color="rgba(255,255,255,0.14)" />
        </span>
      </div>

      {/* Bottom-left cluster (interior/finishing motif) — mirrors the
          bottom-right tools cluster so the left margin isn't bare. */}
      <div className="pdash-illustration-sub2" style={{ position: "absolute", left: "2%", bottom: "-10%", width: 280, height: 260 }}>
        <span style={{ position: "absolute", left: 0, bottom: 0 }}>
          <Icon name="sofa" size={180} strokeWidth={1} color="rgba(255,255,255,0.13)" />
        </span>
        <span className="pdash-illustration-sub" style={{ position: "absolute", left: 150, top: 20 }}>
          <Icon name="brush" size={78} strokeWidth={1} color="rgba(255,255,255,0.15)" />
        </span>
      </div>

      {/* Top-left, small — echoes the top-right pair for symmetry. */}
      <div className="pdash-illustration" style={{ position: "absolute", left: "5%", top: "10%", width: 120, height: 110 }}>
        <span style={{ position: "absolute", left: 0, top: 0 }}>
          <Icon name="leaf" size={56} strokeWidth={1} color="rgba(255,255,255,0.12)" />
        </span>
        <span style={{ position: "absolute", left: 70, top: 40 }}>
          <Icon name="drop" size={38} strokeWidth={1} color="rgba(255,255,255,0.14)" />
        </span>
      </div>
    </div>
  );
}
