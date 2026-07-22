"use client";

import { spacing } from "@/utils/size";
import CardSkeleton from "@/components/CardSkeleton";

/** Grid of shimmering placeholder cards shown while a list is loading.
 * Extracted from ProfessionalDashboardScreen so ProfessionalEnquiriesScreen
 * can reuse the exact same loading state. */
export default function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3" style={{ gap: spacing.xl }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
