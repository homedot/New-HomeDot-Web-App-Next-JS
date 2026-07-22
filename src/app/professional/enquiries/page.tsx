import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalEnquiriesScreen from "@/screens/ProfessionalEnquiriesScreen";

export const metadata: Metadata = {
  title: "Enquiries | HomeDot Professional",
  description: "View and respond to every job and direct enquiry as a HomeDot professional.",
};

export default function ProfessionalEnquiriesPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalEnquiriesScreen />
    </Suspense>
  );
}
