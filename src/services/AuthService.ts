import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";
import { DEFAULT_PROFESSIONAL_DESCRIPTION } from "./SwitchProfessionalService";

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
  recaptchaToken: string;
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
  recaptchaToken: string;
}

export interface VerifyLoginOtpRecord {
  newUser: boolean;
  userType: string;
  token: string;
  reToken: string;
}

export interface VerifyLoginOtpBody {
  status: boolean;
  message: string;
  data: VerifyLoginOtpRecord[];
}

export interface UserSignUpPayload {
  name: string;
  email: string;
  mobile: string;
  countryCode: string;
  location: string;
  latitude: number;
  longitude: number;
}

export interface ProfessionalSignUpPayload extends UserSignUpPayload {
  professionalType: string;
  professionalCategory: string;
  subCategory: string;
  experience: string;
  skills: string[];
  description?: string;
}

export interface SignUpRecord {
  token: string;
  reToken: string;
}

export interface SignUpBody {
  status: boolean;
  message: string;
  data: SignUpRecord[];
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

  // Mirrors homedot-mobile-app's AuthentificationServices.userSiginUp — the
  // OTP-based signup flow here never collects a password, so one is
  // auto-generated the same way mobile does (never surfaced to the user;
  // login is always via OTP).
  userSignUp: (payload: UserSignUpPayload): Promise<ApiResponse<SignUpBody>> =>
    ApiService.post<SignUpBody>(API_ENDPOINTS.AUTH.SIGNUP, {
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      password: `${payload.name.replace(/\s/g, "")}@123`,
      location: payload.location,
      latitude: String(payload.latitude),
      longitude: String(payload.longitude),
      google_address_string: payload.location,
      userType: "normal-user",
      inviteId: "",
      deviceToken: "",
      deviceType: "web",
      countryCode: payload.countryCode,
    }),

  // Mirrors homedot-mobile-app's AuthentificationServices.professionalSignUp.
  // `description` is never actually collected on mobile's equivalent screen
  // (PerfessionalInfoRegisterScreen) either — it always sends the same canned
  // string, also reused here as the fallback when the web form's optional
  // field is left blank.
  professionalSignUp: (payload: ProfessionalSignUpPayload): Promise<ApiResponse<SignUpBody>> =>
    ApiService.post<SignUpBody>(API_ENDPOINTS.AUTH.SIGNUP, {
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      password: `${payload.name.replace(/\s/g, "")}@123`,
      location: payload.location,
      latitude: String(payload.latitude),
      longitude: String(payload.longitude),
      google_address_string: payload.location,
      professionalCategory: payload.professionalCategory,
      subCategory: payload.subCategory,
      professionalType: payload.professionalType,
      experience: payload.experience,
      description: payload.description || DEFAULT_PROFESSIONAL_DESCRIPTION,
      userType: "professional-user",
      inviteId: "",
      skills: payload.skills,
      deviceToken: "",
      deviceType: "web",
      countryCode: payload.countryCode,
    }),
};

export default AuthService;
