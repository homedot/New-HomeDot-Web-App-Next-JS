import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalReferEarnScreen from "@/screens/ProfessionalReferEarnScreen";

export const metadata: Metadata = {
  title: "Refer & Earn | HomeDot Professional",
  description: "Share your HomeDot referral link with homeowners and fellow professionals.",
};

export default function ProfessionalReferPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalReferEarnScreen />
    </Suspense>
  );
}
