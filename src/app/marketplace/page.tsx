import type { Metadata } from "next";
import { Suspense } from "react";
import MarketplaceScreen from "@/screens/MarketplaceScreen";

export const metadata: Metadata = {
  title: "Marketplace — Buy, rent & discover homes | HomeDot",
  description: "Browse verified properties, villas, plots and rentals across Kochi with HomeDot's marketplace.",
};

export default function MarketplacePage() {
  return (
    <Suspense fallback={null}>
      <MarketplaceScreen />
    </Suspense>
  );
}
