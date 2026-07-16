import type { Metadata } from "next";
import { Suspense } from "react";
import BlogScreen from "@/screens/BlogScreen";

export const metadata: Metadata = {
  title: "Blog — Home ideas, tips & inspiration | HomeDot",
  description: "Real advice from verified professionals and the HomeDot team — kitchens, budgets, contractors, gardens and home design for every stage of your home journey.",
};

export default function BlogPage() {
  return (
    <Suspense fallback={null}>
      <BlogScreen />
    </Suspense>
  );
}
