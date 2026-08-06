import type { Metadata } from "next";
import PrivacyPolicyScreen from "@/screens/PrivacyPolicyScreen";

export const metadata: Metadata = {
  title: "Privacy Policy | HomeDot",
  description: "Learn how HomeDot collects, uses and protects your personal information.",
};

export default function PrivacyPage() {
  return <PrivacyPolicyScreen />;
}
