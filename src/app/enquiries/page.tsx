import type { Metadata } from "next";
import EnquiriesScreen from "@/screens/EnquiriesScreen";

export const metadata: Metadata = {
  title: "My Enquiries | HomeDot",
  description: "Track the enquiries you've sent to HomeDot professionals, and their responses.",
};

export default function EnquiriesPage() {
  return <EnquiriesScreen />;
}
