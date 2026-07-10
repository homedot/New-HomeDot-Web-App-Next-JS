import type { Metadata } from "next";
import PropertyAddScreen from "@/screens/PropertyAddScreen";

export const metadata: Metadata = {
  title: "List your property | HomeDot",
  description: "Add your villa, flat, plot or office space to HomeDot's marketplace.",
};

export default function PropertyAddPage() {
  return <PropertyAddScreen />;
}
