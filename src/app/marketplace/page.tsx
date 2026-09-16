import type { Metadata } from "next";
import { Suspense } from "react";
import MarketplaceScreen from "@/screens/MarketplaceScreen";
import { getMarketplaceInitialData } from "@/screens/MarketplaceScreen/getInitialData";

export const metadata: Metadata = {
  title: "Reality — Buy, rent & discover homes | HomeDot",
  description: "Browse verified properties, villas, plots and rentals across Kochi with HomeDot's Reality.",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requestedPropertyTypeId =
    typeof params.propertyType === "string" ? params.propertyType : undefined;
  const requestedPropertySlug =
    typeof params.property === "string" ? params.property : undefined;
  const initialData = await getMarketplaceInitialData(
    requestedPropertyTypeId,
    requestedPropertySlug,
  );
  return (
    <Suspense fallback={null}>
      <MarketplaceScreen initialData={initialData} />
    </Suspense>
  );
}
