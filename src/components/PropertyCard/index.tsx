"use client";

import { colors } from "@/constants/colors";
import { radius, shadow, spacing, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";

export type Property = {
  id: string;
  status: string;
  category: string;
  title: string;
  location: string;
  beds: number;
  baths: number;
  area: number;
  price: string;
  img: string;
  featured?: boolean;
  purpose?: "Buy" | "Rent";
  priceUnit?: string;
  amenities?: string[];
};

export default function PropertyCard({
  property,
  onOpen,
  saved,
  onSave,
}: {
  property: Property;
  onOpen?: () => void;
  saved?: boolean;
  onSave?: (id: string) => void;
}) {
  return (
    <article
      className="card-hover"
      onClick={onOpen}
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        boxShadow: shadow.sm,
        display: "flex",
        flexDirection: "column",
        cursor: onOpen ? "pointer" : "default",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/11", background: colors.primarySoft, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.img}
          alt={property.title}
          loading="lazy"
          className="card-hover-img"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span
          style={{
            position: "absolute",
            left: spacing.md,
            top: spacing.md,
            background: colors.primary,
            color: colors.white,
            fontSize: fontSize.xs,
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: radius.full,
          }}
        >
          {property.status}
        </span>
        {property.featured && (
          <span
            style={{
              position: "absolute",
              left: spacing.md,
              top: 46,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: colors.accent,
              color: colors.white,
              fontSize: 11.5,
              fontWeight: 700,
              padding: "5px 11px",
              borderRadius: radius.full,
            }}
          >
            <Icon name="sparkle" size={12} filled color={colors.white} />
            Featured
          </span>
        )}
        {onSave && (
          <button
            aria-label={saved ? "Remove from saved" : "Save property"}
            onClick={(e) => {
              e.stopPropagation();
              onSave(property.id);
            }}
            style={{
              position: "absolute",
              right: spacing.md,
              top: spacing.md,
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: colors.white,
              display: "grid",
              placeItems: "center",
              color: saved ? "#E5484D" : colors.ink2,
              boxShadow: shadow.sm,
            }}
          >
            <Icon name="heart" size={18} filled={saved} />
          </button>
        )}
      </div>
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: spacing.sm + 1, flex: 1 }}>
        <span
          style={{
            alignSelf: "flex-start",
            fontSize: fontSize.xs,
            fontWeight: 600,
            color: colors.accent,
            background: "rgba(41,151,255,0.12)",
            padding: "5px 12px",
            borderRadius: 8,
          }}
        >
          {property.category}
        </span>
        <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: colors.muted, minWidth: 0 }}>
          <Icon name="location" size={15} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{property.location}</span>
        </p>
        <h3
          style={{
            fontSize: fontSize.lg - 1,
            fontWeight: 700,
            lineHeight: 1.3,
            color: colors.ink,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {property.title}
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", color: colors.ink2 }}>
          {property.beds > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
              {property.beds} {property.beds === 1 ? "Bed" : "Beds"}
            </span>
          )}
          {property.baths > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
              {property.baths} {property.baths === 1 ? "Bath" : "Baths"}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>{property.area.toLocaleString()} sqft</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <span>
            <b style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xl, fontWeight: 700, color: colors.price }}>{property.price}</b>
            {property.priceUnit && (
              <em style={{ fontStyle: "normal", fontSize: fontSize.xs, color: colors.muted, marginLeft: 4 }}>
                /{property.priceUnit}
              </em>
            )}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            style={{
              background: colors.primary,
              color: colors.white,
              fontWeight: 600,
              fontSize: 13.5,
              padding: "10px 16px",
              borderRadius: 10,
            }}
          >
            View Detail
          </button>
        </div>
      </div>
    </article>
  );
}
