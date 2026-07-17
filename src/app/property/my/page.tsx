import type { Metadata } from "next";
import { Suspense } from "react";
import MyPropertyScreen from "@/screens/MyPropertyScreen";

export const metadata: Metadata = {
  title: "My Property | HomeDot",
  description: "Manage the property listings you've posted on HomeDot.",
};

export default function MyPropertyPage() {
  return (
    <Suspense fallback={null}>
      <MyPropertyScreen />
    </Suspense>
  );
}
