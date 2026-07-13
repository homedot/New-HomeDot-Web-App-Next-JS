"use client";

import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import type { PropertyFormState } from "./shared";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: spacing.md }}>
      <span style={{ color: colors.muted, fontSize: fontSize.sm }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: fontSize.sm, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function ReviewStep({
  typeName,
  form,
  imageCount,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  typeName: string;
  form: PropertyFormState;
  imageCount: number;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
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
          border: `1px solid ${colors.line}`,
          borderRadius: radius.md,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm + 2,
        }}
      >
        <Row label="Type" value={typeName} />
        <Row label="Title" value={form.title} />
        <Row label="Price" value={form.price ? `₹${Number(form.price).toLocaleString("en-IN")}` : undefined} />
        <Row label="Location" value={form.location?.address} />
        <Row label="City" value={[form.city, form.state, form.country].filter(Boolean).join(", ")} />
        <Row label="Bedrooms" value={form.bedrooms ? `${form.bedrooms} BHK` : undefined} />
        <Row label="Bathrooms" value={form.bathrooms} />
        <Row label="Build-up area" value={form.buildUpArea ? `${form.buildUpArea} sq ft` : undefined} />
        <Row label="Plot area" value={form.plotArea ? `${form.plotArea} sq ft` : undefined} />
        <Row label="Furnishing" value={form.furnished} />
        <Row label="Amenities" value={form.amenities.length ? form.amenities.join(", ") : undefined} />
        <Row label="Photos" value={imageCount ? `${imageCount} uploaded` : "None added"} />
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
