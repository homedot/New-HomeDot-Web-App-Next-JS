import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";
import { getAuthToken } from "@/utils/authStorage";
import type { ProfessionalRecord } from "@/screens/ProfessionalsScreen/data";

export interface ProfessionalSkillRecord {
  levelThreeId: string;
  levelThreeName: string;
}

export interface ProfessionalInfoRecord {
  _id: string;
  professionalSlug: string;
  professionalCategory: string;
  professionalCategoryName: string;
  subCategory?: string;
  subCategoryName?: string | null;
  skills?: ProfessionalSkillRecord[];
  professionalType: string;
  experience: number;
  description?: string;
  verified: boolean;
  featured?: boolean;
  rating: number;
  squareFeetRate?: number;
  workingArea?: string;
}

export interface ProfessionalListRecord {
  name: string;
  location?: string;
  city?: string;
  profileImage?: string;
  backgroundImage?: string;
  inviteId: string;
  professionalInfo: ProfessionalInfoRecord[];
}

// Confirmed against the staging API: unlike properties-filter, this
// endpoint returns no currentPage/totalPages — just a running total_rows
// count (12 records per page) — so "more to load" is derived by comparing
// the accumulated list length against total_rows (see ProfessionalsScreen).
export interface ProfessionalsFilterPage {
  totalCount: { total_rows: number };
  data: ProfessionalListRecord[];
}

export interface ProfessionalsFilterBody {
  status: boolean;
  message: string;
  data: ProfessionalsFilterPage[];
}

// Sent as the POST body. `rating` is a single exact star value wrapped in an
// array (e.g. [4]) — the API matches it exactly, not "4 and up" — and
// `professionalType` is always sent empty: the one live mobile screen that
// wires this endpoint never actually sets it, and passing a real value
// (tried "Company" against staging) 500s with a Mongo "BadValue" error.
export interface ProfessionalsFilterPayload {
  rating: number[] | "";
  minExperience: number | "";
  maxExperience: number | "";
  professionalType: "";
}

// Sent as query-string params on the endpoint itself (not the body) —
// mirrors homedot-mobile-app's guestUserAllProfessionalsList.
export interface ProfessionalsFilterQuery {
  category?: string | null;
  lat?: number | null;
  long?: number | null;
  sqMin?: number | null;
  sqMax?: number | null;
}

function buildFilterEndpoint(
  base: string,
  page: number,
  query: ProfessionalsFilterQuery,
): string {
  const params = new URLSearchParams({ page: String(page) });
  if (query.category) params.set("category", query.category);
  if (query.lat != null) params.set("lat", String(query.lat));
  if (query.long != null) params.set("long", String(query.long));
  if (query.sqMin != null) params.set("sqMin", String(query.sqMin));
  if (query.sqMax != null) params.set("sqMax", String(query.sqMax));
  return `${base}?${params.toString()}`;
}

// All Professionals screen API calls live here. The screen only ever
// imports this file — never ApiService or fetch directly.
export const ProfessionalsScreenService = {
  // Signed-in users hit the auth-scoped endpoint (personalized results);
  // guests fall back to the public one — same dual-endpoint pattern as
  // MarketplaceScreenService.getPropertiesFilter.
  getProfessionalsFilter: (
    page: number,
    query: ProfessionalsFilterQuery,
    payload: ProfessionalsFilterPayload,
  ): Promise<ApiResponse<ProfessionalsFilterBody>> => {
    const authed = !!getAuthToken();
    const endpoint = buildFilterEndpoint(
      authed
        ? API_ENDPOINTS.PROFESSIONALS.FILTER_SEARCH_AUTH
        : API_ENDPOINTS.PROFESSIONALS.FILTER_SEARCH,
      page,
      query,
    );
    return ApiService.post<ProfessionalsFilterBody>(endpoint, payload);
  },
};

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// Maps a raw filter-professional record onto the richer shape the
// Professionals screen and detail page use. The filter endpoint only
// returns a thin slice of a professional's data (no completed-project
// count, portfolio gallery, long-form bio or review list) — those fields
// are synthesized from what IS available (skills, description, cover/avatar
// photo) so the existing detail screen keeps working end-to-end. A real
// "get professional detail" endpoint would be the natural follow-up to
// replace this synthesis with the genuine data.
export function toProfessionalRecord(record: ProfessionalListRecord): ProfessionalRecord {
  const info = record.professionalInfo?.[0];
  const skillNames = info?.skills?.map((s) => s.levelThreeName).filter(Boolean) ?? [];
  const rate = info?.squareFeetRate;
  const gallery = [record.backgroundImage, record.profileImage].filter(
    (g): g is string => !!g,
  );

  return {
    id: record.inviteId,
    slug: info?.professionalSlug || record.inviteId,
    name: record.name.trim(),
    profession: info?.subCategoryName || info?.professionalCategoryName || "Professional",
    category: info?.professionalCategory || "",
    categoryName: info?.professionalCategoryName || "Professional",
    location: record.location?.trim() || record.city || "Kerala, India",
    avatar: record.profileImage || undefined,
    cover: record.backgroundImage || record.profileImage || undefined,
    rating: info?.rating ?? 0,
    reviews: 0,
    verified: info?.verified ?? false,
    experience: info?.experience ?? 0,
    projects: 0,
    price: rate ? `₹${rate}` : "Contact",
    priceUnit: rate ? "sq.ft" : "",
    responds: "within a day",
    tagline: info?.description ? truncate(info.description, 110) : "",
    tags: skillNames.slice(0, 3),
    gallery,
    about: info?.description || `${record.name.trim()} is a HomeDot professional based in ${record.city || "Kerala"}.`,
    services: skillNames.length > 0 ? skillNames : [info?.subCategoryName || "General consultation"],
  };
}

export default ProfessionalsScreenService;
