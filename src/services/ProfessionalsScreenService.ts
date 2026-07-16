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

const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Curated, trade-matched stand-ins for professionals who haven't uploaded a
// cover photo yet — reuses the same Unsplash photos already vetted
// elsewhere in this app (ProfessionalsScreen/data.ts's mock professionals,
// the landing page blog cards) so a missing photo reads as an intentional,
// attractive placeholder rather than a blank box or a bare icon.
const FALLBACK_COVERS = {
  architecture: unsplash("1487958449943-2429e8be8625"),
  interior: unsplash("1618221195710-dd6b41faaea6"),
  contractor: unsplash("1503387762-592deb58ef4e"),
  civil: unsplash("1581094794329-c8112a89af12"),
  kitchen: unsplash("1556911220-bff31c812dba"),
  landscape: unsplash("1558904541-efa843a96f01"),
  electrical: unsplash("1621905251918-48416bd8575a"),
  legal: unsplash("1450101499163-c8848c66ca85"),
  financial: unsplash("1554224155-6726b3ff858f"),
  generic: unsplash("1504307651254-35680f356dfd"),
} as const;

const FALLBACK_POOL = Object.values(FALLBACK_COVERS);

// Picks a photo that matches the professional's trade where possible, and
// otherwise a stable-but-varied one from the pool (hashed off an id, not
// random) so reloading the same page never flickers to a different image
// and a page of unrelated professionals doesn't all show the same photo.
function pickFallbackCover(categoryName: string, seed: string): string {
  const n = categoryName.toLowerCase();
  if (n.includes("architect") || n.includes("engineer")) return FALLBACK_COVERS.architecture;
  if (n.includes("interior")) return FALLBACK_COVERS.interior;
  if (n.includes("contractor") || n.includes("builder") || n.includes("construction")) return FALLBACK_COVERS.contractor;
  if (n.includes("civil") || n.includes("structural")) return FALLBACK_COVERS.civil;
  if (n.includes("kitchen") || n.includes("bath")) return FALLBACK_COVERS.kitchen;
  if (n.includes("landscape") || n.includes("garden")) return FALLBACK_COVERS.landscape;
  if (n.includes("electric") || n.includes("automation") || n.includes("wiring")) return FALLBACK_COVERS.electrical;
  if (n.includes("legal")) return FALLBACK_COVERS.legal;
  if (n.includes("financ")) return FALLBACK_COVERS.financial;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_POOL[hash % FALLBACK_POOL.length];
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
  const categoryName = info?.professionalCategoryName || "Professional";
  const gallery = [record.backgroundImage, record.profileImage].filter(
    (g): g is string => !!g,
  );
  if (gallery.length === 0) {
    // Second photo is always the next one in the pool (not re-matched by
    // category) so the two fallback gallery tiles are never identical.
    const first = pickFallbackCover(categoryName, record.inviteId);
    const second = FALLBACK_POOL[(FALLBACK_POOL.indexOf(first) + 1) % FALLBACK_POOL.length];
    gallery.push(first, second);
  }

  return {
    id: record.inviteId,
    slug: info?.professionalSlug || record.inviteId,
    name: record.name.trim(),
    profession: info?.subCategoryName || info?.professionalCategoryName || "Professional",
    category: info?.professionalCategory || "",
    categoryName,
    location: record.location?.trim() || record.city || "Kerala, India",
    avatar: record.profileImage || undefined,
    cover: record.backgroundImage || record.profileImage || pickFallbackCover(categoryName, record.inviteId),
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
