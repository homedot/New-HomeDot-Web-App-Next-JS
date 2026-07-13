export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://stg-api.homedotapp.com/api/v1";

export const API_ENDPOINTS = {
  AUTH: {
    CHECK_USER_LOGIN: "auth/check-user",
    USER_LOGIN_OTP: "auth/user-login-otp",
    // Called by ApiService itself whenever a request comes back 401 — trades
    // the locally stored refresh token for a new access token.
    REFRESH_TOKEN: "auth/refresh-token",
  },
  LANDING: {
    FEATURED_PROPERTIES: "/landing/featured-properties",
  },
  COMMON: {
    // Guest-accessible — no auth required. Full professional-services
    // category taxonomy (id, name, image, professionalsCount).
    CATEGORY_LIST: "common/category-list",
    // Requires a stored auth token. Multipart image upload used by the
    // property-add flow (and elsewhere) — returns an image record with an
    // `_id` to reference from `property_images`.
    IMAGE_UPLOAD: "common/image-upload",
  },
  DATA: {
    FEATURED_PROFESSIONALS: "data/get-featured-professionals",
    // Guest-accessible — no auth required. Full home payload (services,
    // stories/blog posts, ads); we only use `stories` for now.
    HOME: "data/home",
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
    // Requires a stored auth token (ApiService attaches it automatically).
    // Mirrors homedot-mobile-app's FILTER_SELL_PROPERTY ("v1/property/properties-filter-auth")
    // — the "v1/" there is relative to the mobile app's own base URL, which
    // doesn't already end in /api/v1 the way BASE_URL here does, so it's
    // dropped to avoid a double /v1/v1/ segment.
    FILTER_SELL_PROPERTY: (page: number) => `property/properties-filter-auth?page=${page}`,
    // Guest-accessible — no auth required.
    PROPERTY_BY_SLUG: (slug: string) =>
      `property/guest/get-property/${encodeURIComponent(slug)}`,
    // Guest-accessible — no auth required. Property type taxonomy (id + name
    // + count), used to drive the "Property type" filter with real ids.
    PROPERTY_TYPES: "property/get-property-types",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // CREATE_SELL_PROPERTY ("v1/property/create") — same "v1/" note as
    // FILTER_SELL_PROPERTY above.
    CREATE_PROPERTY: "property/create",
  },
} as const;
