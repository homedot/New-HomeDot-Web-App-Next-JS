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
    // Guest-accessible — no auth required. Same request body/response shape
    // as PROPERTIES_FILTER, just the "rent" listings instead of "sell".
    RENT_PROPERTIES_FILTER: (page: number) => `rent/properties-filter?page=${page}`,
    // Requires a stored auth token. Same shape as FILTER_SELL_PROPERTY, for
    // rent listings.
    FILTER_RENT_PROPERTY: (page: number) => `rent/properties-filter-auth?page=${page}`,
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
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // CREATE_RENTAL_PROPERTY ("v1/rent/create") — separate endpoint from
    // CREATE_PROPERTY, same request body shape.
    CREATE_RENTAL_PROPERTY: "rent/create",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // ADD_FAVORITE_SELL ("v1/property/add-favorite-property") — a single
    // POST {property: id} that toggles favorite/unfavorite for that
    // property (calling it again un-favorites it; there's no separate
    // remove endpoint).
    TOGGLE_FAVORITE_SELL: "property/add-favorite-property",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // ADD_FAVORITE_RENT ("v1/rent/add-favorite-property") — defined there
    // but never actually called (every card wires to add_Fav_Sell
    // regardless of listing purpose); wired correctly here so favoriting a
    // Rent listing hits the matching endpoint.
    TOGGLE_FAVORITE_RENT: "rent/add-favorite-property",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // GET_FAVORITE_PROPERTY ("v1/property/get-favorite-properties").
    GET_FAVORITE_PROPERTIES: "property/get-favorite-properties",
  },
  PROFESSIONALS: {
    // Guest-accessible — no auth required. Mirrors homedot-mobile-app's
    // GUEST_PROFESSIONAL_FILTER_SEARCH ("v1/search/filter-professional") —
    // same "v1/" drop as MARKETPLACE.FILTER_SELL_PROPERTY above, since
    // BASE_URL here already ends in /api/v1. Query params (page, category,
    // lat, long, sqMin, sqMax) are appended by the caller; rating /
    // minExperience / maxExperience / professionalType go in the POST body.
    FILTER_SEARCH: "search/filter-professional",
    // Requires a stored auth token. Mirrors AUTH_PROFESSIONAL_FILTER_SEARCH
    // ("v1/search/filter-professional-auth") — same request shape as
    // FILTER_SEARCH, just personalized for a signed-in user.
    FILTER_SEARCH_AUTH: "search/filter-professional-auth",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // ENQUIRE_SUBMIT ("v1/enquiry/submit-enquiry"), specifically the
    // `directEnquiry` call from a professional's own detail screen — same
    // endpoint also handles the untargeted "post a requirement" flow (no
    // `professional` field), which this app doesn't implement.
    ENQUIRE_SUBMIT: "enquiry/submit-enquiry",
  },
} as const;
