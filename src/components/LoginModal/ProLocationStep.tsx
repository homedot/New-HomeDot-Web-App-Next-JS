"use client";

import { useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import LocationMapPicker, {
  type LocationValue,
} from "@/components/LocationMapPicker";

export default function ProLocationStep({
  initialLocation,
  onBack,
  onContinue,
}: {
  initialLocation: LocationValue | null;
  onBack: () => void;
  onContinue: (location: LocationValue) => void;
}) {
  const [location, setLocation] = useState<LocationValue | null>(initialLocation);

  return (
    <div className="login-step">
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
        Where do you work from?
      </h1>
      <p
        style={{
          fontSize: fontSize.base,
          color: colors.muted,
          lineHeight: 1.5,
          marginBottom: spacing.xl - 2,
        }}
      >
        Search or drop a pin so homeowners nearby can find you.
      </p>

      <LocationMapPicker value={location} onChange={setLocation} height={280} />

      <button
        onClick={() => location && onContinue(location)}
        className={`login-cta${location ? " is-ready" : ""}`}
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
          opacity: location ? 1 : 0.5,
        }}
      >
        Continue <Icon name="arrow" size={18} color={colors.white} />
      </button>
    </div>
  );
}
