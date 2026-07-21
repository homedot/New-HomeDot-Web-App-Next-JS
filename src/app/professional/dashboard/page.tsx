import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalDashboardScreen from "@/screens/ProfessionalDashboardScreen";

export const metadata: Metadata = {
  title: "Professional Dashboard | HomeDot",
  description: "Manage your enquiries and projects as a HomeDot professional.",
};

export default function ProfessionalDashboardPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalDashboardScreen />
    </Suspense>
  );
}
