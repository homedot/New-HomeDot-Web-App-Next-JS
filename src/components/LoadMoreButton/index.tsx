"use client";

import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";

/** Centered pill button for paginated "load more" lists. Extracted from
 * ProfessionalDashboardScreen so ProfessionalEnquiriesScreen can reuse it too. */
export default function LoadMoreButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: spacing.xxl }}>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          fontWeight: 600,
          fontSize: fontSize.sm,
          color: colors.ink,
          background: colors.card,
          border: `1.5px solid ${colors.line}`,
          borderRadius: radius.full,
          padding: "12px 22px",
        }}
      >
        {loading ? "Loading…" : label}
      </button>
    </div>
  );
}
