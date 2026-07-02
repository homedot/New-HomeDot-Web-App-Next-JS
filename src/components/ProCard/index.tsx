import { colors } from "@/constants/colors";
import { radius, shadow, spacing, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";

export type Professional = {
  id: string;
  name: string;
  profession: string;
  location: string;
  cover: string;
  avatar: string;
  rating: number;
  reviews: number;
  verified?: boolean;
  price: string;
  priceUnit: string;
  tagline: string;
};

export default function ProCard({ pro }: { pro: Professional }) {
  return (
    <article
      className="card-hover"
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        boxShadow: shadow.sm,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/10", background: colors.primarySoft, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pro.cover}
          alt={pro.name}
          loading="lazy"
          className="card-hover-img"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {pro.verified && (
          <span
            style={{
              position: "absolute",
              left: spacing.md,
              bottom: spacing.md,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: fontSize.xs,
              fontWeight: 700,
              color: colors.white,
              background: "rgba(16,28,48,0.72)",
              padding: "5px 11px",
              borderRadius: radius.full,
            }}
          >
            <Icon name="verified" size={13} filled color={colors.white} />
            Verified
          </span>
        )}
      </div>
      <div style={{ padding: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.md, flex: 1 }}>
        <div style={{ display: "flex", gap: spacing.md, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pro.avatar}
            alt={pro.name}
            style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: `2px solid ${colors.white}`, boxShadow: `0 0 0 1px ${colors.line}` }}
          />
          <div>
            <h3 style={{ fontSize: fontSize.lg - 1.5, fontWeight: 700 }}>{pro.name}</h3>
            <p style={{ fontSize: fontSize.xs, color: colors.muted, marginTop: 2 }}>
              {pro.profession} · {pro.location.split(",")[0]}
            </p>
          </div>
        </div>
        <p style={{ fontSize: fontSize.sm + 1, color: colors.ink2, lineHeight: 1.45 }}>{pro.tagline}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: fontSize.sm }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
            <Icon name="star" size={14} filled color={colors.gold} />
            {pro.rating.toFixed(1)}
          </span>
          <span style={{ color: colors.line }}>·</span>
          <span style={{ color: colors.muted }}>{pro.reviews} reviews</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <span>
            <b style={{ fontSize: fontSize.lg - 1 }}>{pro.price}</b>{" "}
            <em style={{ fontStyle: "normal", fontSize: fontSize.xs, color: colors.muted }}>/ {pro.priceUnit}</em>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: fontSize.sm, fontWeight: 600, color: colors.primary }}>
            View profile <Icon name="arrow" size={16} />
          </span>
        </div>
      </div>
    </article>
  );
}
