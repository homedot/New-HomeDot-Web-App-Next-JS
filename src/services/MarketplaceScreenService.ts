import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";
import { getAuthToken } from "@/utils/authStorage";
import type { MarketplaceProperty } from "@/screens/MarketplaceScreen/data";

export interface PropertiesFilterPayload {
  min: number | null;
  max: number | null;
  address: string | null;
  featured: boolean;
  bedrooms: string | null;
  bathrooms: number | null;
  cities: string[] | null;
  propertyType: string | null;
}

export interface PropertyTypeRecord {
  _id: string;
  propertyType: string;
  propertyTypeSlug?: string;
  propertyTypeCategory?: string;
  propertyCount?: number;
}

export interface PropertyTypesBody {
  status: boolean;
  message: string;
  data: PropertyTypeRecord[];
}

export interface PropertyImageRecord {
  imageFile: string;
  _id: string;
}

export interface PropertyRecord {
  _id: string;
  propertySlug: string;
  propertyAdTitle: string;
  propertyLocation: string;
  propertySubLocation: string;
  propertyCity: string;
  propertyCountry: string;
  bedrooms: string;
  price: number;
  propertyImages: PropertyImageRecord[];
  buildUpArea?: number;
  bathrooms: number;
  status: string;
  // Present on properties-filter list records; absent on similarProperties
  // records (see toMarketplaceProperty's fallback).
  propertyType?: string;
}

export interface PropertiesFilterPage {
  totalCount: { total_rows: number };
  data: PropertyRecord[];
  currentPage: number;
  totalPages: number;
}

export interface PropertiesFilterBody {
  status: boolean;
  message: string;
  data: PropertiesFilterPage[];
}

export interface PropertyTypeDetailRecord {
  _id: string;
  propertyType: string;
  propertyTypeCategory?: string;
}

export interface PropertyDetailRecord {
  _id: string;
  propertySlug: string;
  propertyAdTitle: string;
  description?: string;
  propertyLocation: string;
  propertySubLocation: string;
  propertyCity: string;
  propertyCountry: string;
  // Absent on Plots (no bedrooms/bathrooms/buildUpArea at all — see plotArea
  // /length/breadth instead).
  bedrooms?: string;
  price: number;
  propertyImages: PropertyImageRecord[];
  buildUpArea?: number;
  carpetArea?: number;
  noOfFloors?: number;
  roadWidth?: number;
  maintenanceCharge?: number;
  garage?: number;
  balcony?: number;
  furnished?: string;
  listedBy?: string;
  plotArea?: number;
  length?: number;
  breadth?: number;
  bathrooms?: number;
  // Inconsistent across records — sometimes a double-JSON-encoded string
  // (with or without a `checked` flag), sometimes a plain array of
  // { amenityId, title, _id } objects, sometimes just []. See parseAmenities.
  amenities?: unknown[];
  status: string;
  featured?: boolean;
  propertyTypeDetails?: PropertyTypeDetailRecord[];
}

export interface PropertyDetailEntry {
  propertyDetails: PropertyDetailRecord[];
  similarProperties: PropertyRecord[];
}

export interface PropertyDetailBody {
  status: boolean;
  message: string;
  data: PropertyDetailEntry[];
}

export interface ImageUploadRecord {
  _id: string;
  imageFile?: string;
}

export interface ImageUploadBody {
  status: boolean;
  message: string;
  data: ImageUploadRecord;
}

// Wire payload for property/create and rent/create — field names match
// homedot-mobile-app's create_SellProperty_* / create_RentProperty_* request
// bodies exactly (same backend, same shape for both purposes — only the
// endpoint differs, see `createProperty` below). Every screen sends the same
// common fields plus whichever subset applies to its property kind (see
// KIND_FIELDS in PropertyAddScreen/shared.tsx); the rest are left undefined
// and JSON.stringify drops them, so one shape covers every kind.
export interface CreatePropertyAmenity {
  id: number;
  title: string;
}

export interface CreatePropertyPayload {
  property_name: string;
  property_ad_title: string;
  description: string;
  property_state: string;
  property_district: string;
  listed_by: "owner";
  property_location: string;
  property_sub_location: string;
  property_city: string;
  property_country: string;
  google_address_string: string;
  latitude: number;
  longitude: number;
  property_type: string;
  price: number;
  property_images: string[];
  bedrooms?: string;
  bathrooms?: number;
  balcony?: number;
  furnished?: string;
  build_up_area?: number;
  carpet_area?: number;
  plot_area?: number;
  no_of_floors?: number;
  road_width?: number;
  maintenanceCharge?: number;
  garage?: number;
  // Plain array of {id, title} objects — matches homedot-mobile-app's
  // `selectedAmenities` exactly (locally-generated ids, not server ids; sent
  // as a raw array, never JSON-stringified). See MarketPlaceServices.js.
  amenities?: CreatePropertyAmenity[];
  length?: number;
  breadth?: number;
}

export interface CreatePropertyRecord {
  _id: string;
  propertySlug?: string;
}

export interface CreatePropertyBody {
  status: boolean;
  message: string;
  data: CreatePropertyRecord[];
}

// All Marketplace screen API calls live here. The screen only ever imports
// this file — never ApiService or fetch directly.
export const MarketplaceScreenService = {
  // Signed-in users hit the auth-scoped endpoint (personalized results);
  // guests fall back to the public one. "Buy" and "Rent" are separate APIs
  // server-side, but share the exact same request body/response shape.
  getPropertiesFilter: (
    page: number,
    filters: PropertiesFilterPayload,
    purpose: "Buy" | "Rent" = "Buy",
  ): Promise<ApiResponse<PropertiesFilterBody>> => {
    const authed = !!getAuthToken();
    const endpoint =
      purpose === "Rent"
        ? authed
          ? API_ENDPOINTS.MARKETPLACE.FILTER_RENT_PROPERTY(page)
          : API_ENDPOINTS.MARKETPLACE.RENT_PROPERTIES_FILTER(page)
        : authed
          ? API_ENDPOINTS.MARKETPLACE.FILTER_SELL_PROPERTY(page)
          : API_ENDPOINTS.MARKETPLACE.PROPERTIES_FILTER(page);
    return ApiService.post<PropertiesFilterBody>(endpoint, filters);
  },

  // Guest-accessible — no auth required.
  getPropertyBySlug: (slug: string): Promise<ApiResponse<PropertyDetailBody>> =>
    ApiService.get<PropertyDetailBody>(
      API_ENDPOINTS.MARKETPLACE.PROPERTY_BY_SLUG(slug),
    ),

  // Guest-accessible — no auth required.
  getPropertyTypes: (): Promise<ApiResponse<PropertyTypesBody>> =>
    ApiService.get<PropertyTypesBody>(API_ENDPOINTS.MARKETPLACE.PROPERTY_TYPES),

  // Requires a stored auth token. One file per call, matching the mobile
  // app's per-image multipart upload (field name "image").
  uploadPropertyImage: (file: File): Promise<ApiResponse<ImageUploadBody>> => {
    const form = new FormData();
    form.append("image", file);
    return ApiService.post<ImageUploadBody>(API_ENDPOINTS.COMMON.IMAGE_UPLOAD, form);
  },

  // Requires a stored auth token. "Buy" and "Rent" are separate create
  // endpoints server-side (mirrors homedot-mobile-app's CREATE_SELL_PROPERTY
  // vs CREATE_RENTAL_PROPERTY) but take the exact same request body shape.
  createProperty: (
    payload: CreatePropertyPayload,
    purpose: "Buy" | "Rent" = "Buy",
  ): Promise<ApiResponse<CreatePropertyBody>> =>
    ApiService.post<CreatePropertyBody>(
      purpose === "Rent"
        ? API_ENDPOINTS.MARKETPLACE.CREATE_RENTAL_PROPERTY
        : API_ENDPOINTS.MARKETPLACE.CREATE_PROPERTY,
      payload,
    ),
};

interface AmenityLike {
  title?: string;
  checked?: boolean;
}

// The API has been observed sending `amenities` in three different shapes:
//   1. ["[{\"id\":1,\"title\":\"Club House\",\"checked\":true}, ...]"]  (double-JSON-encoded, may omit `checked`)
//   2. [{ amenityId, title, _id }, ...]                                 (plain array of objects)
//   3. []                                                               (none set)
// Normalize all three into a flat string[] of amenity titles.
function parseAmenities(raw: unknown[] | undefined): string[] {
  if (!raw || raw.length === 0) return [];

  let items: AmenityLike[];
  if (typeof raw[0] === "string") {
    try {
      const parsed = JSON.parse(raw[0]);
      items = Array.isArray(parsed) ? parsed : [];
    } catch {
      items = [];
    }
  } else {
    items = raw as AmenityLike[];
  }

  // Only exclude entries explicitly marked unchecked — most shapes don't
  // carry a `checked` flag at all, and absence should mean "included".
  return items
    .filter((a) => a.checked !== false && a.title)
    .map((a) => a.title as string);
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";

function formatPriceINR(amount: number): string {
  if (amount >= 1e7)
    return `₹${(amount / 1e7).toFixed(amount % 1e7 === 0 ? 0 : 2)} Cr`;
  if (amount >= 1e5)
    return `₹${(amount / 1e5).toFixed(amount % 1e5 === 0 ? 0 : 2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function titleCase(text: string): string {
  return text.replace(
    /\w\S*/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
}

function parseBeds(bedrooms: string | undefined): number {
  const m = /^(\d+)/.exec(bedrooms ?? "");
  return m ? parseInt(m[1], 10) : 0;
}

function extractImages(images: PropertyImageRecord[] | undefined): string[] {
  const urls = images?.map((i) => i.imageFile).filter(Boolean) ?? [];
  return urls.length ? urls : [FALLBACK_IMAGE];
}

// Maps a raw /property/properties-filter (or /rent/properties-filter, or
// similarProperties) record onto the MarketplaceProperty shape the screen
// already renders.
export function toMarketplaceProperty(
  record: PropertyRecord,
  purpose: "Buy" | "Rent" = "Buy",
): MarketplaceProperty {
  const gallery = extractImages(record.propertyImages);
  return {
    id: record._id,
    propertySlug: record.propertySlug,
    status:
      record.status === "Listed"
        ? purpose === "Rent"
          ? "For Rent"
          : "For Sale"
        : record.status,
    purpose,
    category: record.propertyType || "Property",
    title: record.propertyAdTitle.trim(),
    location: (
      record.propertySubLocation ||
      record.propertyLocation ||
      ""
    ).trim(),
    city: titleCase(record.propertyCity || ""),
    beds: parseBeds(record.bedrooms),
    baths: record.bathrooms ?? 0,
    area: record.buildUpArea ?? 0,
    price: formatPriceINR(record.price ?? 0),
    img: gallery[0],
    gallery,
    desc: "",
    amenities: [],
  };
}

// Maps a raw guest/get-property/{slug} propertyDetails[0] record — richer
// than the list shape: real description, parsed amenities, and the readable
// category name (nested under propertyTypeDetails, since propertyType here
// is just an id).
export function toMarketplacePropertyDetail(
  record: PropertyDetailRecord,
): MarketplaceProperty {
  const gallery = extractImages(record.propertyImages);
  return {
    id: record._id,
    propertySlug: record.propertySlug,
    status: record.status === "Listed" ? "For Sale" : record.status,
    purpose: "Buy",
    category: record.propertyTypeDetails?.[0]?.propertyType || "Property",
    title: record.propertyAdTitle.trim(),
    location: (
      record.propertySubLocation ||
      record.propertyLocation ||
      ""
    ).trim(),
    city: titleCase(record.propertyCity || ""),
    beds: parseBeds(record.bedrooms),
    baths: record.bathrooms ?? 0,
    area: record.buildUpArea ?? record.plotArea ?? 0,
    areaUnit:
      record.buildUpArea == null && record.plotArea != null
        ? "sqft plot"
        : undefined,
    price: formatPriceINR(record.price ?? 0),
    img: gallery[0],
    gallery,
    desc: record.description?.trim() || "",
    amenities: parseAmenities(record.amenities),
    carpetArea: record.carpetArea,
    noOfFloors: record.noOfFloors,
    roadWidth: record.roadWidth,
    maintenanceCharge: record.maintenanceCharge,
    garage: record.garage,
    balcony: record.balcony,
    furnished: record.furnished,
    listedBy: record.listedBy,
    plotArea: record.plotArea,
    length: record.length,
    breadth: record.breadth,
  };
}

export default MarketplaceScreenService;
