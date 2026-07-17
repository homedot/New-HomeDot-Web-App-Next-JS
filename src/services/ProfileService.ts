import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

export interface UserLocationKey {
  type: string;
  // Order is unreliable in practice: GeoJSON Point is supposed to be
  // [longitude, latitude], but homedot-mobile-app's own ProfileScreen reads
  // coordinates[0] into a field it names "latitude" — a mislabel that never
  // gets caught there since it's only ever carried into redux, never
  // rendered on an actual map. Don't index into this directly; use
  // resolveLatLng below, which disambiguates from the values themselves.
  coordinates: [number, number];
}

// India's latitude band (~6–38°N) and longitude band (~68–98°E) never
// overlap, so whichever of the two raw values falls in the longitude band
// is the longitude — regardless of which order the backend actually put
// them in. Falls back to the standard GeoJSON [lng, lat] order only when
// neither value is unambiguously in-range (e.g. a placeholder [0, 0]).
export function resolveLatLng([a, b]: [number, number]): { lat: number; lng: number } {
  const looksLikeLng = (n: number) => Math.abs(n) >= 60;
  if (looksLikeLng(a) && !looksLikeLng(b)) return { lat: b, lng: a };
  if (looksLikeLng(b) && !looksLikeLng(a)) return { lat: a, lng: b };
  return { lat: b, lng: a };
}

// Mirrors the fields homedot-mobile-app's ProfileScreen/EditProfile read off
// `userDetails` (Redux state seeded straight from this endpoint's `data`).
export interface UserProfileRecord {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  countryCode?: string;
  location?: string;
  locationKey?: UserLocationKey;
  profileImage?: string;
  userType?: string[];
}

export interface ProfileDetailsBody {
  status: boolean;
  message: string;
  data: UserProfileRecord;
}

export interface UpdateProfilePayload {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  google_address_string: string;
}

export interface UpdateProfileBody {
  status: boolean;
  message: string;
  data?: UserProfileRecord;
}

export interface UpdateProfileImageBody {
  status: boolean;
  message: string;
  data?: UserProfileRecord;
}

export interface LogoutBody {
  status: boolean;
  message: string;
}

export interface ContactOtpBody {
  status: boolean;
  message: string;
}

// All "my account" API calls live here. Screens/components only ever import
// this file — never ApiService or fetch directly.
export const ProfileService = {
  // Requires a stored auth token.
  getProfileDetails: (): Promise<ApiResponse<ProfileDetailsBody>> =>
    ApiService.get<ProfileDetailsBody>(API_ENDPOINTS.AUTH.PROFILE_DETAILS),

  // Requires a stored auth token.
  updateProfile: (payload: UpdateProfilePayload): Promise<ApiResponse<UpdateProfileBody>> =>
    ApiService.put<UpdateProfileBody>(API_ENDPOINTS.AUTH.PROFILE_UPDATE, payload),

  // Requires a stored auth token. Multipart upload — field name `profileImage`,
  // matching homedot-mobile-app's userImageUpdate.
  updateProfileImage: (file: File): Promise<ApiResponse<UpdateProfileImageBody>> => {
    const form = new FormData();
    form.append("profileImage", file);
    return ApiService.put<UpdateProfileImageBody>(API_ENDPOINTS.USER.PROFILE_IMAGE_UPDATE, form);
  },

  // Requires a stored auth token. Same endpoint sends the OTP (no `otp`
  // field) or verifies it (`otp` present) — mirrors
  // userlNumberUpdateOtpSent/userNumberUpdateOtpVerify, which both hit
  // NUMBER_UPDATE_OTP_VALIDATION. `countryCode` is passed through exactly as
  // mobile's EditProfile does (the dial code with its leading "+", e.g.
  // "+91") — unlike AuthService's login-OTP flow, which strips it.
  sendPhoneUpdateOtp: (phone: string, countryCode: string): Promise<ApiResponse<ContactOtpBody>> =>
    ApiService.put<ContactOtpBody>(API_ENDPOINTS.USER.PHONE_UPDATE, { phone, countryCode }),

  verifyPhoneUpdateOtp: (phone: string, otp: string, countryCode: string): Promise<ApiResponse<ContactOtpBody>> =>
    ApiService.put<ContactOtpBody>(API_ENDPOINTS.USER.PHONE_UPDATE, { phone, otp, countryCode }),

  // Requires a stored auth token. Same send/verify pattern as the phone
  // update above, mirroring userEmailUpdateOtpSent/userEmailUpdateOtpVerify.
  sendEmailUpdateOtp: (email: string): Promise<ApiResponse<ContactOtpBody>> =>
    ApiService.put<ContactOtpBody>(API_ENDPOINTS.USER.EMAIL_UPDATE, { email }),

  verifyEmailUpdateOtp: (email: string, otp: string): Promise<ApiResponse<ContactOtpBody>> =>
    ApiService.put<ContactOtpBody>(API_ENDPOINTS.USER.EMAIL_UPDATE, { email, otp }),

  // Requires a stored auth token.
  logout: (): Promise<ApiResponse<LogoutBody>> =>
    ApiService.post<LogoutBody>(API_ENDPOINTS.AUTH.LOGOUT),
};

export default ProfileService;
