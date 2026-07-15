import type { Professional } from "@/components/ProCard";
import { categories } from "@/screens/LandingScreen/data";

export { categories };

const unsplash = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export type ProfessionalRecord = Professional & {
  category: string;
  categoryName: string;
  slug: string;
  experience: number;
  projects: number;
  responds: string;
  tags: string[];
  gallery: string[];
  about: string;
  services: string[];
};

export const professionals: ProfessionalRecord[] = [
  {
    id: "p1",
    slug: "aanya-nair-studio",
    name: "Aanya Nair Studio",
    profession: "Interior Designer",
    category: "interior",
    categoryName: "Interior Designers",
    location: "Kochi, Kerala",
    avatar: unsplash("1494790108377-be9c29b29330", 200),
    cover: unsplash("1618221195710-dd6b41faaea6", 1200),
    rating: 4.9,
    reviews: 187,
    verified: true,
    experience: 11,
    projects: 142,
    price: "₹1,200",
    priceUnit: "consultation",
    responds: "in ~2 hrs",
    tagline: "Warm, light-filled interiors rooted in Kerala craft.",
    tags: ["Residential", "Turnkey", "Modern Tropical"],
    gallery: [
      unsplash("1616486338812-3dadae4b4ace", 1000),
      unsplash("1600210492486-724fe5c67fb0", 1000),
      unsplash("1600566753086-00f18fb6b3ea", 1000),
      unsplash("1600585154340-be6161a56a0c", 1000),
    ],
    about:
      "Aanya Nair Studio is an award-winning interior practice creating calm, characterful homes across Kerala. We blend natural materials, local craftsmanship and modern function into spaces that feel personal and enduring.",
    services: ["Full Interior Design", "3D Rendering", "Space Planning", "Turnkey Execution", "Color Consulting", "Furniture Selection"],
  },
  {
    id: "p2",
    slug: "verve-architects",
    name: "Verve Architects",
    profession: "Architect",
    category: "architects",
    categoryName: "Architects",
    location: "Trivandrum, Kerala",
    avatar: unsplash("1500648767791-00dcc994a43e", 200),
    cover: unsplash("1487958449943-2429e8be8625", 1200),
    rating: 4.8,
    reviews: 96,
    verified: true,
    experience: 14,
    projects: 78,
    price: "₹0",
    priceUnit: "first visit",
    responds: "in ~3 hrs",
    tagline: "Climate-responsive homes for the tropics.",
    tags: ["Residential", "Sustainable", "New Build"],
    gallery: [
      unsplash("1600607687939-ce8a6c25118c", 1000),
      unsplash("1564013799919-ab600027ffc6", 1000),
      unsplash("1600585154340-be6161a56a0c", 1000),
      unsplash("1512917774080-9991f1c4c750", 1000),
    ],
    about:
      "Verve Architects designs climate-responsive, light-filled homes that work with Kerala's monsoon and heat. Every project starts with how you want to live, then earns its form from there.",
    services: ["Architectural Design", "Site Planning", "3D Visualization", "Permit Drawings", "Project Supervision"],
  },
  {
    id: "p3",
    slug: "buildright-contractors",
    name: "BuildRight Contractors",
    profession: "General Contractor",
    category: "contractors",
    categoryName: "General Contractors",
    location: "Kozhikode, Kerala",
    avatar: unsplash("1568602471122-7832951cc4c5", 200),
    cover: unsplash("1503387762-592deb58ef4e", 1200),
    rating: 4.7,
    reviews: 134,
    verified: true,
    experience: 18,
    projects: 210,
    price: "₹2,000",
    priceUnit: "site visit",
    responds: "in ~1 hr",
    tagline: "On-time, on-budget construction you can audit.",
    tags: ["New Build", "Renovation", "Turnkey"],
    gallery: [
      unsplash("1541888946425-d81bb19240f5", 1000),
      unsplash("1503387762-592deb58ef4e", 1000),
      unsplash("1504307651254-35680f356dfd", 1000),
      unsplash("1581094794329-c8112a89af12", 1000),
    ],
    about:
      "BuildRight delivers residential and commercial builds with transparent costing and weekly photo updates. 18 years, 200+ handovers, zero compromise on structure.",
    services: ["Full Construction", "Renovation", "Structural Work", "Project Management", "Material Procurement"],
  },
  {
    id: "p4",
    slug: "lumen-civil-engineering",
    name: "Lumen Civil Engineering",
    profession: "Civil Engineer",
    category: "civil",
    categoryName: "Civil Engineers",
    location: "Thrissur, Kerala",
    avatar: unsplash("1438761681033-6461ffad8d80", 200),
    cover: unsplash("1581094794329-c8112a89af12", 1200),
    rating: 4.9,
    reviews: 71,
    verified: true,
    experience: 9,
    projects: 64,
    price: "₹900",
    priceUnit: "consultation",
    responds: "in ~4 hrs",
    tagline: "Sound structures, certified and stress-tested.",
    tags: ["Structural", "Inspection", "Certification"],
    gallery: [
      unsplash("1621905251189-08b45d6a269e", 1000),
      unsplash("1581092160562-40aa08e78837", 1000),
      unsplash("1503387762-592deb58ef4e", 1000),
      unsplash("1541888946425-d81bb19240f5", 1000),
    ],
    about:
      "Lumen provides structural design and certification for homes and mid-rise builds, with detailed load analysis and on-site verification at every pour.",
    services: ["Structural Design", "Soil Testing", "Load Analysis", "Site Inspection", "Stability Certificate"],
  },
  {
    id: "p5",
    slug: "curato-kitchens",
    name: "Curato Kitchens",
    profession: "Kitchen & Bath Designer",
    category: "kitchenbath",
    categoryName: "Kitchen & Bath",
    location: "Kochi, Kerala",
    avatar: unsplash("1544005313-94ddf0286df2", 200),
    cover: unsplash("1556911220-bff31c812dba", 1200),
    rating: 4.8,
    reviews: 58,
    verified: true,
    experience: 7,
    projects: 49,
    price: "₹1,500",
    priceUnit: "design fee",
    responds: "in ~2 hrs",
    tagline: "Modular kitchens built for real Kerala cooking.",
    tags: ["Modular", "Renovation", "Storage"],
    gallery: [
      unsplash("1600489000022-c2086d79f9d4", 1000),
      unsplash("1600566753086-00f18fb6b3ea", 1000),
      unsplash("1556909114-f6e7ad7d3136", 1000),
      unsplash("1556911220-bff31c812dba", 1000),
    ],
    about:
      "Curato designs hard-working modular kitchens and serene bathrooms — laid out for the way you actually cook, store and move, then built to last.",
    services: ["Modular Kitchen Design", "Bath Design", "Custom Cabinetry", "Countertop Selection", "Installation"],
  },
  {
    id: "p6",
    slug: "greenscape-studio",
    name: "GreenScape Studio",
    profession: "Landscape Designer",
    category: "landscape",
    categoryName: "Landscape Designers",
    location: "Kottayam, Kerala",
    avatar: unsplash("1472099645785-5658abf4ff4e", 200),
    cover: unsplash("1558904541-efa843a96f01", 1200),
    rating: 4.9,
    reviews: 42,
    verified: true,
    experience: 8,
    projects: 53,
    price: "₹1,000",
    priceUnit: "consultation",
    responds: "in ~3 hrs",
    tagline: "Courtyards, gardens and green roofs that breathe.",
    tags: ["Garden", "Courtyard", "Sustainable"],
    gallery: [
      unsplash("1416879595882-3373a0480b5b", 1000),
      unsplash("1585320806297-9794b3e4eeae", 1000),
      unsplash("1600210492486-724fe5c67fb0", 1000),
      unsplash("1558904541-efa843a96f01", 1000),
    ],
    about:
      "GreenScape brings the outdoors into everyday life with native-planted courtyards, gardens and green roofs designed for Kerala's climate and rhythm.",
    services: ["Landscape Design", "Courtyard Planning", "Irrigation", "Green Roofs", "Maintenance Plans"],
  },
];

export const reviews: { by: string; when: string; stars: number; project: string; text: string; avatar: string }[] = [
  {
    by: "Meera S.",
    when: "2 weeks ago",
    stars: 5,
    project: "3BHK Interior, Kakkanad",
    text: "From the first moodboard to handover they were transparent and on schedule. The living room turned out better than the renders.",
    avatar: unsplash("1534528741775-53994a69daeb", 120),
  },
  {
    by: "Sanjay R.",
    when: "1 month ago",
    stars: 5,
    project: "Full Home Renovation",
    text: "Weekly updates with photos meant I never had to chase anyone. Budget held within 4%. Genuinely rare.",
    avatar: unsplash("1507003211169-0a1dd7228f2d", 120),
  },
  {
    by: "Fathima A.",
    when: "2 months ago",
    stars: 4,
    project: "Kitchen Remodel",
    text: "Beautiful work and great communication. Minor delay on countertop delivery but they kept me informed throughout.",
    avatar: unsplash("1544005313-94ddf0286df2", 120),
  },
];

export const ratingOptions = ["4.5 & up", "4.0 & up", "3.5 & up"];
export const experienceOptions = ["10+ years", "5+ years", "Any"];
export const budgetOptions = ["Free consultation", "Under ₹1,000", "₹1,000 – ₹2,000", "₹2,000+"];

export function parseProPrice(price: string): number {
  const num = parseFloat(price.replace(/[₹,\s]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

export function inBudget(price: string, bucket: string): boolean {
  const v = parseProPrice(price);
  if (bucket === "Free consultation") return v === 0;
  if (bucket === "Under ₹1,000") return v > 0 && v < 1000;
  if (bucket === "₹1,000 – ₹2,000") return v >= 1000 && v <= 2000;
  if (bucket === "₹2,000+") return v > 2000;
  return true;
}

export function minRatingFor(bucket: string): number {
  if (bucket === "4.5 & up") return 4.5;
  if (bucket === "4.0 & up") return 4.0;
  if (bucket === "3.5 & up") return 3.5;
  return 0;
}

export function minExperienceFor(bucket: string): number {
  if (bucket === "10+ years") return 10;
  if (bucket === "5+ years") return 5;
  return 0;
}
