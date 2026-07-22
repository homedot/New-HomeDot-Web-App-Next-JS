import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalWorkfolioScreen from "@/screens/ProfessionalWorkfolioScreen";

export const metadata: Metadata = {
  title: "Workfolio | HomeDot Professional",
  description: "Showcase your completed work photos as a HomeDot professional.",
};

export default function ProfessionalWorkfolioPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalWorkfolioScreen />
    </Suspense>
  );
}
