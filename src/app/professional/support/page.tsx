import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalSupportScreen from "@/screens/ProfessionalSupportScreen";

export const metadata: Metadata = {
  title: "Support | HomeDot Professional",
  description: "Get help from the HomeDot support team.",
};

export default function ProfessionalSupportPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalSupportScreen />
    </Suspense>
  );
}
