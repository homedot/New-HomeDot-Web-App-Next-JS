import LandingScreenService, {
  toProCardProfessional,
  pickTestimonials,
  toBlogPost,
  toServiceCategoryCard,
  toPropertyCategoryCard,
  type Testimonial,
  type BlogPost,
  type ServiceCategoryCard,
  type PropertyCategoryCard,
} from "@/services/LandingScreenService";
import type { Professional } from "@/components/ProCard";
import {
  categories,
  propertyCategories,
  professionals,
  blogPosts,
  testimonials,
} from "./data";

export interface LandingInitialData {
  categories: ServiceCategoryCard[];
  categoriesLoaded: boolean;
  propertyCategories: PropertyCategoryCard[];
  topProfessionals: Professional[];
  blogPosts: BlogPost[];
  testimonials: Testimonial[];
}

// Fetches every Landing screen data section server-side (Server Component),
// so the browser never issues these requests itself — only the resulting
// HTML/RSC payload reaches the client. Falls back to the same local mocks
// each section used to fall back to client-side, keeping behavior identical
// when the API is unreachable or a section is empty.
export async function getLandingInitialData(): Promise<LandingInitialData> {
  const [categoriesRes, propertyCategoriesRes, professionalsRes, homeRes, reviewsRes] =
    await Promise.all([
      LandingScreenService.getServiceCategories(),
      LandingScreenService.getPropertyCategories(),
      LandingScreenService.getFeaturedProfessionals(),
      LandingScreenService.getHomeData(),
      LandingScreenService.getReviews(),
    ]);

  let categoriesData = categories;
  let categoriesLoaded = false;
  if (
    categoriesRes.success &&
    categoriesRes.data?.status &&
    categoriesRes.data.data.length > 0
  ) {
    categoriesData = categoriesRes.data.data.map(toServiceCategoryCard);
    categoriesLoaded = true;
  }

  let propertyCategoriesData = propertyCategories;
  if (
    propertyCategoriesRes.success &&
    propertyCategoriesRes.data?.status &&
    propertyCategoriesRes.data.data.length > 0
  ) {
    propertyCategoriesData = propertyCategoriesRes.data.data.map(
      toPropertyCategoryCard,
    );
  }

  let topProfessionalsData: Professional[] = professionals;
  if (
    professionalsRes.success &&
    professionalsRes.data?.status &&
    professionalsRes.data.data.length > 0
  ) {
    topProfessionalsData = professionalsRes.data.data
      .slice(0, 3)
      .map(toProCardProfessional);
  }

  let blogPostsData: BlogPost[] = blogPosts;
  const stories = homeRes.data?.data?.[0]?.stories;
  if (homeRes.success && homeRes.data?.status && stories?.length) {
    blogPostsData = stories.slice(0, 3).map(toBlogPost);
  }

  let testimonialsData: Testimonial[] = testimonials;
  if (
    reviewsRes.success &&
    reviewsRes.data?.status &&
    reviewsRes.data.data.length > 0
  ) {
    const picked = pickTestimonials(reviewsRes.data.data);
    if (picked.length > 0) testimonialsData = picked;
  }

  return {
    categories: categoriesData,
    categoriesLoaded,
    propertyCategories: propertyCategoriesData,
    topProfessionals: topProfessionalsData,
    blogPosts: blogPostsData,
    testimonials: testimonialsData,
  };
}
