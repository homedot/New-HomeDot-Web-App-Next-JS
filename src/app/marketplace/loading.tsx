import type { CSSProperties } from "react";
import { spacing, radius, maxWidth } from "@/utils/size";
import { colors } from "@/constants/colors";
import SiteNav from "@/components/SiteNav";
import AmbientBackground from "@/components/AmbientBackground";
import CardSkeleton from "@/components/CardSkeleton";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

// Shown instantly on navigation (and prefetched once the "Realty" nav link
// is in view) while page.tsx's server-side data fetch is still in flight —
// mirrors MarketplaceScreen's real layout (hero, search bar, filter
// sidebar, card grid) so the swap to real content doesn't jolt the page.
export default function MarketplaceLoading() {
  return (
    <div style={{ background: colors.bg, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <SiteNav />

      <section style={{ ...wrap, paddingTop: spacing.xl }}>
        <div
          className="skeleton-shimmer"
          style={{
            borderRadius: radius.lg,
            height: "clamp(180px, 22vw, 260px)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm + 2,
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.lg,
            padding: spacing.sm + 2,
            margin: "-30px auto 0",
            position: "relative",
            zIndex: 2,
            width: "calc(100% - 40px)",
            flexWrap: "wrap",
          }}
        >
          <div
            className="skeleton-shimmer"
            style={{
              height: 50,
              borderRadius: 12,
              flex: "1.4 1 220px",
              minWidth: 220,
            }}
          />
          <div
            className="skeleton-shimmer"
            style={{ height: 50, width: 180, borderRadius: 12, flexShrink: 0 }}
          />
        </div>
      </section>

      <section style={{ ...wrap, paddingTop: spacing.xxl + 6 }}>
        <div
          className="grid grid-cols-1 lg:grid-cols-[262px_1fr]"
          style={{ gap: spacing.xxl, alignItems: "start" }}
        >
          <aside
            className="hidden lg:block"
            style={{
              borderRadius: radius.md,
              border: `1px solid ${colors.line}`,
              padding: spacing.lg,
              display: "flex",
              flexDirection: "column",
              gap: spacing.md,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer"
                style={{
                  height: 14,
                  width: `${70 - (i % 3) * 12}%`,
                  borderRadius: 6,
                }}
              />
            ))}
          </aside>

          <main>
            <div
              className="skeleton-shimmer"
              style={{
                height: 28,
                width: "40%",
                borderRadius: 6,
                marginBottom: spacing.md,
              }}
            />
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              style={{ gap: spacing.xl }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
