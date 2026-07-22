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
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // USERS_APIS.PROFILE_DETAILS ("v1/auth/profile-data") — the signed-in
    // user's own record (name, email, mobile, location, profileImage, ...).
    PROFILE_DETAILS: "auth/profile-data",
    // Requires a stored auth token. Mirrors USERS_APIS.PROFILE_EDIT
    // ("v1/auth/profile-update") — PUT { name, location, latitude,
    // longitude, google_address_string }.
    PROFILE_UPDATE: "auth/profile-update",
    // Requires a stored auth token. Mirrors BACKEND_AUTH_URL.LOGOUT
    // ("v1/auth/logout") — POST with no body.
    LOGOUT: "auth/logout",
    // Requires a stored auth token. Mirrors USERS_APIS.BECOME_A_PROFESSIONAL
    // ("v1/auth/become-professional") — POST { professionalCategory,
    // subCategory, professionalType, experience, description, skills }.
    // Adds the "professional" role to the signed-in user's account; doesn't
    // touch name/contact (those already exist on the account).
    BECOME_A_PROFESSIONAL: "auth/become-professional",
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.SWITCH_TO_USER
    // ("v1/auth/switch-user") — POST with no body. Despite the name, this is
    // a generic active-role toggle: homedot-mobile-app calls the exact same
    // endpoint from both its User-side ProfileScreen (to switch into
    // Professional) and its Professional-side screens (to switch back to
    // User) — only reachable once an account already has both roles. Returns
    // a fresh token pair scoped to the new active role.
    SWITCH_ROLE: "auth/switch-user",
  },
  USER: {
    // Requires a stored auth token. Mirrors USERS_APIS.PROFILE_IMAGE_UPDATE
    // ("v1/user/profile-image-update") — PUT multipart form, field name
    // `profileImage`.
    PROFILE_IMAGE_UPDATE: "user/profile-image-update",
    // Requires a stored auth token. Mirrors USERS_APIS.NUMBER_UPDATE_OTP_VALIDATION
    // ("v1/user/user-phone-number-update") — same endpoint sends the OTP
    // (PUT { phone, countryCode }) or verifies it (PUT { phone, otp,
    // countryCode }), same pattern as AUTH.USER_LOGIN_OTP.
    PHONE_UPDATE: "user/user-phone-number-update",
    // Requires a stored auth token. Mirrors USERS_APIS.EMAIL_UPDATE_OTP_VALIDATION
    // ("v1/user/user-email-update") — PUT { email } to send, PUT { email,
    // otp } to verify.
    EMAIL_UPDATE: "user/user-email-update",
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
    // Guest-accessible — no auth required. Same underlying endpoint as
    // CATEGORY_LIST above, just called with a different body: mirrors
    // homedot-mobile-app's ProfessionalCategoryandSkillsService, which fetches
    // level-two subcategories by POSTing { levelOneCategory: categoryId } to
    // this identical URL instead of a dedicated one.
    SUBCATEGORY_LIST: "common/category-list",
    // Guest-accessible — no auth required. Mirrors
    // ProfessionalCategoryandSkillsService.professioanlSkills
    // ("v1/common/skills") — POST { category, subCategory, keyString },
    // level-three skills filtered by a live search string.
    SKILLS: "common/skills",
    // Guest-accessible — no auth required. Mirrors
    // ProfessionalCategoryandSkillsService.get_SkillsSuggestions
    // ("v1/common/skills-suggestions") — POST { category, subCategory },
    // a starter set of skills for the chosen category/subcategory.
    SKILLS_SUGGESTIONS: "common/skills-suggestions",
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
    // Requires a stored auth token. Rent-side counterpart — homedot-mobile-app
    // never actually wires a rent-specific favorites fetch (only the sell one
    // above), same gap as TOGGLE_FAVORITE_RENT already notes, but this
    // endpoint is confirmed live on the backend.
    GET_FAVORITE_PROPERTIES_RENT: "rent/get-favorite-properties",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // GET_PROPERTY ("v1/property/get-properties") — the signed-in user's own
    // posted sell listings (My Property screen), not the public search feed.
    GET_MY_PROPERTIES: "property/get-properties",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // GET_RENT_PROPERTY ("v1/rent/get-properties") — same as above, for the
    // user's own rent listings.
    GET_MY_RENT_PROPERTIES: "rent/get-properties",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // GET_PROPERTY_DETAILS ("v1/property/get-property/") — the owner-authed
    // detail route (as opposed to PROPERTY_BY_SLUG's guest route), used to
    // prefill the edit form.
    PROPERTY_DETAIL_AUTH: (slug: string) => `property/get-property/${encodeURIComponent(slug)}`,
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // GET_RENT_PROPERTY_DETAILED ("v1/rent/get-property/").
    RENT_PROPERTY_DETAIL_AUTH: (slug: string) => `rent/get-property/${encodeURIComponent(slug)}`,
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // UPDATE_SELL_PROPERTY ("v1/property/update-property-info/") — PUT, same
    // request body shape as CREATE_PROPERTY.
    UPDATE_SELL_PROPERTY: (slug: string) => `property/update-property-info/${encodeURIComponent(slug)}`,
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // UPDATE_RENT_PROPERTY ("v1/rent/update-property-info/").
    UPDATE_RENT_PROPERTY: (slug: string) => `rent/update-property-info/${encodeURIComponent(slug)}`,
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // PROPERTY_SOLD_OUT ("v1/property/sold-out-property/") — POST, empty
    // body, toggles the listing to "Sold Out". One-way: there's no reverse
    // endpoint (mobile tells the owner to contact HomeDot to undo it).
    PROPERTY_SOLD_OUT: (slug: string) => `property/sold-out-property/${encodeURIComponent(slug)}`,
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // RENT_PROPERTY_SOLD_OUT ("v1/rent/sold-out-property/").
    RENT_PROPERTY_SOLD_OUT: (slug: string) => `rent/sold-out-property/${encodeURIComponent(slug)}`,
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // PROPERTY_DELETE ("v1/property/delete-property/") — PUT (soft delete,
    // not a real DELETE), keyed by the property's _id.
    PROPERTY_DELETE: (id: string) => `property/delete-property/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // RENT_PROPERTY_DELETE ("v1/rent/delete-property/").
    RENT_PROPERTY_DELETE: (id: string) => `rent/delete-property/${encodeURIComponent(id)}`,
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
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // ADD_FAVORITE_PROFESSIONAL ("v1/user/add-favorite") — a single POST
    // { professional: userId } that toggles favorite/unfavorite (calling it
    // again un-favorites it), same pattern as MARKETPLACE.TOGGLE_FAVORITE_SELL.
    TOGGLE_FAVORITE: "user/add-favorite",
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // FAVORITE_PROFESSIONALS ("v1/user/favorites-list").
    GET_FAVORITES: (page: number) => `user/favorites-list?page=${page}`,
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // REFER_A_FRIEND ("v1/professional/invite-friend") — returns the
    // signed-in user's own referral link (InviteaFriendScreen's default
    // codepath there, used whenever isScreenUserOrProfessional is false,
    // which it is for every regular user).
    REFER_A_FRIEND: "professional/invite-friend",
  },
  BLOG: {
    // Guest-accessible — no auth required. Mirrors homedot-mobile-app's
    // GUEST_USER_BLOGS ("v1/blog/get-all-blogs"). Works the same for
    // signed-in visitors too (ApiService attaches the token automatically
    // when present), so this single feed serves both guest and signed-in
    // users — mobile branches to a separate auth-only endpoint here, but
    // that one (commonblog/favorites-blog-list) returns the identical shape
    // for a logged-in regular user, so there's no real behavior lost by not
    // duplicating the branch.
    LIST: (page: number) => `blog/get-all-blogs?page=${page}`,
    // Guest-accessible — no auth required. Mirrors GUEST_USER_BLOG_KEY_SEARCH
    // ("v1/commonblog/search-blogs"). keyString is one of the mobile app's
    // fixed category tabs: "house" | "garden" | "home".
    SEARCH_BY_TYPE: (keyString: string) => `commonblog/search-blogs?keyString=${encodeURIComponent(keyString)}`,
    // Guest-accessible — no auth required. Mirrors BLOG_DETAILED
    // ("v1/blog/get-single-blog/"). Returns { blog, user, relatedBlogs } —
    // not the `data: [{...}]` wrapper most other list endpoints use.
    DETAIL: (slug: string) => `blog/get-single-blog/${encodeURIComponent(slug)}`,
    // Requires a stored auth token. Mirrors ADD_BLOG_FAVORITE
    // ("v1/commonblog/add-favorite-blog") — POST { blog: id } toggles
    // favorite/unfavorite (calling it again un-favorites it), same pattern
    // as MARKETPLACE.TOGGLE_FAVORITE_SELL / PROFESSIONALS.TOGGLE_FAVORITE.
    TOGGLE_FAVORITE: "commonblog/add-favorite-blog",
    // Requires a stored auth token. Mirrors USERS_APIS.FAVORITE_BLOG
    // ("v1/user/favorite-blogs") — seeds the saved/favorited set on load.
    GET_FAVORITES: "user/favorite-blogs",
  },
  PROJECTS: {
    // Requires a stored auth token. Mirrors USERS_APIS.ALL_PROJECTS
    // ("v1/user/my-projects") — returns `data: [{ ongoing, completed,
    // cancelled }]`, one flat page shared across all three status buckets
    // (mirrors homedot-mobile-app's UserSideProjectsTabNavigator).
    LIST: (page: number) => `user/my-projects?page=${page}`,
    // Requires a stored auth token. Mirrors USERS_APIS.PROJECT_DETAILED
    // ("v1/user/get-project/") — returns `data: [{...}]`, read as data[0].
    DETAIL: (slug: string) => `user/get-project/${encodeURIComponent(slug)}`,
    // Requires a stored auth token. Mirrors USERS_APIS.PROJECT_COMPLETED
    // ("v1/user/update-project-complete/") — POST { completedDate }.
    COMPLETE: (id: string) => `user/update-project-complete/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors USERS_APIS.PROJECT_ADD_RATING
    // ("v1/user/add-rating/") — POST { rating, review } for the professional
    // who worked the project.
    ADD_RATING: (id: string) => `user/add-rating/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors USERS_APIS.HOMEDOT_APP_RATING
    // ("v1/review/create-review-user") — POST { rating, reviews } (plural),
    // a separate review of the HomeDot app itself, prompted right after a
    // project's professional review.
    APP_REVIEW: "review/create-review-user",
  },
  ENQUIRY: {
    // Requires a stored auth token. Mirrors homedot-mobile-app's
    // VIEW_ENQUERY ("v1/enquiry/user-enquiries") — the signed-in user's own
    // enquiries (Profile screen's Enquiries tab), paginated.
    LIST: (page: number) => `enquiry/user-enquiries?page=${page}`,
    // Requires a stored auth token. Mirrors ENQUERY_DETAILED
    // ("v1/enquiry/get-enquiry-info-user/") — used only to read back
    // locationKey.coordinates before opening the edit form (the list
    // response doesn't carry lat/lng, only the formatted address).
    DETAIL: (id: string) => `enquiry/get-enquiry-info-user/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors EDIT_ENQUERY
    // ("v1/enquiry/update-enquiry/") — PUT. homedot-mobile-app's own edit
    // screen has its category picker UI commented out (dead code, category
    // is display-only there), so this mirrors what's actually live: only
    // location and requirement are editable.
    UPDATE: (id: string) => `enquiry/update-enquiry/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors DELETE_ENQUERY
    // ("v1/enquiry/enquiry-delete/") — PUT, no body (soft delete).
    DELETE: (id: string) => `enquiry/enquiry-delete/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors PIN_ENQUERY ("v1/user/pin-enquiry")
    // — POST { enquiry: id }, toggles pinned/unpinned (calling it again
    // unpins), same pattern as the various TOGGLE_FAVORITE endpoints.
    PIN: "user/pin-enquiry",
    // Requires a stored auth token. Mirrors
    // SELCTED_ENQUIRY_PROFESSIONAL_DETAILED
    // ("v1/enquiry/professionals-response/") — the professional's response
    // to this enquiry (name, category, message, accept/reject state).
    RESPONSE_DETAIL: (id: string) => `enquiry/professionals-response/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors USER_SIDE_ENQUIRY_RESPONSE
    // ("v1/enquiry/user-response/") — POST { professional }, accepts the
    // professional's response and moves the enquiry into a project.
    ACCEPT_RESPONSE: (id: string) => `enquiry/user-response/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors ENQUIRE_RESPONSE_REJECT
    // ("v1/enquiry/enquiry-response-reject/") — POST { professional,
    // rejectReason }.
    REJECT_RESPONSE: (id: string) => `enquiry/enquiry-response-reject/${encodeURIComponent(id)}`,
  },
  // The signed-in user's own Professional-role dashboard (as opposed to
  // PROFESSIONALS above, which is the public browse/enquire-a-professional
  // surface). Only reachable once the account has the professional role —
  // see SwitchProfessionalService / ProfessionalDashboardScreen.
  PROFESSIONAL: {
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.HOME_SCREEN
    // ("v1/professional/get-professional") — the signed-in professional's own
    // summary (name, profileImage, professionalInfo[], totalProjects).
    HOME: "professional/get-professional",
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.ENQUIRY_LIST
    // ("v1/enquiry/enquiries-professional") — a single call returns both Job
    // and Direct enquiries (data[0].jobEnquiries[0] / data[0].directEnquires[0]),
    // each with its own data[]/totalCount.total_rows.
    ENQUIRY_LIST: (page: number) => `enquiry/enquiries-professional?page=${page}`,
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.ENQUIRE_RESPONSE
    // ("v1/enquiry/professional-response/") — POST { responseStatus: true,
    // responseText }, used to accept a Job or Direct enquiry with a message.
    ENQUIRY_RESPOND: (id: string) => `enquiry/professional-response/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.ENQUIRY_PIN
    // ("v1/professional/pin-enquiry") — POST { enquiry: id }, toggles
    // pinned/unpinned.
    ENQUIRY_PIN: "professional/pin-enquiry",
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.JOB_ENQUIRY_DELETE
    // ("v1/professional/ignore-enquiry/") — POST, no body. A silent ignore
    // (no rejection reason sent to the customer) — Job Enquiries only.
    JOB_ENQUIRY_IGNORE: (id: string) => `professional/ignore-enquiry/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.DIRECT_ENQUIRY_DELETE
    // ("v1/enquiry/professional-reject/") — POST { response: false,
    // responseText: "rejected" }, an explicit rejection the customer sees —
    // Direct Enquiries only (distinct from the silent Job ignore above).
    DIRECT_ENQUIRY_REJECT: (id: string) => `enquiry/professional-reject/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.PROFESSIOANL_ALL_PROJECTS
    // ("v1/professional/my-projects") — a single call returns all three
    // status buckets (data[0].ongoing / .completed / .cancelled), same
    // one-page-shared-across-tabs shape as PROJECTS.LIST on the user side.
    ALL_PROJECTS: (page: number) => `professional/my-projects?page=${page}`,
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.ENQUERY_PROJECT_INITIATE
    // ("v1/enquiry/convert-enquiry-project/") — POST { projectName, location,
    // startDate, endDate, project_images }, converts an accepted enquiry
    // (professionalResponse[0].userAccepted === true, no project yet) into a
    // project. Images are uploaded individually first via COMMON.IMAGE_UPLOAD.
    ENQUIRY_PROJECT_INITIATE: (id: string) => `enquiry/convert-enquiry-project/${encodeURIComponent(id)}`,
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.EDIT_PROFILE
    // ("v1/professional/profile-update") — PUT the full professional profile
    // (name, professionalType, professionalCategory, subCategory, experience,
    // squareFeetRate, workingArea, description, skills, location) in one call.
    PROFILE_UPDATE: "professional/profile-update",
    // Requires a stored auth token. Mirrors ProfessionalDetailsServices'
    // profileImageUpdate ("v1/professional/profile-image-update") — multipart
    // field "profileImage". Distinct from USER.PROFILE_IMAGE_UPDATE.
    PROFILE_IMAGE_UPDATE: "professional/profile-image-update",
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.GALLERY_LIST
    // ("v1/professional/portfolio/") — returns { projectList, projectHistoryList },
    // each project carrying its own projectImageList. The Workfolio screen
    // flattens both into one photo grid (see ProfessionalGalleryService.flattenGallery).
    GALLERY_LIST: (userId: string) => `professional/portfolio/${encodeURIComponent(userId)}`,
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.ADD_PROJECT_GALLERY
    // ("v1/professional/create-project-history") — manually adds a "Workfolio"
    // project (as opposed to ENQUIRY_PROJECT_INITIATE, which converts an
    // accepted enquiry). POST { location, projectName, project_images }.
    ADD_PROJECT_GALLERY: "professional/create-project-history",
    // Requires a stored auth token. Mirrors PROFESSIONALS_API.GALLERY_IMAGE_DELETE
    // ("v1/professional/delete-portfolio-image") — POST { image, type }, where
    // type is "outside"/"inside" depending on which bucket the photo came from.
    GALLERY_IMAGE_DELETE: "professional/delete-portfolio-image",
  },
} as const;
