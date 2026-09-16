import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalsScreen from "@/screens/ProfessionalsScreen";
import { getProfessionalsInitialData } from "@/screens/ProfessionalsScreen/getInitialData";

export const metadata: Metadata = {
  title: "Professionals — Verified architects, designers & contractors | HomeDot",
  description: "Search and filter manually-verified architects, interior designers, contractors and home-service professionals across Kochi with HomeDot.",
};

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requestedCategoryId =
    typeof params.category === "string" ? params.category : undefined;
  const initialData = await getProfessionalsInitialData(requestedCategoryId);
  return (
    <Suspense fallback={null}>
      <ProfessionalsScreen initialData={initialData} />
    </Suspense>
  );
}
