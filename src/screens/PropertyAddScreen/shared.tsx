import type { CSSProperties, ReactNode } from "react";
import { colors } from "@/constants/colors";
import { radius, spacing, fontSize } from "@/utils/size";
import type { IconName } from "@/components/Icon";

export type PropertyKind = "villa" | "house" | "flat" | "office" | "plot";

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

// "5+" has no exact BHK value server-side — same 4_PLUS_BHK convention used
// by MarketplaceScreen's filter payload.
export function bedroomsToApi(beds: string): string {
  return beds === "5+" ? "4_PLUS_BHK" : `${beds}_BHK`;
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
  amenities: string[];
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
    // maintenanceCharge, garage and amenities are left optional — mirrors
    // homedot-mobile-app, which doesn't hard-require them either.
  );
}
