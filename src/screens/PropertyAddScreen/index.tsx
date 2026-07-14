"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, maxWidth, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import MarketplaceScreenService, {
  type CreatePropertyPayload,
  type PropertyTypeRecord,
} from "@/services/MarketplaceScreenService";
import PurposeStep from "./PurposeStep";
import TypeStep from "./TypeStep";
import DetailsStep from "./DetailsStep";
import ImagesStep from "./ImagesStep";
import ReviewStep from "./ReviewStep";
import {
  FLOW_STEPS,
  KIND_FIELDS,
  StepProgress,
  bedroomsToApi,
  initialFormState,
  resolveKind,
  type ListingPurpose,
  type PropertyFormState,
  type Step,
  type UploadedImage,
} from "./shared";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

function buildPayload(
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

export default function PropertyAddScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("purpose");
  const [purpose, setPurpose] = useState<ListingPurpose>("Buy");
  const [propertyType, setPropertyType] = useState<PropertyTypeRecord | null>(null);
  const [form, setForm] = useState<PropertyFormState>(initialFormState);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = FLOW_STEPS.findIndex((s) => s.key === step);

  const submit = async () => {
    if (!propertyType) return;
    setSubmitting(true);
    setError(null);
    const res = await MarketplaceScreenService.createProperty(
      buildPayload(propertyType, form, images.map((i) => i.id)),
      purpose,
    );
    setSubmitting(false);
    if (!res.success || !res.data?.status) {
      setError(res.data?.message || res.message || "Couldn't publish your listing. Please try again.");
      return;
    }
    setStep("success");
    setTimeout(() => router.push("/marketplace"), 1600);
  };

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />

      <section style={{ ...wrap, padding: `${spacing.xxl}px ${spacing.xl}px ${spacing.huge}px` }}>
        <div
          className="pa-form-card"
          style={{
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.lg,
            padding: "clamp(24px, 4vw, 44px)",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          {step !== "success" && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.md,
                  marginBottom: spacing.xl,
                }}
              >
                <span style={{ fontSize: fontSize.xs, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.muted }}>
                  List your property
                </span>
                <span
                  style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    color: colors.primary,
                    background: colors.primarySoft,
                    padding: "4px 11px",
                    borderRadius: radius.full,
                  }}
                >
                  Step {stepIndex + 1} of {FLOW_STEPS.length}
                </span>
              </div>
              <StepProgress currentIndex={stepIndex} />
            </>
          )}

          <Reveal key={step}>
            {step === "purpose" && (
              <PurposeStep
                onSelect={(p) => {
                  setPurpose(p);
                  setStep("type");
                }}
              />
            )}

            {step === "type" && (
              <TypeStep
                onBack={() => setStep("purpose")}
                onSelect={(t) => {
                  setPropertyType(t);
                  setStep("details");
                }}
              />
            )}

            {step === "details" && propertyType && (
              <DetailsStep
                kind={resolveKind(propertyType.propertyType)}
                typeName={propertyType.propertyType}
                purpose={purpose}
                form={form}
                setForm={setForm}
                onBack={() => setStep("type")}
                onContinue={() => setStep("images")}
              />
            )}

            {step === "images" && (
              <ImagesStep
                setImages={setImages}
                onBack={() => setStep("details")}
                onContinue={() => setStep("review")}
              />
            )}

            {step === "review" && propertyType && (
              <ReviewStep
                typeName={propertyType.propertyType}
                purpose={purpose}
                form={form}
                images={images}
                submitting={submitting}
                error={error}
                onBack={() => setStep("images")}
                onSubmit={submit}
              />
            )}

            {step === "success" && (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span className="pa-success-ring" style={{ position: "relative", marginBottom: spacing.xl - 4 }}>
                  <span
                    className="pa-success-glow"
                    style={{
                      position: "absolute",
                      inset: -18,
                      borderRadius: "50%",
                      background: "#1F8A5B",
                      filter: "blur(28px)",
                      opacity: 0.28,
                    }}
                  />
                  <span
                    style={{
                      position: "relative",
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      background: "rgba(31,138,91,0.13)",
                      color: "#1F8A5B",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="check" size={44} strokeWidth={2.4} />
                  </span>
                </span>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 26,
                    letterSpacing: "-0.02em",
                    marginBottom: spacing.sm,
                  }}
                >
                  Listing published!
                </h1>
                <p style={{ color: colors.muted }}>
                  Your {purpose === "Rent" ? "rental" : "sale"} listing is live. Taking you to the marketplace…
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
