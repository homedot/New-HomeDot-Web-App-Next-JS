import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

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
};

export default LandingScreenService;
