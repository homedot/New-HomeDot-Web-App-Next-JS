import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

export interface CheckUserPayload {
  userContact: string;
  countryCode?: string;
}

export interface CheckUserRecord {
  newUser: boolean;
  userContact: string;
  mfa: boolean;
}

export interface CheckUserBody {
  status: boolean;
  message: string;
  data: CheckUserRecord[];
}

export interface SendLoginOtpPayload {
  userContact: string;
  countryCode?: string;
}

export interface SendLoginOtpBody {
  status: boolean;
  message: string;
  data: { newUser: boolean }[];
}

export interface VerifyLoginOtpPayload {
  userContact: string;
  otp: string;
  countryCode?: string;
  deviceToken: string;
  deviceType: string;
}

export interface VerifyLoginOtpBody {
  status: boolean;
  message: string;
  data?: unknown;
}

// All auth API calls live here. Screens/components only ever import this
// file — never ApiService or fetch directly.
export const AuthService = {
  checkUser: (payload: CheckUserPayload): Promise<ApiResponse<CheckUserBody>> =>
    ApiService.post<CheckUserBody>(API_ENDPOINTS.AUTH.CHECK_USER_LOGIN, payload),

  // Same endpoint sends the OTP (no `otp` field) or verifies it (`otp` present).
  sendLoginOtp: (payload: SendLoginOtpPayload): Promise<ApiResponse<SendLoginOtpBody>> =>
    ApiService.post<SendLoginOtpBody>(API_ENDPOINTS.AUTH.USER_LOGIN_OTP, payload),

  verifyLoginOtp: async (payload: VerifyLoginOtpPayload): Promise<ApiResponse<VerifyLoginOtpBody>> => {
    const res = await ApiService.post<VerifyLoginOtpBody>(API_ENDPOINTS.AUTH.USER_LOGIN_OTP, payload);
    console.log("verifyLoginOtp response:", res);
    return res;
  },
};

export default AuthService;
