"use client";

import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { ListingPurpose } from "./shared";

const OPTIONS: {
  purpose: ListingPurpose;
  icon: IconName;
  title: string;
  desc: string;
  points: string[];
  accent: string;
  soft: string;
}[] = [
  {
    purpose: "Buy",
    icon: "house",
    title: "Sell",
    desc: "List a property you're looking to sell.",
    points: ["Reach serious, verified buyers", "Set your own asking price", "Free to list, no hidden fees"],
    accent: colors.primary,
    soft: colors.primarySoft,
  },
  {
    purpose: "Rent",
    icon: "sparkle",
    title: "Rent",
    desc: "List a property you're looking to rent out.",
    points: ["Reach tenants actively searching", "Fill vacancies faster", "Manage enquiries in one place"],
    accent: colors.price,
    soft: "rgba(14,124,138,0.12)",
  },
];

export default function PurposeStep({
  onSelect,
}: {
  onSelect: (purpose: ListingPurpose) => void;
}) {
  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          letterSpacing: "-0.02em",
          marginBottom: spacing.sm,
        }}
      >
        What would you like to list?
      </h1>
      <p style={{ fontSize: fontSize.base, color: colors.muted, marginBottom: spacing.xl }}>
        Choose how you want to list this property — you can always list another one later.
      </p>

      <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: spacing.lg }}>
        {OPTIONS.map((o) => (
          <button
            key={o.purpose}
            type="button"
            onClick={() => onSelect(o.purpose)}
            className="card-hover pa-purpose-card"
            style={{
              position: "relative",
              textAlign: "left",
              background: colors.card,
              border: `1.5px solid ${colors.line}`,
              borderRadius: radius.lg,
              padding: spacing.xl,
              overflow: "hidden",
              boxShadow: shadow.sm,
            }}
          >
            <span
              className="pa-purpose-glow"
              style={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: o.accent,
                filter: "blur(50px)",
                opacity: 0.22,
              }}
            />
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 15,
                background: o.soft,
                color: o.accent,
                display: "grid",
                placeItems: "center",
                marginBottom: spacing.lg,
              }}
            >
              <Icon name={o.icon} size={24} />
            </span>
            <b style={{ display: "block", fontFamily: "var(--font-display)", fontSize: fontSize.lg + 3, marginBottom: 6 }}>
              {o.title}
            </b>
            <p style={{ fontSize: fontSize.sm + 0.5, color: colors.muted, marginBottom: spacing.md, lineHeight: 1.5 }}>
              {o.desc}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {o.points.map((p) => (
                <span
                  key={p}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: fontSize.xs + 1,
                    color: colors.ink2,
                    fontWeight: 500,
                  }}
                >
                  <Icon name="check" size={13} color={o.accent} /> {p}
                </span>
              ))}
            </div>
            <span
              className="pa-purpose-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: spacing.lg,
                fontSize: fontSize.sm,
                fontWeight: 700,
                color: o.accent,
              }}
            >
              Get started <Icon name="arrow" size={15} color={o.accent} />
            </span>
          </button>
        ))}
      </Reveal>
    </div>
  );
}
