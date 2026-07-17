import type { CSSProperties, ReactNode } from "react";
import { colors } from "@/constants/colors";
import { radius, spacing, fontSize } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import type {
  CreatePropertyAmenity,
  CreatePropertyPayload,
  PropertyTypeRecord,
} from "@/services/MarketplaceScreenService";

export type PropertyKind = "villa" | "house" | "flat" | "office" | "plot";

export type ListingPurpose = "Buy" | "Rent";

// An uploaded property photo, lifted from ImagesStep up to index.tsx so the
// Review step can render actual thumbnails instead of just a count — `url`
// is the local blob preview (object URL), `id` the uploaded image's server id.
export interface UploadedImage {
  id: string;
  url: string;
}

export type Step = "purpose" | "type" | "details" | "images" | "review" | "success";

// Drives both the step header/progress indicator and the URL-free wizard
// navigation in index.tsx. "success" is deliberately excluded — it's a
// terminal screen, not a step you progress toward.
export const FLOW_STEPS: { key: Exclude<Step, "success">; label: string; icon: IconName }[] = [
  { key: "purpose", label: "Purpose", icon: "sparkle" },
  { key: "type", label: "Type", icon: "house" },
  { key: "details", label: "Details", icon: "ruler" },
  { key: "images", label: "Photos", icon: "grid" },
  { key: "review", label: "Review", icon: "check" },
];

export type FieldKey =
  | "bedrooms"
  | "bathrooms"
  | "balcony"
  | "furnished"
  | "buildUpArea"
  | "carpetArea"
  | "plotArea"
  | "noOfFloors"
  | "roadWidth"
  | "maintenanceCharge"
  | "garage"
  | "amenities"
  | "length"
  | "breadth";

export const KIND_ICON: Record<PropertyKind, IconName> = {
  villa: "villa",
  house: "house",
  flat: "apartment",
  office: "office",
  plot: "plot",
};

// Mirrors homedot-mobile-app's create_SellProperty_* request bodies — each
// property kind sends the same common fields plus exactly this subset.
export const KIND_FIELDS: Record<PropertyKind, FieldKey[]> = {
  villa: [
    "bedrooms",
    "bathrooms",
    "balcony",
    "furnished",
    "plotArea",
    "buildUpArea",
    "carpetArea",
    "noOfFloors",
    "roadWidth",
    "maintenanceCharge",
    "garage",
    "amenities",
  ],
  flat: [
    "bedrooms",
    "bathrooms",
    "balcony",
    "furnished",
    "buildUpArea",
    "carpetArea",
    "noOfFloors",
    "roadWidth",
    "maintenanceCharge",
    "garage",
    "amenities",
  ],
  house: [
    "bedrooms",
    "bathrooms",
    "balcony",
    "buildUpArea",
    "carpetArea",
    "plotArea",
    "furnished",
    "noOfFloors",
    "garage",
    "roadWidth",
  ],
  office: ["buildUpArea", "carpetArea", "furnished", "noOfFloors", "maintenanceCharge", "garage"],
  plot: ["plotArea", "length", "breadth", "roadWidth"],
};

// The property-type taxonomy is fetched from the API and can label things
// singular or plural ("Villa"/"Villas"), so match loosely rather than by
// exact string the way homedot-mobile-app's screens do.
export function resolveKind(propertyType: string): PropertyKind {
  const n = propertyType.toLowerCase();
  if (n.includes("villa")) return "villa";
  if (n.includes("flat") || n.includes("apartment")) return "flat";
  if (n.includes("office")) return "office";
  if (n.includes("plot")) return "plot";
  return "house";
}

export const BEDROOM_OPTIONS = ["1", "2", "3", "4", "5+"];
// Exact strings the backend expects (matches homedot-mobile-app's sell_Furnishing).
export const FURNISHING_OPTIONS = ["Fully furnished", "Semi furnished", "Un furnished"];

// Matches homedot-mobile-app's hardcoded `sellVillaAmenities` catalog
// (SellOrRentDetailedNextScreen.js) exactly — same ids, same titles, same
// order — since ids are sent to the API as-is (not resolved against any
// server-side catalog). "Others" is a sentinel: selecting it reveals a text
// input instead of toggling a real amenity (see DetailsStep).
export const AMENITY_CATALOG: CreatePropertyAmenity[] = [
  { id: 1, title: "Club House" },
  { id: 2, title: "Individual Garden" },
  { id: 3, title: "Kids Play Area" },
  { id: 4, title: "Open Party Area" },
  { id: 5, title: "Swimming Pool" },
  { id: 6, title: "Health Club" },
  { id: 7, title: "Centralized Security" },
  { id: 8, title: "Gazebo" },
  { id: 9, title: "Yoga & Meditation" },
  { id: 10, title: "Others" },
];

// "5+" has no exact BHK value server-side — same 4_PLUS_BHK convention used
// by MarketplaceScreen's filter payload. `beds` here is whatever the
// Bedrooms <select> stores, which is the display label itself (e.g. "2 BHK",
// from BEDROOM_OPTIONS.map(b => `${b} BHK`) in DetailsStep) — strip that
// suffix back off before building the enum, or bedroomsToApi("2 BHK") would
// otherwise produce the malformed "2 BHK_BHK".
export function bedroomsToApi(beds: string): string {
  const n = beds.replace(/\s*BHK$/i, "").trim();
  return n === "5+" ? "4_PLUS_BHK" : `${n}_BHK`;
}

export const inputWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm + 2,
  height: 50,
  border: `1.5px solid ${colors.line}`,
  borderRadius: radius.md,
  padding: "0 14px",
  background: colors.white,
};

export const fieldInputStyle: CSSProperties = {
  border: "none",
  outline: "none",
  background: "none",
  width: "100%",
  fontSize: fontSize.base,
  color: colors.ink,
};

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
      <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.ink }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: fontSize.xs, color: colors.muted }}>{hint}</span>}
    </label>
  );
}

export function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div style={{ ...inputWrap, position: "relative", paddingRight: 38 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...fieldInputStyle, appearance: "none", cursor: "pointer" }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: colors.muted,
          fontSize: 11,
        }}
      >
        ▾
      </span>
    </div>
  );
}

export interface PropertyFormState {
  title: string;
  description: string;
  price: string;
  location: { address: string; lat: number; lng: number } | null;
  city: string;
  state: string;
  country: string;
  bedrooms: string;
  bathrooms: string;
  balcony: string;
  furnished: string;
  buildUpArea: string;
  carpetArea: string;
  plotArea: string;
  noOfFloors: string;
  roadWidth: string;
  maintenanceCharge: string;
  garage: string;
  amenities: CreatePropertyAmenity[];
  length: string;
  breadth: string;
}

export const initialFormState: PropertyFormState = {
  title: "",
  description: "",
  price: "",
  location: null,
  city: "",
  state: "",
  country: "India",
  bedrooms: "",
  bathrooms: "",
  balcony: "",
  furnished: "",
  buildUpArea: "",
  carpetArea: "",
  plotArea: "",
  noOfFloors: "",
  roadWidth: "",
  maintenanceCharge: "",
  garage: "",
  amenities: [],
  length: "",
  breadth: "",
};

// True once every field KIND_FIELDS[kind] requires (plus the always-common
// ones) has a value — gates the "Continue" button on the details step.
export function isDetailsComplete(kind: PropertyKind, f: PropertyFormState): boolean {
  if (!f.title.trim() || !f.description.trim() || !f.price.trim()) return false;
  if (!f.location || !f.city.trim() || !f.state.trim() || !f.country.trim()) return false;

  const fields = KIND_FIELDS[kind];
  const need = (key: FieldKey) => !fields.includes(key) || !!f[key as keyof PropertyFormState];
  // Amenities is an array, so the generic truthy `need()` check above can't
  // gate it (an empty array is still truthy) — mirrors homedot-mobile-app's
  // validation(), which requires at least one amenity for Villas/Flat &
  // Apartment specifically (not House, Office Space or Plots).
  if (fields.includes("amenities") && f.amenities.length === 0) return false;
  return (
    need("bedrooms") &&
    need("bathrooms") &&
    need("balcony") &&
    need("furnished") &&
    need("buildUpArea") &&
    need("carpetArea") &&
    need("plotArea") &&
    need("noOfFloors") &&
    need("roadWidth") &&
    need("length") &&
    need("breadth")
    // maintenanceCharge and garage are left optional — mirrors
    // homedot-mobile-app, which doesn't hard-require them either.
  );
}

// Builds the wire payload for both property/create and property/update-info
// (and their rent equivalents) — homedot-mobile-app sends byte-for-byte the
// same shape for create and edit, just against a different endpoint. Shared
// by PropertyAddScreen (create) and MyPropertyScreen's edit flow.
export function buildPropertyPayload(
  propertyType: PropertyTypeRecord,
  form: PropertyFormState,
  imageIds: string[],
): CreatePropertyPayload {
  const kind = resolveKind(propertyType.propertyType);
  const fields = KIND_FIELDS[kind];
  const has = (key: (typeof fields)[number]) => fields.includes(key);
  const num = (v: string) => (v.trim() ? parseInt(v, 10) : undefined);
  const location = form.location;

  return {
    property_name: form.title.trim(),
    property_ad_title: form.title.trim(),
    description: form.description.trim(),
    property_state: form.state.trim(),
    property_district: form.city.trim(),
    listed_by: "owner",
    property_location: location?.address ?? "",
    property_sub_location: location?.address ?? "",
    property_city: form.city.trim(),
    property_country: form.country.trim(),
    google_address_string: location?.address ?? "",
    latitude: location?.lat ?? 0,
    longitude: location?.lng ?? 0,
    property_type: propertyType._id,
    price: num(form.price) ?? 0,
    property_images: imageIds,
    bedrooms: has("bedrooms") && form.bedrooms ? bedroomsToApi(form.bedrooms) : undefined,
    bathrooms: has("bathrooms") ? num(form.bathrooms) : undefined,
    balcony: has("balcony") ? num(form.balcony) : undefined,
    furnished: has("furnished") ? form.furnished || undefined : undefined,
    build_up_area: has("buildUpArea") ? num(form.buildUpArea) : undefined,
    carpet_area: has("carpetArea") ? num(form.carpetArea) : undefined,
    plot_area: has("plotArea") ? num(form.plotArea) : undefined,
    no_of_floors: has("noOfFloors") ? num(form.noOfFloors) : undefined,
    road_width: has("roadWidth") ? num(form.roadWidth) : undefined,
    maintenanceCharge: has("maintenanceCharge") ? num(form.maintenanceCharge) : undefined,
    garage: has("garage") ? num(form.garage) : undefined,
    amenities: has("amenities") && form.amenities.length ? form.amenities : undefined,
    length: has("length") ? num(form.length) : undefined,
    breadth: has("breadth") ? num(form.breadth) : undefined,
  };
}

// Horizontal step indicator shown above every step but the success screen —
// filled dots + connecting lines animate as the wizard progresses, so
// filling out the listing reads as working through a real, trackable form
// rather than a series of disconnected screens.
export function StepProgress({ currentIndex }: { currentIndex: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: spacing.xxl }}>
      {FLOW_STEPS.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "flex-start", flex: i < FLOW_STEPS.length - 1 ? 1 : undefined }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <span
              className="pa-step-dot"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: i <= currentIndex ? colors.primary : colors.card,
                color: i <= currentIndex ? colors.white : colors.muted,
                border: `2px solid ${i <= currentIndex ? colors.primary : colors.line}`,
                transform: i === currentIndex ? "scale(1.12)" : "scale(1)",
                boxShadow: i === currentIndex ? `0 0 0 4px ${colors.primarySoft}` : "none",
              }}
            >
              {i < currentIndex ? <Icon name="check" size={16} /> : <Icon name={s.icon} size={15} />}
            </span>
            <span
              style={{
                fontSize: fontSize.xs,
                fontWeight: 600,
                color: i <= currentIndex ? colors.ink : colors.muted,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
          </div>
          {i < FLOW_STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                marginTop: 17,
                marginInline: 6,
                background: colors.line,
                position: "relative",
                overflow: "hidden",
                borderRadius: 2,
              }}
            >
              <span
                className="pa-step-line-fill"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: colors.primary,
                  transform: `scaleX(${i < currentIndex ? 1 : 0})`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
