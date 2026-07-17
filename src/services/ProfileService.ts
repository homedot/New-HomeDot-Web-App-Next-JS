import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

export interface UserLocationKey {
  type: string;
  coordinates: [number, number];
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

  // Requires a stored auth token.
  logout: (): Promise<ApiResponse<LogoutBody>> =>
    ApiService.post<LogoutBody>(API_ENDPOINTS.AUTH.LOGOUT),
};

export default ProfileService;
