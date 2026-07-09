import type { Property } from "@/components/PropertyCard";

const unsplash = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export type MarketplaceProperty = Property & {
  purpose: "Buy" | "Rent";
  city: string;
  areaUnit?: string;
  amenities: string[];
  gallery: string[];
  desc: string;
  propertySlug?: string;
  carpetArea?: number;
  noOfFloors?: number;
  roadWidth?: number;
  maintenanceCharge?: number;
  garage?: number;
  balcony?: number;
  furnished?: string;
  listedBy?: string;
  plotArea?: number;
  length?: number;
  breadth?: number;
};

export const properties: MarketplaceProperty[] = [
  {
    id: "h1",
    status: "For Sale",
    purpose: "Buy",
    category: "Flat & Apartment",
    title: "3 BHK Apartments at Awakened Living — Modern Design with a Peaceful Lifestyle",
    location: "Vallathol Jn, Thrikkakara P.O",
    city: "Kochi",
    beds: 3,
    baths: 3,
    area: 1306,
    price: "₹76 L",
    featured: true,
    img: unsplash("1522708323590-d24dbb6b0267", 1000),
    gallery: [
      unsplash("1522708323590-d24dbb6b0267", 1200),
      unsplash("1586023492125-27b2c045efd7", 1200),
      unsplash("1556909114-f6e7ad7d3136", 1200),
      unsplash("1560448204-e02f11c3d0e2", 1200),
    ],
    desc: "Thoughtfully designed 3 BHK residences with abundant natural light, premium fittings and a calm, green setting — minutes from the metro and city conveniences.",
    amenities: ["Covered Parking", "24x7 Security", "Power Backup", "Clubhouse", "Landscaped Garden", "Gym"],
  },
  {
    id: "h2",
    status: "For Sale",
    purpose: "Buy",
    category: "Flat & Apartment",
    title: "Exclusive 4 BHK Residences in Prime Kochi Location",
    location: "Vallathol Jn, Thrikkakara P.O",
    city: "Kochi",
    beds: 4,
    baths: 4,
    area: 1972,
    price: "₹1.08 Cr",
    featured: true,
    img: unsplash("1512917774080-9991f1c4c750", 1000),
    gallery: [
      unsplash("1512917774080-9991f1c4c750", 1200),
      unsplash("1600210492486-724fe5c67fb0", 1200),
      unsplash("1600566753086-00f18fb6b3ea", 1200),
      unsplash("1556911220-bff31c812dba", 1200),
    ],
    desc: "Spacious 4 BHK homes in a secure gated community, just minutes from CUSAT Metro Station, with excellent connectivity and resort-style amenities.",
    amenities: ["Metro Connectivity", "Gated Community", "Swimming Pool", "Covered Parking", "Gym"],
  },
  {
    id: "h3",
    status: "For Sale",
    purpose: "Buy",
    category: "Flat & Apartment",
    title: "Spacious 3 BHK at Beyond Infinity — Ideal for Families",
    location: "Vallathol Jn, Thrikkakara P.O",
    city: "Kochi",
    beds: 3,
    baths: 3,
    area: 1360,
    price: "₹1.02 Cr",
    img: unsplash("1560448204-e02f11c3d0e2", 1000),
    gallery: [
      unsplash("1560448204-e02f11c3d0e2", 1200),
      unsplash("1586023492125-27b2c045efd7", 1200),
      unsplash("1556909114-f6e7ad7d3136", 1200),
      unsplash("1522708323590-d24dbb6b0267", 1200),
    ],
    desc: "Family-first 3 BHK apartments with generous living spaces, modern kitchens and a vibrant community — designed for comfortable everyday living.",
    amenities: ["Covered Parking", "24x7 Security", "Power Backup", "Garden"],
  },
  {
    id: "h4",
    status: "For Sale",
    purpose: "Buy",
    category: "Flat & Apartment",
    title: "Awakened Living — Premium Riverside Apartments",
    location: "Vallathol Jn, Thrikkakara P.O",
    city: "Kochi",
    beds: 2,
    baths: 2,
    area: 1042,
    price: "₹62 L",
    img: unsplash("1545324418-cc1a3fa10c00", 1000),
    gallery: [
      unsplash("1545324418-cc1a3fa10c00", 1200),
      unsplash("1502672260266-1c1ef2d93688", 1200),
      unsplash("1586023492125-27b2c045efd7", 1200),
      unsplash("1556909114-f6e7ad7d3136", 1200),
    ],
    desc: "Compact, efficient 2 BHK homes with a green façade and riverside views — sustainable living close to the heart of the city.",
    amenities: ["Covered Parking", "Power Backup", "24x7 Security", "Lift"],
  },
  {
    id: "h5",
    status: "For Sale",
    purpose: "Buy",
    category: "House",
    title: "Independent House for Sale — Quiet Residential Pocket",
    location: "Thiruvaniyoor",
    city: "Kochi",
    beds: 3,
    baths: 3,
    area: 1300,
    price: "₹49 L",
    img: unsplash("1568605114967-8130f3a36994", 1000),
    gallery: [
      unsplash("1568605114967-8130f3a36994", 1200),
      unsplash("1570129477492-45c003edd2be", 1200),
      unsplash("1576941089067-2de3c901e126", 1200),
      unsplash("1583608205776-bfd35f0d9f83", 1200),
    ],
    desc: "A well-built independent house on its own plot in a peaceful neighbourhood — ideal for families wanting privacy, a garden and room to grow.",
    amenities: ["Garden", "Covered Parking"],
  },
  {
    id: "h6",
    status: "For Sale",
    purpose: "Buy",
    category: "Flat & Apartment",
    title: "Prestige Hillside Gateway — Sky-View Residences",
    location: "Kakkanad",
    city: "Kochi",
    beds: 2,
    baths: 2,
    area: 1180,
    price: "₹1.23 Cr",
    featured: true,
    img: unsplash("1493809842364-78817add7ffb", 1000),
    gallery: [
      unsplash("1493809842364-78817add7ffb", 1200),
      unsplash("1600607687939-ce8a6c25118c", 1200),
      unsplash("1600566753086-00f18fb6b3ea", 1200),
      unsplash("1600210492486-724fe5c67fb0", 1200),
    ],
    desc: "Elevated living with panoramic city views, premium clubhouse and infinity pool in the heart of Kakkanad's tech corridor.",
    amenities: ["Swimming Pool", "Gym", "Gated Community", "Covered Parking"],
  },
  {
    id: "h7",
    status: "For Sale",
    purpose: "Buy",
    category: "Villa",
    title: "Luxury 4 BHK Villa with Private Courtyard",
    location: "Aluva",
    city: "Kochi",
    beds: 4,
    baths: 5,
    area: 2840,
    price: "₹2.65 Cr",
    img: unsplash("1580587771525-78b9dba3b914", 1000),
    gallery: [
      unsplash("1580587771525-78b9dba3b914", 1200),
      unsplash("1576941089067-2de3c901e126", 1200),
      unsplash("1600585154340-be6161a56a0c", 1200),
      unsplash("1583608205776-bfd35f0d9f83", 1200),
    ],
    desc: "An architect-designed villa with double-height living, a private courtyard and landscaped lawns — refined family living with generous outdoor space.",
    amenities: ["Garden", "Covered Parking", "Gated Community"],
  },
  {
    id: "h8",
    status: "For Rent",
    purpose: "Rent",
    category: "Flat & Apartment",
    title: "Furnished 2 BHK for Rent — Walk to Infopark",
    location: "Kakkanad",
    city: "Kochi",
    beds: 2,
    baths: 2,
    area: 1100,
    price: "₹28,000",
    priceUnit: "month",
    img: unsplash("1502672260266-1c1ef2d93688", 1000),
    gallery: [
      unsplash("1502672260266-1c1ef2d93688", 1200),
      unsplash("1586023492125-27b2c045efd7", 1200),
      unsplash("1556909114-f6e7ad7d3136", 1200),
      unsplash("1560448204-e02f11c3d0e2", 1200),
    ],
    desc: "Fully furnished 2 BHK with modern interiors, a few minutes' walk from Infopark — move-in ready with all essential amenities.",
    amenities: ["Covered Parking", "Power Backup", "24x7 Security", "Lift"],
  },
  {
    id: "h9",
    status: "For Sale",
    purpose: "Buy",
    category: "Plot / Land",
    title: "Residential Plot in Fast-Growing Locality",
    location: "Angamaly",
    city: "Kochi",
    beds: 0,
    baths: 0,
    area: 4356,
    areaUnit: "sqft plot",
    price: "₹38 L",
    img: unsplash("1500382017468-9049fed747ef", 1000),
    gallery: [
      unsplash("1500382017468-9049fed747ef", 1200),
      unsplash("1416879595882-3373a0480b5b", 1200),
      unsplash("1485965120184-e220f721d03e", 1200),
      unsplash("1501594907352-04cda38ebc29", 1200),
    ],
    desc: "Clear-title residential plot on a developing road with quick access to the highway and airport — a strong investment with great connectivity.",
    amenities: ["Clear Title", "Road Frontage", "Near Highway"],
  },
];

export const purposes: ("Buy" | "Rent")[] = ["Buy", "Rent"];
export const bedOptions = ["1", "2", "3", "4", "5+"];
export const bathOptions = ["1", "2", "3", "4"];
export const priceOptions = ["Under ₹50 L", "₹50 L – ₹1 Cr", "₹1 Cr – ₹2 Cr", "₹2 Cr – ₹5 Cr", "₹5 Cr+"];
export const amenityOptions = [
  "Covered Parking",
  "24x7 Security",
  "Power Backup",
  "Gym",
  "Swimming Pool",
  "Garden",
  "Lift",
  "Gated Community",
];

export function parsePrice(price: string): number {
  const s = price.replace(/[₹,\s]/g, "");
  const num = parseFloat(s);
  if (!num) return 0;
  if (/Cr/i.test(price)) return num * 1e7;
  if (/L/i.test(price)) return num * 1e5;
  return num;
}

export const budgetRanges: Record<string, [number, number]> = {
  "Under ₹50 L": [0, 5e6],
  "₹50 L – ₹1 Cr": [5e6, 1e7],
  "₹1 Cr – ₹2 Cr": [1e7, 2e7],
  "₹2 Cr – ₹5 Cr": [2e7, 5e7],
  "₹5 Cr+": [5e7, Infinity],
};

export const agent = {
  name: "Arjun Pillai",
  role: "HomeDot Verified Agent",
  rating: 4.9,
  deals: 64,
  avatar: unsplash("1560250097-0b93528c311a", 200),
};
