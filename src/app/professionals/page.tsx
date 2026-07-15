import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalsScreen from "@/screens/ProfessionalsScreen";

export const metadata: Metadata = {
  title: "Professionals — Verified architects, designers & contractors | HomeDot",
  description: "Search and filter manually-verified architects, interior designers, contractors and home-service professionals across Kochi with HomeDot.",
};

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalsScreen />
    </Suspense>
  );
}
