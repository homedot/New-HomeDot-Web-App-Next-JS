import type { Metadata } from "next";
import { Suspense } from "react";
import ProfessionalBlogScreen from "@/screens/ProfessionalBlogScreen";

export const metadata: Metadata = {
  title: "My Blogs | HomeDot Professional",
  description: "Write, publish and manage your blogs as a HomeDot professional.",
};

export default function ProfessionalBlogsPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalBlogScreen />
    </Suspense>
  );
}
