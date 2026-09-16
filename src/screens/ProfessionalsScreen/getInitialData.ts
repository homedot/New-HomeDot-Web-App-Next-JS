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

// Fetches the category taxonomy and the first page of the (unfiltered, or
// "?category="-filtered) professionals list server-side, reproducing exactly
// what ProfessionalsScreen's own mount effects used to fetch client-side.
// Guest-only: always hits the public FILTER_SEARCH endpoint (no auth token
// exists server-side), same as a signed-out visitor would get today.
export async function getProfessionalsInitialData(
  requestedCategoryId: string | undefined,
): Promise<ProfessionalsInitialData> {
  const categoriesRes = await LandingScreenService.getServiceCategories();
  const categoryOptions =
    categoriesRes.success &&
    categoriesRes.data?.status &&
    categoriesRes.data.data.length > 0
      ? categoriesRes.data.data.map(toServiceCategoryCard)
      : [];

  const category =
    requestedCategoryId &&
    categoryOptions.some((c) => c.id === requestedCategoryId)
      ? requestedCategoryId
      : "all";

  const filterRes = await ProfessionalsScreenService.getProfessionalsFilter(
    1,
    {
      category: category !== "all" ? category : null,
      lat: null,
      long: null,
      sqMin: null,
      sqMax: null,
    },
    { rating: "", minExperience: "", maxExperience: "", professionalType: "" },
  );
  const result = filterRes.data?.data?.[0];
  const professionals =
    filterRes.success && filterRes.data?.status && result
      ? result.data.map(toProfessionalRecord)
      : [];
  const totalRows = result?.totalCount?.total_rows ?? 0;

  return { categoryOptions, category, professionals, totalRows };
}
