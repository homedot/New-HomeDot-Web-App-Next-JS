import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

// Embedded on each list-item's own record — a lightweight signal that a
// professional has responded, not the full response detail (see
// EnquiryResponseDetail below, fetched separately when the card is opened).
// `responseText` here is a state token (only ever "rejected" in practice),
// distinct from the free-text message field of the same name on the detail
// record — mirrors homedot-mobile-app's dual use of the field exactly.
export interface EnquiryProfessionalResponse {
  professional: string;
  responseText?: string;
  userReject?: boolean;
}

export interface EnquiryProfessionalInfo {
  _id: string;
  userId?: string;
}

export interface EnquiryProjectInfo {
  _id: string;
  projectName?: string;
  projectSlug: string;
}

export interface EnquiryRecord {
  _id: string;
  location: string;
  requirement: string;
  enquiryDate: string;
  enquiryCategory?: string;
  enquiryCategoryName: string;
  enquiryParentCategoryId?: string;
  enquiryParentCategoryName?: string;
  isPinned?: boolean;
  professionalResponse: EnquiryProfessionalResponse[];
  professionalInfo: EnquiryProfessionalInfo[];
  status?: "pending" | "project-initiated" | "project-completed" | string;
  projectInfo?: EnquiryProjectInfo[];
}

// The list endpoint wraps its page of enquiries two levels deep — mirrors
// homedot-mobile-app's own `res.data.data[0].enquires[0].data` access path
// exactly (NotificatinTabViewNavigator.js).
export interface EnquiryListPage {
  enquires: { data: EnquiryRecord[] }[];
}

export interface EnquiryListBody {
  status: boolean;
  message: string;
  data: EnquiryListPage[];
}

export interface EnquiryDetailBody {
  status: boolean;
  message: string;
  data: { locationKey?: { coordinates: [number, number] } };
}

export interface UpdateEnquiryPayload {
  professional: string;
  levelOneId: string;
  levelOneName: string;
  latitude: number;
  longitude: number;
  location: string;
  requirement: string;
  terms: true;
}

export interface EnquiryActionBody {
  status: boolean;
  message: string;
}

// The professional's full response to one enquiry — a different shape from
// EnquiryProfessionalResponse above (that's the thin flag embedded on the
// list record; this is the detail fetched when the response card is
// tapped). `responseText` here is the professional's free-text message.
export interface EnquiryResponseDetail {
  professional: string;
  professionalInfo?: { professionalCategoryName?: string };
  location?: string;
  responseText?: string;
  userAccepted?: boolean;
}

export interface EnquiryResponseDetailBody {
  status: boolean;
  message: string;
  data: EnquiryResponseDetail[];
}

// All Profile screen "Enquiries" tab API calls live here. The screen only
// ever imports this file — never ApiService or fetch directly.
export const EnquiryService = {
  // Requires a stored auth token.
  getEnquiries: (page = 1): Promise<ApiResponse<EnquiryListBody>> =>
    ApiService.get<EnquiryListBody>(API_ENDPOINTS.ENQUIRY.LIST(page)),

  // Requires a stored auth token.
  getEnquiryDetail: (id: string): Promise<ApiResponse<EnquiryDetailBody>> =>
    ApiService.get<EnquiryDetailBody>(API_ENDPOINTS.ENQUIRY.DETAIL(id)),

  // Requires a stored auth token.
  updateEnquiry: (id: string, payload: UpdateEnquiryPayload): Promise<ApiResponse<EnquiryActionBody>> =>
    ApiService.put<EnquiryActionBody>(API_ENDPOINTS.ENQUIRY.UPDATE(id), payload),

  // Requires a stored auth token. No body — a soft delete keyed by id.
  deleteEnquiry: (id: string): Promise<ApiResponse<EnquiryActionBody>> =>
    ApiService.put<EnquiryActionBody>(API_ENDPOINTS.ENQUIRY.DELETE(id)),

  // Requires a stored auth token. Toggles pinned/unpinned — calling it
  // again on an already-pinned enquiry unpins it.
  pinEnquiry: (id: string): Promise<ApiResponse<EnquiryActionBody>> =>
    ApiService.post<EnquiryActionBody>(API_ENDPOINTS.ENQUIRY.PIN, { enquiry: id }),

  // Requires a stored auth token.
  getResponseDetail: (id: string): Promise<ApiResponse<EnquiryResponseDetailBody>> =>
    ApiService.get<EnquiryResponseDetailBody>(API_ENDPOINTS.ENQUIRY.RESPONSE_DETAIL(id)),

  // Requires a stored auth token.
  acceptResponse: (id: string, professionalId: string): Promise<ApiResponse<EnquiryActionBody>> =>
    ApiService.post<EnquiryActionBody>(API_ENDPOINTS.ENQUIRY.ACCEPT_RESPONSE(id), { professional: professionalId }),

  // Requires a stored auth token.
  rejectResponse: (id: string, professionalId: string, rejectReason: string): Promise<ApiResponse<EnquiryActionBody>> =>
    ApiService.post<EnquiryActionBody>(API_ENDPOINTS.ENQUIRY.REJECT_RESPONSE(id), {
      professional: professionalId,
      rejectReason,
    }),
};

export default EnquiryService;
