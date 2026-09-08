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

export const propertyCategories: { id: string; name: string; icon: IconName; count: number }[] = [
  { id: "villa", name: "Villa", icon: "villa", count: 420 },
  { id: "house", name: "House", icon: "house", count: 980 },
  { id: "flat-apartment", name: "Flat & Apartment", icon: "apartment", count: 2150 },
  { id: "plot", name: "Plot", icon: "plot", count: 640 },
  { id: "office", name: "Office Space", icon: "office", count: 310 },
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

// Each `text` leads with a self-contained "[Stage] is the stage where…"
// definition — deliberately consistent across all 11 so any single card can
// be lifted out of context as a standalone answer. This is written for AEO
// (Answer Engine Optimization, e.g. Google's featured snippets/AI Overviews)
// and GEO (Generative Engine Optimization, e.g. ChatGPT/Perplexity citing the
// page): both favour clear, specific, extractable definitions over marketing
// copy that only makes sense read in sequence. See the HowTo JSON-LD emitted
// alongside this data in ConstructionStages for the same content exposed as
// structured data.
export const constructionStages: { id: string; n: string; title: string; icon: IconName; image: string; text: string }[] = [
  { id: "planning", n: "01", title: "Planning", icon: "compass", image: unsplash("1454165804606-c3d57bc86b40", 800), text: "Planning is the first stage of home construction: a site survey, architectural design, budgeting and municipal approvals are all finalised before any work starts." },
  { id: "foundation", n: "02", title: "Foundation", icon: "foundation", image: unsplash("1541888946425-d81bb19240f5", 800), text: "Foundation is the stage where the site is excavated and RCC (reinforced concrete) footings are cast, sized to the soil and load conditions found during the site survey." },
  { id: "structure", n: "03", title: "Structure", icon: "structure", image: unsplash("1587582423116-ec07293f0395", 800), text: "Structure is the stage where RCC columns, beams and floor slabs are cast level by level, forming the skeleton that carries every floor above it." },
  { id: "brickwork", n: "04", title: "Brick Work", icon: "brick", image: unsplash("1704005445445-2747074be8ac", 800), text: "Brick Work is the stage where masons lay brick or block walls course by course inside the structural frame, shaping every room and door or window opening." },
  { id: "plastering", n: "05", title: "Plastering", icon: "trowel", image: unsplash("1779971685817-77e596abd71a", 800), text: "Plastering is the stage where cement or gypsum plaster is applied to interior and exterior walls, creating the smooth surface that wiring, tiling and paint go on next." },
  { id: "electrical", n: "06", title: "Electrical", icon: "bolt", image: unsplash("1621905251189-08b45d6a269e", 800), text: "Electrical is the stage where wiring, conduits and switchboards are routed through the walls and slabs — it has to happen before flooring and painting close up the surfaces." },
  { id: "plumbing", n: "07", title: "Plumbing", icon: "drop", image: unsplash("1695002817411-203c7f19dfa3", 800), text: "Plumbing is the stage where water supply lines, drainage pipes and fittings are laid to code, then pressure-tested and sealed before the floor goes over them." },
  { id: "flooring", n: "08", title: "Flooring", icon: "grid", image: unsplash("1560185008-b033106af5c3", 800), text: "Flooring is the stage where tiles, wood or stone are laid room by room over the completed plumbing and electrical work, then levelled and finished." },
  { id: "painting", n: "09", title: "Painting", icon: "brush", image: unsplash("1516962080544-eac695c93791", 800), text: "Painting is the stage where primer and finish coats are applied to every interior and exterior wall, in the colours and finish chosen during planning." },
  { id: "interior", n: "10", title: "Interior", icon: "sofa", image: unsplash("1583847268964-b28dc8f51f92", 800), text: "Interior is the stage where modular kitchens, wardrobes, lighting and furnishing are fitted, turning the finished shell into a livable home." },
  { id: "handover", n: "11", title: "Handover", icon: "key", image: unsplash("1560518883-ce09059eeffa", 800), text: "Handover is the final stage: a joint walkthrough with the builder, a snag list of any defects to fix, then the keys and completion documents are handed to the owner." },
];

export const heroImage = unsplash("1600585154340-be6161a56a0c", 1200);
export const trustImage = unsplash("1600585154340-be6161a56a0c", 900);
export const exploreImage = unsplash("1580587771525-78b9dba3b914", 1800);

// slug is "" for these fallback cards (shown only for an instant before the
// first /data/home response resolves) — BlogCard/LatestInsights skip the
// link wrapper when slug is empty, so they render as inert placeholders
// rather than dead links.
export const blogPosts: { id: string; slug: string; image: string; author: string; date: string; title: string; excerpt: string }[] = [
  {
    id: "b1",
    slug: "",
    image: unsplash("1618221195710-dd6b41faaea6", 800),
    author: "Navya Menon",
    date: "02 Jul 2026",
    title: "5 signs it's time to renovate your kitchen",
    excerpt: "Small upgrades that make a big difference — and how to budget for them without blowing your timeline.",
  },
  {
    id: "b2",
    slug: "",
    image: unsplash("1503387762-592deb58ef4e", 800),
    author: "Johncy Thomas",
    date: "18 Jun 2026",
    title: "Hiring a contractor: what to ask before you sign",
    excerpt: "The questions that separate a smooth build from a stressful one — straight from verified pros.",
  },
  {
    id: "b3",
    slug: "",
    image: unsplash("1512917774080-9991f1c4c750", 800),
    author: "HomeDot Team",
    date: "03 Jun 2026",
    title: "Inside Kerala's fastest-growing home styles",
    excerpt: "From tropical modern to courtyard villas — what buyers are asking for in 2026.",
  },
];

export const testimonials: { id: string; quote: string; author: string; role: string; avatar: string; rating: number }[] = [
  {
    id: "t1",
    quote: "Found our architect within a week and the whole build stayed on budget. HomeDot's verification actually means something.",
    author: "Anjali Pillai",
    role: "Homeowner, Kochi",
    avatar: unsplash("1494790108377-be9c29b29330", 200),
    rating: 5,
  },
  {
    id: "t2",
    quote: "As a contractor, HomeDot brings me serious leads, not tyre-kickers. Best platform I've used in years.",
    author: "Rejith Kumar",
    role: "General Contractor",
    avatar: unsplash("1568602471122-7832951cc4c5", 200),
    rating: 5,
  },
  {
    id: "t3",
    quote: "The chat and quote tools saved us weeks of back-and-forth with interior designers. Genuinely useful.",
    author: "Meera Nair",
    role: "Homeowner, Thrissur",
    avatar: unsplash("1500648767791-00dcc994a43e", 200),
    rating: 4,
  },
];
