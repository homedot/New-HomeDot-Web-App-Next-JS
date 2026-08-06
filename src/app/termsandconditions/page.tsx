import type { Metadata } from "next";
import TermsScreen from "@/screens/TermsScreen";

export const metadata: Metadata = {
  title: "Terms & Conditions | HomeDot",
  description: "The terms and conditions governing your use of HomeDot's website and mobile application.",
};

export default function TermsAndConditionsPage() {
  return <TermsScreen />;
}
