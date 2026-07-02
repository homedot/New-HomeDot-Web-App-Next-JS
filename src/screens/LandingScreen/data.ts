import type { IconName } from "@/components/Icon";
import type { Property } from "@/components/PropertyCard";
import type { Professional } from "@/components/ProCard";

const unsplash = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const categories: { id: string; name: string; icon: IconName; count: number }[] = [
  { id: "architects", name: "Architects", icon: "compass", count: 1240 },
  { id: "interior", name: "Interior Designers", icon: "sofa", count: 2110 },
  { id: "contractors", name: "General Contractors", icon: "hardhat", count: 1890 },
  { id: "civil", name: "Civil Engineers", icon: "ruler", count: 980 },
  { id: "kitchenbath", name: "Kitchen & Bath", icon: "chef", count: 760 },
  { id: "landscape", name: "Landscape Designers", icon: "leaf", count: 540 },
  { id: "3d", name: "3D Visualizers", icon: "cube", count: 430 },
  { id: "structural", name: "Structural Engineers", icon: "ruler", count: 610 },
];

export const homeServices: { id: string; name: string; icon: IconName; count: number }[] = [
  { id: "plumbers", name: "Plumbers", icon: "drop", count: 3200 },
  { id: "electricians", name: "Electricians", icon: "bolt", count: 2950 },
  { id: "carpenters", name: "Carpenters", icon: "saw", count: 1840 },
  { id: "painters", name: "Painters", icon: "brush", count: 2210 },
  { id: "cleaning", name: "Home Cleaning", icon: "spray", count: 2480 },
  { id: "masons", name: "Masons", icon: "hardhat", count: 890 },
];

export const properties: Property[] = [
  {
    id: "h1",
    status: "For Sale",
    category: "Flat & Apartment",
    title: "3 BHK Apartments at Awakened Living — Modern Design with a Peaceful Lifestyle",
    location: "Vallathol Jn, Thrikkakara, Kochi",
    beds: 3,
    baths: 3,
    area: 1306,
    price: "₹76 L",
    featured: true,
    img: unsplash("1522708323590-d24dbb6b0267", 1000),
  },
  {
    id: "h2",
    status: "For Sale",
    category: "Flat & Apartment",
    title: "Exclusive 4 BHK Residences in Prime Kochi Location",
    location: "Vallathol Jn, Thrikkakara, Kochi",
    beds: 4,
    baths: 4,
    area: 1972,
    price: "₹1.08 Cr",
    featured: true,
    img: unsplash("1512917774080-9991f1c4c750", 1000),
  },
  {
    id: "h3",
    status: "For Sale",
    category: "Villa",
    title: "Luxury 4 BHK Villa with Private Courtyard",
    location: "Aluva, Kochi",
    beds: 4,
    baths: 5,
    area: 2840,
    price: "₹2.65 Cr",
    img: unsplash("1580587771525-78b9dba3b914", 1000),
  },
];

export const professionals: Professional[] = [
  {
    id: "p1",
    name: "Aanya Nair Studio",
    profession: "Interior Designer",
    location: "Kochi, Kerala",
    avatar: unsplash("1494790108377-be9c29b29330", 200),
    cover: unsplash("1618221195710-dd6b41faaea6", 1200),
    rating: 4.9,
    reviews: 187,
    verified: true,
    price: "₹1,200",
    priceUnit: "consultation",
    tagline: "Warm, light-filled interiors rooted in Kerala craft.",
  },
  {
    id: "p2",
    name: "Verve Architects",
    profession: "Architect",
    location: "Trivandrum, Kerala",
    avatar: unsplash("1500648767791-00dcc994a43e", 200),
    cover: unsplash("1487958449943-2429e8be8625", 1200),
    rating: 4.8,
    reviews: 96,
    verified: true,
    price: "₹0",
    priceUnit: "first visit",
    tagline: "Climate-responsive homes for the tropics.",
  },
  {
    id: "p3",
    name: "BuildRight Contractors",
    profession: "General Contractor",
    location: "Kozhikode, Kerala",
    avatar: unsplash("1568602471122-7832951cc4c5", 200),
    cover: unsplash("1503387762-592deb58ef4e", 1200),
    rating: 4.7,
    reviews: 134,
    verified: true,
    price: "₹2,000",
    priceUnit: "site visit",
    tagline: "On-time, on-budget construction you can audit.",
  },
];

export const steps: { n: string; title: string; text: string }[] = [
  { n: "01", title: "Tell us what you need", text: "Describe your project or service in a minute — location, scope and timeline." },
  { n: "02", title: "Get matched & compare", text: "See manually-verified professionals near you, with real portfolios and reviews." },
  { n: "03", title: "Book with confidence", text: "Chat, request a quote and schedule a visit. Track everything in one place." },
];

export const heroImage = unsplash("1600585154340-be6161a56a0c", 1200);
export const trustImage = unsplash("1600585154340-be6161a56a0c", 900);
