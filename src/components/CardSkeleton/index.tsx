import { colors } from "@/constants/colors";
import { radius, shadow, spacing } from "@/utils/size";

/** Shimmering placeholder card shown in a listing grid while its first real
 * API response is still loading — takes the place of PropertyCard/ProCard so
 * a page never flashes mock data before swapping it for the real thing. */
export default function CardSkeleton() {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        boxShadow: shadow.sm,
      }}
      aria-hidden="true"
    >
      <div className="skeleton-shimmer" style={{ aspectRatio: "16/11" }} />
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: spacing.sm + 2 }}>
        <div className="skeleton-shimmer" style={{ height: 12, width: "38%", borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ height: 16, width: "88%", borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ height: 16, width: "62%", borderRadius: 6 }} />
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
          <div className="skeleton-shimmer" style={{ height: 20, width: 76, borderRadius: 6 }} />
          <div className="skeleton-shimmer" style={{ height: 20, width: 54, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}
