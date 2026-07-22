import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalProfileScreen from "@/screens/ProfessionalProfileScreen";

export const metadata: Metadata = {
  title: "Professional Profile | HomeDot",
  description: "View and edit your professional profile, skills and business details on HomeDot.",
};

export default function ProfessionalProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalProfileScreen />
    </Suspense>
  );
}
