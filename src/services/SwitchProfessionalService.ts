import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";
import type { ProfessionalSkillRecord } from "./ProfessionalsScreenService";

export type { ProfessionalSkillRecord };

export interface ProfessionalTypeOption {
  id: number;
  title: string;
}

// Static, not fetched — mirrors homedot-mobile-app's PerfessionalInfoRegisterScreen,
// which hardcodes this exact list rather than pulling it from an API.
export const PROFESSIONAL_TYPES: ProfessionalTypeOption[] = [
  { id: 1, title: "Company" },
  { id: 2, title: "Freelance" },
];

export interface ProfessionalCategoryOption {
  _id: string;
  categoryName: string;
}

export interface ProfessionalSubCategoryOption {
  _id: string;
  subcategoryId: string;
  subcategoryName: string;
}

export interface CategoryListBody {
  status: boolean;
  message: string;
  data: ProfessionalCategoryOption[];
}

export interface SubCategoryListBody {
  status: boolean;
  message: string;
  data: ProfessionalSubCategoryOption[];
}

export interface SkillsBody {
  status: boolean;
  message: string;
  data: ProfessionalSkillRecord[];
}

export interface BecomeProfessionalPayload {
  professionalCategory: string;
  subCategory: string;
  professionalType: string;
  experience: string;
  description: string;
  skills: string[];
}

// homedot-mobile-app never collects this from the user on this screen — it
// sends this exact canned string as the new professional's description.
export const DEFAULT_PROFESSIONAL_DESCRIPTION =
  "Expert in my field, I deliver quality work with precision and professionalism. I bring skill and dedication to every project.";

export interface AuthTokenPairRecord {
  token: string;
  reToken: string;
}

export interface RoleSwitchBody {
  status: boolean;
  message: string;
  data: AuthTokenPairRecord[];
}

// Mirrors homedot-mobile-app's `skillsOfStrings = skills.map(obj => JSON.stringify(obj))`
// — the become-professional payload sends each selected skill as a
// JSON-stringified object, not a plain id.
export function buildSkillsPayload(skills: ProfessionalSkillRecord[]): string[] {
  return skills.map((s) => JSON.stringify(s));
}

// All "become/switch to professional" API calls live here. The
// BecomeProfessionalModal and ProfileScreen only ever import this file —
// never ApiService or fetch directly.
export const SwitchProfessionalService = {
  // Guest-accessible — no auth required. Top-level (level-one) categories.
  getCategories: (): Promise<ApiResponse<CategoryListBody>> =>
    ApiService.post<CategoryListBody>(API_ENDPOINTS.COMMON.CATEGORY_LIST, {}),

  // Guest-accessible — no auth required. Level-two subcategories for a
  // chosen top-level category.
  getSubCategories: (categoryId: string): Promise<ApiResponse<SubCategoryListBody>> =>
    ApiService.post<SubCategoryListBody>(API_ENDPOINTS.COMMON.SUBCATEGORY_LIST, {
      levelOneCategory: categoryId,
    }),

  // Guest-accessible — no auth required. Starter skill suggestions once
  // category + subcategory are both chosen.
  getSkillSuggestions: (category: string, subCategory: string): Promise<ApiResponse<SkillsBody>> =>
    ApiService.post<SkillsBody>(API_ENDPOINTS.COMMON.SKILLS_SUGGESTIONS, { category, subCategory }),

  // Guest-accessible — no auth required. Live skill search as the user types.
  searchSkills: (category: string, subCategory: string, keyString: string): Promise<ApiResponse<SkillsBody>> =>
    ApiService.post<SkillsBody>(API_ENDPOINTS.COMMON.SKILLS, { category, subCategory, keyString }),

  // Requires a stored auth token. Adds the professional role to the
  // signed-in account.
  becomeProfessional: (payload: BecomeProfessionalPayload): Promise<ApiResponse<RoleSwitchBody>> =>
    ApiService.post<RoleSwitchBody>(API_ENDPOINTS.AUTH.BECOME_A_PROFESSIONAL, payload),

  // Requires a stored auth token. Only reachable once the account already
  // has both roles — toggles which role the current session is scoped to.
  switchRole: (): Promise<ApiResponse<RoleSwitchBody>> =>
    ApiService.post<RoleSwitchBody>(API_ENDPOINTS.AUTH.SWITCH_ROLE),
};

export default SwitchProfessionalService;
