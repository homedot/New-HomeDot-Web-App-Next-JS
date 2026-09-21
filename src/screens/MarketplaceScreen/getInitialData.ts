import MarketplaceScreenService, {
  toMarketplaceProperty,
  toMarketplacePropertyDetail,
  type PropertiesFilterPayload,
  type PropertyTypeRecord,
} from "@/services/MarketplaceScreenService";
import type { MarketplaceProperty } from "./data";

export interface MarketplaceInitialData {
  propertyTypeOptions: PropertyTypeRecord[];
  selectedPropertyType: PropertyTypeRecord | null;
  apiProperties: MarketplaceProperty[];
  page: number;
  totalPages: number;
  detail: MarketplaceProperty | null;
  detailSimilar: MarketplaceProperty[] | null;
}

const NEUTRAL_FILTERS: PropertiesFilterPayload = {
  min: null,
  max: null,
  address: null,
  featured: false,
  bedrooms: null,
  bathrooms: null,
  cities: null,
  propertyType: null,
};

// Fetches everything MarketplaceScreen's own mount effects used to fetch
// client-side — property type taxonomy (+ per-type Buy counts), the default
// listing (page 1, "Buy", optionally pre-filtered by "?propertyType="), and
// a "?property=<slug>" deep-linked detail — all server-side, guest-only (no
// auth token exists server-side, so this always hits the public endpoints,
// same as a signed-out visitor gets today).
export async function getMarketplaceInitialData(
  requestedPropertyTypeId: string | undefined,
  requestedPropertySlug: string | undefined,
): Promise<MarketplaceInitialData> {
  const typesRes = await MarketplaceScreenService.getPropertyTypes();
  const propertyTypes =
    typesRes.success && typesRes.data?.status ? typesRes.data.data : [];

  const selectedPropertyType = requestedPropertyTypeId
    ? (propertyTypes.find((t) => t._id === requestedPropertyTypeId) ?? null)
    : null;

  const [countResults, listingRes, detailRes] = await Promise.all([
    Promise.all(
      propertyTypes.map((t) =>
        MarketplaceScreenService.getPropertiesFilter(
          1,
          { ...NEUTRAL_FILTERS, propertyType: t._id },
          "Buy",
        ).then(
          (res) =>
            [
              t._id,
              res.success && res.data?.status
                ? (res.data.data[0]?.totalCount?.total_rows ?? 0)
                : null,
            ] as const,
        ),
      ),
    ),
    MarketplaceScreenService.getPropertiesFilter(
      1,
      { ...NEUTRAL_FILTERS, propertyType: selectedPropertyType?._id ?? null },
      "Buy",
    ),
    requestedPropertySlug
      ? MarketplaceScreenService.getPropertyBySlug(requestedPropertySlug)
      : Promise.resolve(null),
  ]);

  const counts = new Map(countResults);
  const propertyTypeOptions = propertyTypes.map((t) => {
    const count = counts.get(t._id);
    return count == null ? t : { ...t, propertyCount: count };
  });

  const listingResult = listingRes.data?.data?.[0];
  const apiProperties =
    listingRes.success && listingRes.data?.status && listingResult
      ? listingResult.data.map((r) => toMarketplaceProperty(r, "Buy"))
      : [];
  const page = listingResult?.currentPage ?? 1;
  const totalPages = listingResult?.totalPages ?? 1;

  let detail: MarketplaceProperty | null = null;
  let detailSimilar: MarketplaceProperty[] | null = null;
  let entry = detailRes?.data?.data?.[0];
  let detailPurpose: "Buy" | "Rent" = "Buy";
  // A shared link doesn't say whether it's a sale or rent listing; the sell
  // route returns an empty propertyDetails for rent slugs, so try rent next.
  if (requestedPropertySlug && !entry?.propertyDetails?.[0]) {
    const rentRes = await MarketplaceScreenService.getPropertyBySlug(
      requestedPropertySlug,
      "Rent",
    );
    const rentEntry = rentRes.data?.data?.[0];
    if (rentEntry?.propertyDetails?.[0]) {
      entry = rentEntry;
      detailPurpose = "Rent";
    }
  }
  const record = entry?.propertyDetails?.[0];
  if (record) {
    detail = toMarketplacePropertyDetail(record, detailPurpose);
    if (entry?.similarProperties?.length) {
      detailSimilar = entry.similarProperties.map((r) =>
        toMarketplaceProperty(r, detailPurpose),
      );
    }
  }

  return {
    propertyTypeOptions,
    selectedPropertyType,
    apiProperties,
    page,
    totalPages,
    detail,
    detailSimilar,
  };
}
