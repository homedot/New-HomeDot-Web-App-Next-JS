import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";
import type { Professional } from "@/components/ProCard";

export interface FeaturedProperty {
  id: string;
  title: string;
  price: number;
  image: string;
}

export interface LandingCategory {
  id: string;
  name: string;
  count: number;
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

// All Landing screen API calls live here. The screen only ever imports
// this file — never ApiService or fetch directly.
export const LandingScreenService = {
  getFeaturedProperties: (): Promise<ApiResponse<FeaturedProperty[]>> =>
    ApiService.get<FeaturedProperty[]>(
      API_ENDPOINTS.LANDING.FEATURED_PROPERTIES,
    ),

  getCategories: (): Promise<ApiResponse<LandingCategory[]>> =>
    ApiService.get<LandingCategory[]>(API_ENDPOINTS.LANDING.CATEGORIES),

  // Guest-accessible — no auth required.
  getFeaturedProfessionals: (): Promise<ApiResponse<FeaturedProfessionalsBody>> =>
    ApiService.get<FeaturedProfessionalsBody>(
      API_ENDPOINTS.DATA.FEATURED_PROFESSIONALS,
    ),

  // Guest-accessible — no auth required.
  getReviews: (): Promise<ApiResponse<ReviewsBody>> =>
    ApiService.get<ReviewsBody>(API_ENDPOINTS.REVIEW.GET_REVIEWS),
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

export default LandingScreenService;
