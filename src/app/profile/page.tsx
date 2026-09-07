import type { Metadata } from "next";
import { Suspense } from "react";
import ProfileScreen from "@/screens/ProfileScreen";

export const metadata: Metadata = {
  title: "Your profile | HomeDot",
  description: "Manage your HomeDot profile — name, photo, and location.",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileScreen />
    </Suspense>
  );
}
