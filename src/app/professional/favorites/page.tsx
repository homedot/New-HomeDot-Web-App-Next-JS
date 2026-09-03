import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalFavoritesScreen from "@/screens/ProfessionalFavoritesScreen";

export const metadata: Metadata = {
  title: "Favourites | HomeDot Professional",
  description: "Blogs you've favourited as a HomeDot professional.",
};

export default function ProfessionalFavoritesPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalFavoritesScreen />
    </Suspense>
  );
}
