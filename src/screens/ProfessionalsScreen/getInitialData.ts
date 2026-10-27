import LandingScreenService, {
  toServiceCategoryCard,
  type ServiceCategoryCard,
} from "@/services/LandingScreenService";
import ProfessionalsScreenService, {
  toProfessionalRecord,
} from "@/services/ProfessionalsScreenService";
import type { ProfessionalRecord } from "./data";

export interface ProfessionalsInitialData {
  categoryOptions: ServiceCategoryCard[];
  category: string;
  professionals: ProfessionalRecord[];
  totalRows: number;
}

const NEUTRAL_FILTER_PAYLOAD = {
  rating: "",
  minExperience: "",
  maxExperience: "",
  professionalType: "",
} as const;

function fetchProfessionalsPage1(category: string | null) {
  return ProfessionalsScreenService.getProfessionalsFilter(
    1,
    { category, lat: null, long: null, sqMin: null, sqMax: null },
    NEUTRAL_FILTER_PAYLOAD,
  );
}

// Fetches the category taxonomy and the first page of the (unfiltered, or
// "?category="-filtered) professionals list server-side, reproducing exactly
// what ProfessionalsScreen's own mount effects used to fetch client-side.
// Guest-only: always hits the public FILTER_SEARCH endpoint (no auth token
// exists server-side), same as a signed-out visitor would get today.
//
// The two backend calls have no real dependency on each other — the filter
// call only needs `requestedCategoryId` validated against the taxonomy when
// a "?category=" is actually present — so they're issued in parallel rather
// than one after the other, which was roughly doubling this page's time to
// first byte. The optimistic filter call is redone (serially, this once)
// only in the rare case of a stale/unknown category id in the URL.
export async function getProfessionalsInitialData(
  requestedCategoryId: string | undefined,
): Promise<ProfessionalsInitialData> {
  const [categoriesRes, optimisticFilterRes] = await Promise.all([
    LandingScreenService.getServiceCategories(),
    fetchProfessionalsPage1(requestedCategoryId ?? null),
  ]);

  const categoryOptions =
    categoriesRes.success &&
    categoriesRes.data?.status &&
    categoriesRes.data.data.length > 0
      ? categoriesRes.data.data.map(toServiceCategoryCard)
      : [];

  const requestedCategoryValid =
    !requestedCategoryId ||
    categoryOptions.some((c) => c.id === requestedCategoryId);
  const category =
    requestedCategoryValid && requestedCategoryId ? requestedCategoryId : "all";

  const filterRes = requestedCategoryValid
    ? optimisticFilterRes
    : await fetchProfessionalsPage1(null);

  const result = filterRes.data?.data?.[0];
  const professionals =
    filterRes.success && filterRes.data?.status && result
      ? result.data.map(toProfessionalRecord)
      : [];
  const totalRows = result?.totalCount?.total_rows ?? 0;

  return { categoryOptions, category, professionals, totalRows };
}
