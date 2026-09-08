import type { Metadata } from "next";
import { Suspense } from "react";
import FavoritesScreen from "@/screens/FavoritesScreen";

export const metadata: Metadata = {
  title: "Your favorites | HomeDot",
  description: "Properties you've saved for later on HomeDot.",
};

export default function FavoritesPage() {
  return (
    <Suspense fallback={null}>
      <FavoritesScreen />
    </Suspense>
  );
}
