import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalSettingsScreen from "@/screens/ProfessionalSettingsScreen";

export const metadata: Metadata = {
  title: "Settings | HomeDot Professional",
  description: "Manage your HomeDot professional account, notifications and legal preferences.",
};

export default function ProfessionalSettingsPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalSettingsScreen />
    </Suspense>
  );
}
