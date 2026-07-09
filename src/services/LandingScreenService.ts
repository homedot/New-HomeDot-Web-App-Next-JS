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
  author: string;
  role: string;
  quote: string;
  rating: number;
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

  getTestimonials: (): Promise<ApiResponse<Testimonial[]>> =>
    ApiService.get<Testimonial[]>(API_ENDPOINTS.LANDING.TESTIMONIALS),

  // Guest-accessible — no auth required.
  getFeaturedProfessionals: (): Promise<ApiResponse<FeaturedProfessionalsBody>> =>
    ApiService.get<FeaturedProfessionalsBody>(
      API_ENDPOINTS.DATA.FEATURED_PROFESSIONALS,
    ),
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

export default LandingScreenService;
