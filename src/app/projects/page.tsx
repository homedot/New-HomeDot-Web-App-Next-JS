import type { Metadata } from "next";
import { Suspense } from "react";
import ProjectsScreen from "@/screens/ProjectsScreen";

export const metadata: Metadata = {
  title: "My Projects | HomeDot",
  description: "Track the home projects you've started with HomeDot professionals.",
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsScreen />
    </Suspense>
  );
}
