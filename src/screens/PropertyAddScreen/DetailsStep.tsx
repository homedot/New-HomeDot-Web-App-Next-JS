"use client";

import { useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import LocationMapPicker from "@/components/LocationMapPicker";
import {
  AMENITY_CATALOG,
  BEDROOM_OPTIONS,
  FURNISHING_OPTIONS,
  Field,
  KIND_FIELDS,
  SelectField,
  fieldInputStyle,
  inputWrap,
  isDetailsComplete,
  type ListingPurpose,
  type PropertyFormState,
  type PropertyKind,
} from "./shared";

function NumberField({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
}) {
  return (
    <div style={inputWrap}>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={fieldInputStyle}
      />
      {suffix && (
        <span style={{ fontSize: fontSize.xs, color: colors.muted, flexShrink: 0 }}>{suffix}</span>
      )}
    </div>
  );
}

export default function DetailsStep({
  kind,
  typeName,
  purpose,
  form,
  setForm,
  onBack,
  onContinue,
}: {
  kind: PropertyKind;
  typeName: string;
  purpose: ListingPurpose;
  form: PropertyFormState;
  setForm: (updater: (f: PropertyFormState) => PropertyFormState) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const fields = KIND_FIELDS[kind];
  const has = (key: (typeof fields)[number]) => fields.includes(key);
  const set = <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // "Others" (id 10) is a sentinel — selecting it reveals a text input
  // instead of toggling a real amenity, matching homedot-mobile-app's
  // toggleAmenityOther() behavior.
  const [showCustomAmenity, setShowCustomAmenity] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  const toggleCatalogAmenity = (item: (typeof AMENITY_CATALOG)[number]) => {
    if (item.title === "Others") {
      setShowCustomAmenity((v) => !v);
      return;
    }
    setForm((f) => {
      const exists = f.amenities.some((a) => a.id === item.id);
      return { ...f, amenities: exists ? f.amenities.filter((a) => a.id !== item.id) : [...f.amenities, item] };
    });
  };

  const addCustomAmenity = () => {
    const title = customAmenityInput.trim();
    if (!title) return;
    setForm((f) => ({ ...f, amenities: [...f.amenities, { id: Date.now(), title }] }));
    setCustomAmenityInput("");
  };

  const removeAmenity = (id: number) =>
    setForm((f) => ({ ...f, amenities: f.amenities.filter((a) => a.id !== id) }));

  // Custom amenities the user typed in themselves (ids outside the fixed
  // 1–10 catalog) — rendered as their own removable chips below the catalog.
  const customAmenities = form.amenities.filter((a) => !AMENITY_CATALOG.some((c) => c.id === a.id));

  const valid = isDetailsComplete(kind, form);
  const priceLabel = purpose === "Rent" ? "Rental price" : "Selling price";
  const pricePlaceholder = purpose === "Rent" ? "e.g. 28000" : "e.g. 7600000";

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: fontSize.sm + 0.5,
          fontWeight: 600,
          color: colors.muted,
          marginBottom: spacing.lg,
        }}
      >
        <Icon name="arrowLeft" size={17} /> Back
      </button>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          letterSpacing: "-0.02em",
          marginBottom: spacing.sm,
        }}
      >
        {typeName} details
      </h1>
      <p style={{ fontSize: fontSize.base, color: colors.muted, marginBottom: spacing.xl - 2 }}>
        Tell us about the property — this becomes your listing.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
        <Field label="Listing title">
          <div style={inputWrap}>
            <input
              type="text"
              placeholder="e.g. 3 BHK Villa with private courtyard"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              style={fieldInputStyle}
            />
          </div>
        </Field>

        <Field label="Description">
          <textarea
            placeholder="Describe the property — layout, condition, nearby landmarks…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            style={{
              border: `1.5px solid ${colors.line}`,
              borderRadius: radius.md,
              padding: "14px 16px",
              fontSize: fontSize.base,
              color: colors.ink,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </Field>

        <Field label={priceLabel} hint={purpose === "Rent" ? "Monthly rent, in ₹" : undefined}>
          <div style={inputWrap}>
            <span style={{ color: colors.muted, fontWeight: 600 }}>₹</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={pricePlaceholder}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              style={fieldInputStyle}
            />
          </div>
        </Field>

        <Field label="Location">
          <LocationMapPicker
            value={form.location}
            onChange={(loc) => set("location", loc)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: spacing.md }}>
          <Field label="City">
            <div style={inputWrap}>
              <input
                type="text"
                placeholder="Kochi"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                style={fieldInputStyle}
              />
            </div>
          </Field>
          <Field label="State">
            <div style={inputWrap}>
              <input
                type="text"
                placeholder="Kerala"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                style={fieldInputStyle}
              />
            </div>
          </Field>
          <Field label="Country">
            <div style={inputWrap}>
              <input
                type="text"
                placeholder="India"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                style={fieldInputStyle}
              />
            </div>
          </Field>
        </div>

        {(has("bedrooms") || has("bathrooms") || has("balcony")) && (
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: spacing.md }}>
            {has("bedrooms") && (
              <Field label="Bedrooms">
                <SelectField
                  value={form.bedrooms}
                  onChange={(v) => set("bedrooms", v)}
                  placeholder="Select"
                  options={BEDROOM_OPTIONS.map((b) => `${b} BHK`)}
                />
              </Field>
            )}
            {has("bathrooms") && (
              <Field label="Bathrooms">
                <NumberField
                  value={form.bathrooms}
                  onChange={(v) => set("bathrooms", v)}
                  placeholder="e.g. 2"
                />
              </Field>
            )}
            {has("balcony") && (
              <Field label="Balconies">
                <NumberField
                  value={form.balcony}
                  onChange={(v) => set("balcony", v)}
                  placeholder="e.g. 1"
                />
              </Field>
            )}
          </div>
        )}

        {(has("buildUpArea") || has("carpetArea") || has("plotArea")) && (
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: spacing.md }}>
            {has("buildUpArea") && (
              <Field label="Build-up area">
                <NumberField
                  value={form.buildUpArea}
                  onChange={(v) => set("buildUpArea", v)}
                  placeholder="e.g. 1800"
                  suffix="sq ft"
                />
              </Field>
            )}
            {has("carpetArea") && (
              <Field label="Carpet area">
                <NumberField
                  value={form.carpetArea}
                  onChange={(v) => set("carpetArea", v)}
                  placeholder="e.g. 1500"
                  suffix="sq ft"
                />
              </Field>
            )}
            {has("plotArea") && (
              <Field label="Plot area">
                <NumberField
                  value={form.plotArea}
                  onChange={(v) => set("plotArea", v)}
                  placeholder="e.g. 2400"
                  suffix="sq ft"
                />
              </Field>
            )}
          </div>
        )}

        {(has("length") || has("breadth") || has("roadWidth")) && (
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: spacing.md }}>
            {has("length") && (
              <Field label="Length">
                <NumberField
                  value={form.length}
                  onChange={(v) => set("length", v)}
                  placeholder="e.g. 60"
                  suffix="ft"
                />
              </Field>
            )}
            {has("breadth") && (
              <Field label="Breadth">
                <NumberField
                  value={form.breadth}
                  onChange={(v) => set("breadth", v)}
                  placeholder="e.g. 40"
                  suffix="ft"
                />
              </Field>
            )}
            {has("roadWidth") && (
              <Field label="Road width">
                <NumberField
                  value={form.roadWidth}
                  onChange={(v) => set("roadWidth", v)}
                  placeholder="e.g. 20"
                  suffix="ft"
                />
              </Field>
            )}
          </div>
        )}

        {(has("furnished") || has("noOfFloors") || has("garage") || has("maintenanceCharge")) && (
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: spacing.md }}>
            {has("furnished") && (
              <Field label="Furnishing">
                <SelectField
                  value={form.furnished}
                  onChange={(v) => set("furnished", v)}
                  placeholder="Select"
                  options={FURNISHING_OPTIONS}
                />
              </Field>
            )}
            {has("noOfFloors") && (
              <Field label="No. of floors">
                <NumberField
                  value={form.noOfFloors}
                  onChange={(v) => set("noOfFloors", v)}
                  placeholder="e.g. 2"
                />
              </Field>
            )}
            {has("garage") && (
              <Field label="Parking / garage" hint="Optional">
                <NumberField
                  value={form.garage}
                  onChange={(v) => set("garage", v)}
                  placeholder="e.g. 1"
                />
              </Field>
            )}
            {has("maintenanceCharge") && (
              <Field label="Maintenance charge" hint="Optional, ₹/month">
                <NumberField
                  value={form.maintenanceCharge}
                  onChange={(v) => set("maintenanceCharge", v)}
                  placeholder="e.g. 2000"
                />
              </Field>
            )}
          </div>
        )}

        {has("amenities") && (
          <Field label="Amenities" hint="Select at least one">
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {AMENITY_CATALOG.map((item) => {
                const selected =
                  item.title === "Others" ? showCustomAmenity : form.amenities.some((a) => a.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCatalogAmenity(item)}
                    className="pa-amenity-chip"
                    style={{
                      padding: "9px 15px",
                      borderRadius: radius.full,
                      fontSize: fontSize.sm,
                      fontWeight: 600,
                      border: `1.5px solid ${selected ? colors.primary : colors.line}`,
                      background: selected ? colors.primarySoft : colors.white,
                      color: selected ? colors.primary : colors.ink2,
                    }}
                  >
                    {item.title}
                  </button>
                );
              })}
              {customAmenities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => removeAmenity(a.id)}
                  className="pa-amenity-chip"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 13px 9px 15px",
                    borderRadius: radius.full,
                    fontSize: fontSize.sm,
                    fontWeight: 600,
                    border: `1.5px solid ${colors.primary}`,
                    background: colors.primarySoft,
                    color: colors.primary,
                  }}
                >
                  {a.title}
                  <Icon name="close" size={13} />
                </button>
              ))}
            </div>

            <div
              className="pa-custom-amenity"
              style={{
                height: showCustomAmenity ? 50 : 0,
                opacity: showCustomAmenity ? 1 : 0,
                overflow: "hidden",
                marginTop: showCustomAmenity ? spacing.sm : 0,
              }}
            >
              <div style={{ ...inputWrap, paddingRight: 6 }}>
                <input
                  type="text"
                  placeholder="Name your own amenity, e.g. Rooftop deck"
                  value={customAmenityInput}
                  onChange={(e) => setCustomAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomAmenity();
                    }
                  }}
                  style={fieldInputStyle}
                />
                <button
                  type="button"
                  onClick={addCustomAmenity}
                  disabled={!customAmenityInput.trim()}
                  style={{
                    flexShrink: 0,
                    width: 34,
                    height: 34,
                    borderRadius: radius.sm,
                    background: customAmenityInput.trim() ? colors.primary : colors.line,
                    color: colors.white,
                    display: "grid",
                    placeItems: "center",
                  }}
                  aria-label="Add amenity"
                >
                  <Icon name="check" size={16} color={colors.white} />
                </button>
              </div>
            </div>
          </Field>
        )}
      </div>

      <button
        onClick={() => valid && onContinue()}
        className={`login-cta${valid ? " is-ready" : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          width: "100%",
          height: 52,
          marginTop: spacing.xl,
          borderRadius: radius.md,
          background: colors.primary,
          color: colors.white,
          fontWeight: 600,
          fontSize: fontSize.md - 1,
          opacity: valid ? 1 : 0.5,
        }}
      >
        Continue <Icon name="arrow" size={18} color={colors.white} />
      </button>
    </div>
  );
}
