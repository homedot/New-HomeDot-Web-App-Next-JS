"use client";

import { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import MarketplaceScreenService, { type PropertyTypeRecord } from "@/services/MarketplaceScreenService";
import { KIND_ICON, resolveKind } from "./shared";

export default function TypeStep({
  onBack,
  onSelect,
}: {
  onBack?: () => void;
  onSelect: (type: PropertyTypeRecord) => void;
}) {
  const [types, setTypes] = useState<PropertyTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    MarketplaceScreenService.getPropertyTypes().then((res) => {
      setLoading(false);
      if (res.success && res.data?.status) {
        setTypes(res.data.data);
      } else {
        setError(res.message || "Couldn't load property types. Please try again.");
      }
    });
  }, []);

  return (
    <div>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: fontSize.sm + 0.5,
            fontWeight: 600,
            color: colors.muted,
            marginBottom: spacing.lg,
          }}
        >
          <Icon name="arrowLeft" size={17} /> Back
        </button>
      )}

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          letterSpacing: "-0.02em",
          marginBottom: spacing.sm,
        }}
      >
        What are you listing?
      </h1>
      <p style={{ fontSize: fontSize.base, color: colors.muted, marginBottom: spacing.xl }}>
        Pick the property type that best matches your listing.
      </p>

      {loading && (
        <p style={{ color: colors.muted, fontSize: fontSize.base }}>Loading property types…</p>
      )}
      {error && (
        <p style={{ color: "#C0392B", fontSize: fontSize.base }}>{error}</p>
      )}

      {!loading && !error && (
        <Reveal
          stagger
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: spacing.md }}
        >
          {types.map((t) => (
            <button
              key={t._id}
              onClick={() => onSelect(t)}
              className="card-hover"
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.md,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.md,
                padding: "16px 18px",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: colors.primarySoft,
                  color: colors.primary,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={KIND_ICON[resolveKind(t.propertyType)]} size={22} />
              </span>
              <span>
                <b style={{ display: "block", fontSize: fontSize.md - 1, fontWeight: 600 }}>
                  {t.propertyType}
                </b>
                {typeof t.propertyCount === "number" && (
                  <em style={{ fontStyle: "normal", fontSize: fontSize.xs, color: colors.muted }}>
                    {t.propertyCount.toLocaleString()} listed
                  </em>
                )}
              </span>
            </button>
          ))}
        </Reveal>
      )}
    </div>
  );
}
