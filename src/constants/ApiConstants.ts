export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://stg-api.homedotapp.com/api/v1";

export const API_ENDPOINTS = {
  AUTH: {
    CHECK_USER_LOGIN: "auth/check-user",
    USER_LOGIN_OTP: "auth/user-login-otp",
  },
  LANDING: {
    FEATURED_PROPERTIES: "/landing/featured-properties",
    CATEGORIES: "/landing/categories",
  },
  DATA: {
    FEATURED_PROFESSIONALS: "data/get-featured-professionals",
  },
  REVIEW: {
    // Guest-accessible — no auth required.
    GET_REVIEWS: "review/get-reviews",
  },
  MARKETPLACE: {
    PROPERTIES: "/marketplace/properties",
    PROPERTY_DETAIL: (id: string) => `/marketplace/properties/${id}`,
    // Guest-accessible — no auth required.
    PROPERTIES_FILTER: (page: number) => `property/properties-filter?page=${page}`,
    // Guest-accessible — no auth required.
    PROPERTY_BY_SLUG: (slug: string) =>
      `property/guest/get-property/${encodeURIComponent(slug)}`,
    // Guest-accessible — no auth required. Property type taxonomy (id + name
    // + count), used to drive the "Property type" filter with real ids.
    PROPERTY_TYPES: "property/get-property-types",
  },
} as const;
