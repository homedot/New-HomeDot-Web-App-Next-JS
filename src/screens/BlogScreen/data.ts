import type { IconName } from "@/components/Icon";
import type { BlogCategory } from "@/services/BlogScreenService";
import type { BlogCard } from "@/services/BlogScreenService";

const unsplash = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const heroImage = unsplash("1600585154340-be6161a56a0c", 1600);

// Mirrors homedot-mobile-app's fixed BlogScreen tabs (all / house / garden /
// home) — the API's keyString search only recognizes these three category
// values, so, unlike Professionals' server-driven category list, this one
// is a fixed local set rather than fetched from an endpoint.
export const categoryTabs: { id: "all" | BlogCategory; label: string; icon: IconName }[] = [
  { id: "all", label: "All stories", icon: "grid" },
  { id: "house", label: "Houses", icon: "house" },
  { id: "garden", label: "Garden", icon: "leaf" },
  { id: "home", label: "Home Design", icon: "sofa" },
];

// Shown for an instant before the first API response resolves, so the page
// never flashes empty — same pattern as LandingScreen's `blogPosts` mock.
export const fallbackPosts: BlogCard[] = [
  {
    id: "b1",
    slug: "",
    image: unsplash("1618221195710-dd6b41faaea6", 1000),
    author: "Navya Menon",
    date: "02 Jul 2026",
    title: "5 signs it's time to renovate your kitchen",
    excerpt: "Small upgrades that make a big difference — and how to budget for them without blowing your timeline.",
    fav: false,
  },
  {
    id: "b2",
    slug: "",
    image: unsplash("1503387762-592deb58ef4e", 1000),
    author: "Johncy Thomas",
    date: "18 Jun 2026",
    title: "Hiring a contractor: what to ask before you sign",
    excerpt: "The questions that separate a smooth build from a stressful one — straight from verified pros.",
    fav: false,
  },
  {
    id: "b3",
    slug: "",
    image: unsplash("1512917774080-9991f1c4c750", 1000),
    author: "HomeDot Team",
    date: "03 Jun 2026",
    title: "Inside Kerala's fastest-growing home styles",
    excerpt: "From tropical modern to courtyard villas — what buyers are asking for in 2026.",
    fav: false,
  },
  {
    id: "b4",
    slug: "",
    image: unsplash("1558904541-efa843a96f01", 1000),
    author: "HomeDot Team",
    date: "24 May 2026",
    title: "Landscaping on a budget: 8 ideas that still look premium",
    excerpt: "Low-maintenance greenery, lighting tricks and paving choices that punch above their cost.",
    fav: false,
  },
  {
    id: "b5",
    slug: "",
    image: unsplash("1556911220-bff31c812dba", 1000),
    author: "Navya Menon",
    date: "11 May 2026",
    title: "Open-plan vs. zoned: choosing a layout that fits how you live",
    excerpt: "The real trade-offs behind Kerala's most-asked-for floor plan decision.",
    fav: false,
  },
  {
    id: "b6",
    slug: "",
    image: unsplash("1449844908441-8829872d2607", 1000),
    author: "Johncy Thomas",
    date: "29 Apr 2026",
    title: "A first-timer's guide to reading an architect's floor plan",
    excerpt: "Symbols, scale and the questions worth asking before construction starts.",
    fav: false,
  },
];
