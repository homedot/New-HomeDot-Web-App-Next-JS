"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import LandingScreenService, {
  toServiceCategoryCard,
  type ServiceCategoryCard,
} from "@/services/LandingScreenService";

// Footer real estate is tight, so this caps the list rather than dumping
// every category the API returns (mirrors LandingScreen's Categories grid,
// which has room to show all of them).
const MAX_LINKS = 6;

// Placeholder shown until the real categories load (same idea as
// LandingScreen's Categories() — see `loaded` below). Kept as a small local
// copy rather than importing LandingScreen's mock data module, which pulls
// in that screen's much larger property/professional/blog fixtures and
// would bloat every page's bundle just for the footer.
const FALLBACK_CATEGORIES: ServiceCategoryCard[] = [
  { id: "architects", name: "Architects", icon: "compass", count: 0 },
  { id: "interior", name: "Interior Designers", icon: "sofa", count: 0 },
  { id: "contractors", name: "General Contractors", icon: "hardhat", count: 0 },
  { id: "civil", name: "Civil Engineers", icon: "ruler", count: 0 },
  { id: "kitchenbath", name: "Kitchen & Bath", icon: "chef", count: 0 },
  { id: "landscape", name: "Landscape Designers", icon: "leaf", count: 0 },
];

/** "For Professionals" footer column: real service categories (Interior
 * Designers, Architects, Contractors, Engineers, ...) that deep-link into
 * ProfessionalsScreen pre-filtered to that category. Categories are fetched
 * at runtime (there's no static id to hardcode — see SiteFooter's COLS
 * comment), so this is a small client island rather than part of the
 * server-rendered COLS list the rest of the footer uses. */
export default function ServiceCategoryLinks({ linkStyle }: { linkStyle: CSSProperties }) {
  const [items, setItems] = useState<ServiceCategoryCard[]>(FALLBACK_CATEGORIES);
  // Mirrors LandingScreen's Categories(): only link with real API ids —
  // ProfessionalsScreen ignores a "?category=" value that doesn't match one
  // of its own API-sourced options, so a card must not link with the mock's
  // placeholder slugs (e.g. "architects").
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    LandingScreenService.getServiceCategories().then((res) => {
      if (res.success && res.data?.status && res.data.data.length > 0) {
        setItems(res.data.data.map(toServiceCategoryCard));
        setLoaded(true);
      }
    });
  }, []);

  return (
    <>
      {items.slice(0, MAX_LINKS).map((c) => (
        <Link
          key={c.id}
          href={loaded ? `/professionals?category=${encodeURIComponent(c.id)}` : "/professionals"}
          style={linkStyle}
        >
          {c.name}
        </Link>
      ))}
    </>
  );
}
