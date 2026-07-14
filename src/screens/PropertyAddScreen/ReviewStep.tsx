"use client";

import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import type { ListingPurpose, PropertyFormState, UploadedImage } from "./shared";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div
      className="pa-review-row"
      style={{ display: "flex", justifyContent: "space-between", gap: spacing.md, padding: "11px 0" }}
    >
      <span style={{ color: colors.muted, fontSize: fontSize.sm }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: fontSize.sm, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function ReviewStep({
  typeName,
  purpose,
  form,
  images,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  typeName: string;
  purpose: ListingPurpose;
  form: PropertyFormState;
  images: UploadedImage[];
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const priceLabel = purpose === "Rent" ? "Rental price" : "Selling price";

  return (
    <div>
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

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          letterSpacing: "-0.02em",
          marginBottom: spacing.sm,
        }}
      >
        Review your listing
      </h1>
      <p style={{ fontSize: fontSize.base, color: colors.muted, marginBottom: spacing.xl - 2 }}>
        Make sure everything looks right before you publish.
      </p>

      <div
        style={{
          position: "relative",
          border: `1px solid ${colors.line}`,
          borderRadius: radius.lg,
          overflow: "hidden",
          boxShadow: "0 8px 24px -14px rgba(16,28,48,0.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
            padding: "16px 20px",
            background: purpose === "Rent" ? "rgba(14,124,138,0.1)" : colors.primarySoft,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: fontSize.xs,
              fontWeight: 700,
              color: purpose === "Rent" ? colors.price : colors.primary,
              background: colors.card,
              padding: "5px 12px",
              borderRadius: radius.full,
            }}
          >
            <Icon name="sparkle" size={12} /> {purpose === "Rent" ? "For Rent" : "For Sale"}
          </span>
          <span style={{ fontSize: fontSize.xs, fontWeight: 600, color: colors.ink2 }}>{typeName}</span>
        </div>

        {images.length > 0 ? (
          <div
            className="pa-review-photos"
            style={{ display: "flex", gap: 8, padding: "16px 20px 0", overflowX: "auto" }}
          >
            {images.map((img, i) => (
              <div
                key={img.id}
                className="pa-image-tile"
                style={{
                  position: "relative",
                  flexShrink: 0,
                  width: i === 0 ? 132 : 84,
                  height: 88,
                  borderRadius: radius.sm + 1,
                  overflow: "hidden",
                  border: `1px solid ${colors.line}`,
                  animationDelay: `${Math.min(i, 8) * 40}ms`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {i === 0 && (
                  <span
                    style={{
                      position: "absolute",
                      left: 6,
                      bottom: 6,
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: colors.white,
                      background: colors.primary,
                      padding: "3px 7px",
                      borderRadius: radius.full,
                    }}
                  >
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              margin: "16px 20px 0",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: spacing.sm + 2,
              border: `1.5px dashed ${colors.line}`,
              borderRadius: radius.md,
              color: colors.muted,
              fontSize: fontSize.xs + 0.5,
            }}
          >
            <Icon name="grid" size={16} />
            No photos added yet — listings with real photos get far more enquiries.
          </div>
        )}

        <div style={{ padding: "6px 20px 18px" }}>
          <Row label="Title" value={form.title} />
          <Row
            label={priceLabel}
            value={form.price ? `₹${Number(form.price).toLocaleString("en-IN")}${purpose === "Rent" ? " / month" : ""}` : undefined}
          />
          <Row label="Location" value={form.location?.address} />
          <Row label="City" value={[form.city, form.state, form.country].filter(Boolean).join(", ")} />
          <Row label="Bedrooms" value={form.bedrooms || undefined} />
          <Row label="Bathrooms" value={form.bathrooms} />
          <Row label="Build-up area" value={form.buildUpArea ? `${form.buildUpArea} sq ft` : undefined} />
          <Row label="Plot area" value={form.plotArea ? `${form.plotArea} sq ft` : undefined} />
          <Row label="Furnishing" value={form.furnished} />
          <Row
            label="Amenities"
            value={form.amenities.length ? form.amenities.map((a) => a.title).join(", ") : undefined}
          />
        </div>
      </div>

      {error && (
        <p style={{ fontSize: fontSize.sm, color: "#C0392B", marginTop: spacing.md }}>{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={submitting}
        className={`login-cta${!submitting ? " is-ready" : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          width: "100%",
          height: 52,
          marginTop: spacing.xl,
          borderRadius: radius.md,
          background: colors.primary,
          color: colors.white,
          fontWeight: 600,
          fontSize: fontSize.md - 1,
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Publishing…" : "Publish listing"}
        {!submitting && <Icon name="check" size={18} color={colors.white} />}
      </button>
    </div>
  );
}
