import LandingScreen from "@/screens/LandingScreen";
import { getLandingInitialData } from "@/screens/LandingScreen/getInitialData";

// The page is otherwise static (built once), so this data would go stale
// until the next deploy. Revalidate it in the background every 5 minutes
// (ISR) — still fetched server-side only, never from the browser.
export const revalidate = 300;

export default async function Home() {
  const initialData = await getLandingInitialData();
  return <LandingScreen initialData={initialData} />;
}
