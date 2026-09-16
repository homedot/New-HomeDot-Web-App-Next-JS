import type { Metadata } from "next";
import { Suspense } from "react";
import BlogScreen from "@/screens/BlogScreen";
import { getBlogInitialData } from "@/screens/BlogScreen/getInitialData";

export const metadata: Metadata = {
  title: "Blog — Home ideas, tips & inspiration | HomeDot",
  description: "Real advice from verified professionals and the HomeDot team — kitchens, budgets, contractors, gardens and home design for every stage of your home journey.",
};

// Otherwise-static page, so refresh this in the background every 5 minutes
// (ISR) rather than only on redeploy — still fetched server-side only.
export const revalidate = 300;

export default async function BlogPage() {
  const initialData = await getBlogInitialData();
  return (
    <Suspense fallback={null}>
      <BlogScreen initialData={initialData} />
    </Suspense>
  );
}
