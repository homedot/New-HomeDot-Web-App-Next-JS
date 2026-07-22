import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";
import type { ImageUploadBody } from "./MarketplaceScreenService";
import type { ProfessionalSkillRecord } from "./ProfessionalsScreenService";

// Mirrors the fields homedot-mobile-app's ProfessionalHomeScreen reads off
// `professionalDetails[0].professionalInfo[0]`. `skills` reuses
// ProfessionalSkillRecord from ProfessionalsScreenService — same
// professionalInfo shape the public browse/detail side already types,
// mobile's ProfessionalEditProfileScreen (the closest analog to this
// dashboard) renders only `levelThreeName` per chip too.
export interface ProfessionalHomeInfoRecord {
  _id: string;
  userId?: string;
  // Ids — paired with the *Name fields below, same convention as
  // ProfessionalInfoRecord in ProfessionalsScreenService. Not editable from
  // the profile screen, just resubmitted as-is on save (mirrors mobile).
  professionalCategory?: string;
  professionalCategoryName?: string;
  subCategory?: string;
  subCategoryName?: string;
  professionalType?: string;
  rating?: number | string;
  verified?: boolean;
  featured?: boolean;
  experience?: number;
  squareFeetRate?: number;
  workingArea?: string;
  description?: string;
  skills?: ProfessionalSkillRecord[];
}

// Mirrors `professionalDetails[0]` itself — the HOME endpoint's top-level record.
export interface ProfessionalHomeRecord {
  name: string;
  profileImage?: string;
  userType?: string[];
  totalProjects?: number;
  professionalInfo?: ProfessionalHomeInfoRecord[];
}

export interface ProfessionalHomeBody {
  status: boolean;
  message: string;
  data: ProfessionalHomeRecord[];
}

export interface EnquiryCustomerInfo {
  name: string;
  profileImage?: string;
}

export interface ProfessionalEnquiryResponse {
  response?: string;
  userAccepted?: boolean;
  userReject?: boolean;
  userRejectReason?: string;
  responseText?: string;
}

export interface ProfessionalEnquiryProjectInfo {
  projectName?: string;
  projectStatus?: string;
}

// Mirrors homedot-mobile-app's EnquiryCard.js field reads — shared shape for
// both Job and Direct enquiries.
export interface ProfessionalEnquiryRecord {
  _id: string;
  customerInfo?: EnquiryCustomerInfo[];
  location: string;
  requirement: string;
  status?: string;
  isPinned?: boolean;
  read?: boolean;
  createdAt: string;
  enquiryCategoryName?: string;
  professionalResponse?: ProfessionalEnquiryResponse[];
  projectInfo?: ProfessionalEnquiryProjectInfo[];
}

export interface ProfessionalEnquiryListPage {
  data: ProfessionalEnquiryRecord[];
  totalCount?: { total_rows: number };
}

// Both enquiry kinds come back from a single call — mirrors
// `res.data.data[0].jobEnquiries[0]` / `.directEnquires[0]` exactly.
export interface ProfessionalEnquiryListGroups {
  jobEnquiries?: ProfessionalEnquiryListPage[];
  directEnquires?: ProfessionalEnquiryListPage[];
}

export interface ProfessionalEnquiryListBody {
  status: boolean;
  message: string;
  data: ProfessionalEnquiryListGroups[];
}

export interface ProfessionalActionBody {
  status: boolean;
  message: string;
}

export interface InitiateProjectPayload {
  projectName: string;
  location: string;
  startDate: string;
  endDate: string;
  projectImages: string[];
}

// Mirrors homedot-mobile-app's ProfessionalEditProfileScreen — sends the
// whole profile in one PUT, including fields not editable from this screen
// (professionalType/professionalCategory/subCategory), which are just
// resubmitted with their current values. `location` is required — mobile's
// own validateProfile() blocks submission without it (line 645-648 of
// ProfessionalEditProfileScreen.js), and ProfileUpdateServices.js always
// sends latitude/longitude as STRINGS (template-literal coerced, not raw
// numbers) — both matter here, since the endpoint 500s if either is off
// (confirmed against the live API while testing this feature).
export interface UpdateProfessionalProfilePayload {
  name: string;
  professionalType?: string;
  professionalCategory?: string;
  subCategory?: string;
  experience: string;
  squareFeetRate?: string;
  workingArea?: string;
  description: string;
  skills: string[];
  location: string;
  google_address_string: string;
  latitude: string;
  longitude: string;
}

export interface ProfessionalProjectImage {
  projectImage: string;
}

// Mirrors homedot-mobile-app's ToatalWorksCards.js field reads.
export interface ProfessionalProjectRecord {
  _id: string;
  projectName: string;
  projectStatus: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  customerInfo?: EnquiryCustomerInfo[];
  projectImageList?: ProfessionalProjectImage[];
  projectSlug: string;
}

// ALL_PROJECTS returns one page shared across all three status buckets, same
// convention as ProjectsService.ProjectListGroups on the user side.
export interface ProfessionalProjectListGroups {
  ongoing?: ProfessionalProjectRecord[];
  completed?: ProfessionalProjectRecord[];
  cancelled?: ProfessionalProjectRecord[];
}

export interface ProfessionalProjectListBody {
  status: boolean;
  message: string;
  data: ProfessionalProjectListGroups[];
}

// All Professional Dashboard API calls live here. The dashboard screen only
// ever imports this file — never ApiService or fetch directly.
export const ProfessionalDashboardService = {
  // Requires a stored auth token.
  getHome: (): Promise<ApiResponse<ProfessionalHomeBody>> =>
    ApiService.get<ProfessionalHomeBody>(API_ENDPOINTS.PROFESSIONAL.HOME),

  // Requires a stored auth token.
  getEnquiries: (page = 1): Promise<ApiResponse<ProfessionalEnquiryListBody>> =>
    ApiService.get<ProfessionalEnquiryListBody>(API_ENDPOINTS.PROFESSIONAL.ENQUIRY_LIST(page)),

  // Requires a stored auth token. Accepts a Job or Direct enquiry with a
  // message — same endpoint for both kinds.
  respondToEnquiry: (id: string, responseText: string): Promise<ApiResponse<ProfessionalActionBody>> =>
    ApiService.post<ProfessionalActionBody>(API_ENDPOINTS.PROFESSIONAL.ENQUIRY_RESPOND(id), {
      responseStatus: true,
      responseText,
    }),

  // Requires a stored auth token. Toggles pinned/unpinned.
  pinEnquiry: (id: string): Promise<ApiResponse<ProfessionalActionBody>> =>
    ApiService.post<ProfessionalActionBody>(API_ENDPOINTS.PROFESSIONAL.ENQUIRY_PIN, { enquiry: id }),

  // Requires a stored auth token. Job Enquiries only — a silent ignore.
  ignoreJobEnquiry: (id: string): Promise<ApiResponse<ProfessionalActionBody>> =>
    ApiService.post<ProfessionalActionBody>(API_ENDPOINTS.PROFESSIONAL.JOB_ENQUIRY_IGNORE(id)),

  // Requires a stored auth token. Direct Enquiries only — an explicit
  // rejection the customer is notified of.
  rejectDirectEnquiry: (id: string): Promise<ApiResponse<ProfessionalActionBody>> =>
    ApiService.post<ProfessionalActionBody>(API_ENDPOINTS.PROFESSIONAL.DIRECT_ENQUIRY_REJECT(id), {
      response: false,
      responseText: "rejected",
    }),

  // Requires a stored auth token.
  getProjects: (page = 1): Promise<ApiResponse<ProfessionalProjectListBody>> =>
    ApiService.get<ProfessionalProjectListBody>(API_ENDPOINTS.PROFESSIONAL.ALL_PROJECTS(page)),

  // Requires a stored auth token. One file per call, same pattern as
  // MarketplaceScreenService.uploadPropertyImage (field name "image", same
  // COMMON.IMAGE_UPLOAD endpoint) — kept as its own method so professional
  // dashboard screens never need to import a marketplace service.
  uploadProjectImage: (file: File): Promise<ApiResponse<ImageUploadBody>> => {
    const form = new FormData();
    form.append("image", file);
    return ApiService.post<ImageUploadBody>(API_ENDPOINTS.COMMON.IMAGE_UPLOAD, form);
  },

  // Requires a stored auth token. Converts an accepted enquiry into a
  // project — only valid once professionalResponse[0].userAccepted is true
  // and no project exists for it yet.
  initiateProject: (enquiryId: string, payload: InitiateProjectPayload): Promise<ApiResponse<ProfessionalActionBody>> =>
    ApiService.post<ProfessionalActionBody>(API_ENDPOINTS.PROFESSIONAL.ENQUIRY_PROJECT_INITIATE(enquiryId), {
      projectName: payload.projectName,
      location: payload.location,
      startDate: payload.startDate,
      endDate: payload.endDate,
      project_images: payload.projectImages,
    }),

  // Requires a stored auth token. Saves the whole professional profile in
  // one call — see UpdateProfessionalProfilePayload's comment.
  updateProfile: (payload: UpdateProfessionalProfilePayload): Promise<ApiResponse<ProfessionalHomeBody>> =>
    ApiService.put<ProfessionalHomeBody>(API_ENDPOINTS.PROFESSIONAL.PROFILE_UPDATE, payload),

  // Requires a stored auth token. Uploads immediately on pick (not gated
  // behind the profile Save) — field "profileImage", distinct endpoint from
  // both uploadProjectImage (field "image") and the generic user avatar.
  updateProfileImage: (file: File): Promise<ApiResponse<ProfessionalHomeBody>> => {
    const form = new FormData();
    form.append("profileImage", file);
    return ApiService.put<ProfessionalHomeBody>(API_ENDPOINTS.PROFESSIONAL.PROFILE_IMAGE_UPDATE, form);
  },
};

export default ProfessionalDashboardService;
