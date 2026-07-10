import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";
import type { Professional } from "@/components/ProCard";
import type { IconName } from "@/components/Icon";

export interface FeaturedProperty {
  id: string;
  title: string;
  price: number;
  image: string;
}

export interface ServiceCategoryCard {
  id: string;
  name: string;
  icon: IconName;
  count: number;
}

export interface ServiceCategoryRecord {
  _id: string;
  categoryName: string;
  categorySlug: string;
  categoryDescription?: string;
  categoryImg?: string;
  professionalsCount: number;
}

export interface ServiceCategoriesBody {
  status: boolean;
  message: string;
  data: ServiceCategoryRecord[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating: number;
}

export interface ReviewAuthorRecord {
  name?: string;
  profileImage?: string;
}

// The API returns two shapes under the same endpoint: real in-app ratings
// (authorType "user", name/photo under authorData) and admin-curated
// testimonials (authorType "admin", name/photo under customer/customerImage).
export interface ReviewRecord {
  _id: string;
  authorType: string;
  rating: number;
  reviews: string;
  deleted?: boolean;
  customer?: string;
  customerImage?: string;
  authorData?: ReviewAuthorRecord[];
}

export interface ReviewsBody {
  status: boolean;
  message: string;
  data: ReviewRecord[];
}

export interface FeaturedProfessionalInfo {
  professionalCategoryName: string;
  subCategoryName: string | null;
  professionalType: string;
  experience: number;
  description: string;
  verified: boolean;
  squareFeetRate?: number;
  workingArea?: string;
}

export interface FeaturedProfessionalRecord {
  name: string;
  location?: string;
  city?: string;
  profileImage?: string;
  inviteId: string;
  professionalInfo: FeaturedProfessionalInfo[];
  averageRating: number | null;
  ratingCount: number;
}

export interface FeaturedProfessionalsBody {
  status: boolean;
  message: string;
  data: FeaturedProfessionalRecord[];
}

export interface BlogPost {
  id: string;
  image: string;
  author: string;
  date: string;
  title: string;
  excerpt: string;
}

export interface StoryAuthorRecord {
  name?: string;
}

export interface StoryRecord {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  blogImage?: string;
  publishDate?: string;
  authorData?: StoryAuthorRecord[];
}

export interface HomeDataEntry {
  stories: StoryRecord[];
}

export interface HomeDataBody {
  status: boolean;
  message: string;
  data: HomeDataEntry[];
}

// All Landing screen API calls live here. The screen only ever imports
// this file — never ApiService or fetch directly.
export const LandingScreenService = {
  getFeaturedProperties: (): Promise<ApiResponse<FeaturedProperty[]>> =>
    ApiService.get<FeaturedProperty[]>(
      API_ENDPOINTS.LANDING.FEATURED_PROPERTIES,
    ),

  // Guest-accessible — no auth required. Note: mobile calls this with POST
  // and no body.
  getServiceCategories: (): Promise<ApiResponse<ServiceCategoriesBody>> =>
    ApiService.post<ServiceCategoriesBody>(API_ENDPOINTS.COMMON.CATEGORY_LIST),

  // Guest-accessible — no auth required.
  getFeaturedProfessionals: (): Promise<ApiResponse<FeaturedProfessionalsBody>> =>
    ApiService.get<FeaturedProfessionalsBody>(
      API_ENDPOINTS.DATA.FEATURED_PROFESSIONALS,
    ),

  // Guest-accessible — no auth required.
  getReviews: (): Promise<ApiResponse<ReviewsBody>> =>
    ApiService.get<ReviewsBody>(API_ENDPOINTS.REVIEW.GET_REVIEWS),

  // Guest-accessible — no auth required.
  getHomeData: (): Promise<ApiResponse<HomeDataBody>> =>
    ApiService.get<HomeDataBody>(API_ENDPOINTS.DATA.HOME),
};

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// Maps a raw /data/get-featured-professionals record onto the ProCard shape.
// No profileImage → leave avatar/cover undefined; ProCard renders a neutral
// initials/icon placeholder instead of a misleading stock photo.
export function toProCardProfessional(record: FeaturedProfessionalRecord): Professional {
  const info = record.professionalInfo?.[0];
  const rate = info?.squareFeetRate;
  return {
    id: record.inviteId,
    name: record.name.trim(),
    profession: info?.subCategoryName || info?.professionalCategoryName || "Professional",
    location: record.location?.trim() || record.city || "Kerala, India",
    avatar: record.profileImage || undefined,
    cover: record.profileImage || undefined,
    rating: record.averageRating ?? 0,
    reviews: record.ratingCount ?? 0,
    verified: info?.verified ?? true,
    price: rate ? `₹${rate}` : "Contact",
    priceUnit: rate ? "sq.ft" : "for pricing",
    tagline: info?.description ? truncate(info.description, 110) : "",
  };
}

function toTestimonial(record: ReviewRecord): Testimonial {
  const isCurated = record.authorType === "admin";
  const author = (isCurated ? record.customer : record.authorData?.[0]?.name) || "HomeDot user";
  const avatar = isCurated ? record.customerImage : record.authorData?.[0]?.profileImage;
  return {
    id: record._id,
    quote: truncate(record.reviews || "", 220),
    author,
    role: "HomeDot customer",
    avatar: avatar || undefined,
    rating: record.rating ?? 5,
  };
}

// Picks the best `count` reviews for the landing page: drops low ratings and
// empty/filler text, favors longer (more substantive) quotes, and dedupes by
// author so the same tester's one-word ratings don't crowd out real quotes.
export function pickTestimonials(records: ReviewRecord[], count = 3): Testimonial[] {
  const seenAuthors = new Set<string>();
  return records
    .filter((r) => !r.deleted && r.rating >= 4 && r.reviews?.trim().replace(/\.+/g, "").length)
    .sort((a, b) => b.reviews.trim().length - a.reviews.trim().length)
    .filter((r) => {
      const key = ((r.authorType === "admin" ? r.customer : r.authorData?.[0]?.name) || r._id).toLowerCase();
      if (seenAuthors.has(key)) return false;
      seenAuthors.add(key);
      return true;
    })
    .slice(0, count)
    .map(toTestimonial);
}

const FALLBACK_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80";

function formatBlogDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Maps a raw /data/home `stories[]` record onto the blog card shape.
export function toBlogPost(record: StoryRecord): BlogPost {
  return {
    id: record._id,
    image: record.blogImage || FALLBACK_BLOG_IMAGE,
    author: record.authorData?.[0]?.name?.trim() || "HomeDot",
    date: formatBlogDate(record.publishDate),
    title: record.title.trim(),
    excerpt: record.description ? truncate(record.description, 140) : "",
  };
}

// The category API returns a photo, not an icon token — pick the closest
// existing icon by keyword so cards keep the site's established look.
function iconForCategory(name: string): IconName {
  const n = name.toLowerCase();
  if (n.includes("interior")) return "sofa";
  if (n.includes("architect")) return "compass";
  if (n.includes("engineer")) return "ruler";
  if (n.includes("vaastu") || n.includes("vastu")) return "compass";
  if (n.includes("contractor")) return "hardhat";
  if (n.includes("landscap")) return "leaf";
  if (n.includes("electric") || n.includes("automation")) return "bolt";
  if (n.includes("carpentry") || n.includes("carpenter")) return "saw";
  if (n.includes("plumb")) return "drop";
  if (n.includes("paint")) return "brush";
  if (n.includes("clean")) return "spray";
  if (n.includes("legal")) return "shield";
  if (n.includes("financ")) return "sparkle";
  if (n.includes("household") || n.includes("maintenance")) return "house";
  if (n.includes("product")) return "cube";
  return "grid";
}

// Maps a raw /common/category-list record onto the category card shape.
export function toServiceCategoryCard(record: ServiceCategoryRecord): ServiceCategoryCard {
  return {
    id: record._id,
    name: record.categoryName.trim(),
    icon: iconForCategory(record.categoryName),
    count: record.professionalsCount ?? 0,
  };
}

export default LandingScreenService;
