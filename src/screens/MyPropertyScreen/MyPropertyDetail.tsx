"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import Reveal from "@/components/Reveal";
import { DEFAULT_MAP_CENTER } from "@/constants/MapConstants";
import { loadGoogleMapsScript } from "@/utils/loadGoogleMapsScript";
import { parseAddressComponents } from "@/components/LocationMapPicker";
import MarketplaceScreenService, {
  parseAmenities,
  type PropertyDetailRecord,
  type PropertyTypeRecord,
} from "@/services/MarketplaceScreenService";
import DetailsStep from "@/screens/PropertyAddScreen/DetailsStep";
import ImagesStep from "@/screens/PropertyAddScreen/ImagesStep";
import ReviewStep from "@/screens/PropertyAddScreen/ReviewStep";
import {
  AMENITY_CATALOG,
  buildPropertyPayload,
  getMinPrice,
  getMissingFields,
  initialFormState,
  KIND_ICON,
  resolveKind,
  type PropertyFormState,
  type PropertyKind,
  type UploadedImage,
} from "@/screens/PropertyAddScreen/shared";

// marginInline (not the margin shorthand) so spreading `wrap` alongside an
// explicit marginBottom elsewhere doesn't trip React's shorthand/longhand
// conflict warning.
const wrap: CSSProperties = {
  maxWidth: 780,
  marginInline: "auto",
  padding: `0 ${spacing.xl}px`,
};

// Wider container for the redesigned view screen — matches the marketplace
// PropertyDetail page's width so the two share the same reading measure.
const wrapWide: CSSProperties = {
  maxWidth,
  marginInline: "auto",
  padding: `0 ${spacing.xl}px`,
};

type Purpose = "Buy" | "Rent";
type Mode = "view" | "editDetails" | "editImages" | "editReview";
type KindBucket = "residential" | "office" | "plot";

// Villas/houses/flats share the residential look; office and plot listings
// each get their own accent so the page reads differently per property type
// — mirrors the bucketing in MarketplaceScreen's PropertyDetail.
const KIND_BUCKET: Record<PropertyKind, KindBucket> = {
  villa: "residential",
  house: "residential",
  flat: "residential",
  office: "office",
  plot: "plot",
};

const BUCKET_STYLE: Record<KindBucket, { accent: string; soft: string }> = {
  residential: { accent: colors.primary, soft: colors.primarySoft },
  office: { accent: colors.price, soft: "rgba(14,124,138,0.12)" },
  plot: { accent: "#1F8A5B", soft: "rgba(31,138,91,0.12)" },
};

const AMENITY_ICON: Record<string, IconName> = {
  "Club House": "house",
  "Individual Garden": "leaf",
  "Kids Play Area": "sparkle",
  "Open Party Area": "sparkle",
  "Swimming Pool": "drop",
  "Health Club": "hardhat",
  "Centralized Security": "shield",
  Gazebo: "sofa",
  "Yoga & Meditation": "leaf",
  Others: "check",
};

function formatPriceINR(amount: number): string {
  if (amount >= 1e7)
    return `₹${(amount / 1e7).toFixed(amount % 1e7 === 0 ? 0 : 2)} Cr`;
  if (amount >= 1e5)
    return `₹${(amount / 1e5).toFixed(amount % 1e5 === 0 ? 0 : 2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// "2_BHK" / "4_PLUS_BHK" (API enum) -> "2 BHK" / "5+ BHK" (display).
function formatBedrooms(bedrooms?: string): string | null {
  if (!bedrooms) return null;
  const n = bedrooms.replace(/_BHK$/i, "").replace("4_PLUS", "5+");
  return `${n} BHK`;
}

// CreatePropertyPayload sends no_of_floors/road_width in snake_case (like
// most of the create/update body), but PropertyDetailRecord — and the read
// endpoints — assume camelCase noOfFloors/roadWidth, unverified against a
// live response. If the backend actually echoes these two back in
// snake_case, `detail.noOfFloors`/`detail.roadWidth` silently read as
// undefined (ApiService.get does no runtime validation, so a mismatched key
// never surfaces as an error) even though the owner entered real values.
// Read both spellings defensively rather than trusting the declared type.
function rawNumeric(
  record: PropertyDetailRecord,
  ...keys: string[]
): number | undefined {
  const r = record as unknown as Record<string, unknown>;
  for (const key of keys) {
    const v = r[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
      return Number(v);
  }
  return undefined;
}

export default function MyPropertyDetail({
  slug,
  purpose,
  onBack,
  onSoldOut,
  onDeleted,
  onSaved,
}: {
  slug: string;
  purpose: Purpose;
  onBack: () => void;
  onSoldOut: () => void;
  onDeleted: () => void;
  // Called after a successful edit save (detail already re-fetched here) so
  // the parent list screen can re-fetch the My Property listing too — the
  // list's cached card (title/price/thumbnail) would otherwise keep showing
  // pre-edit data until the user reloads the page.
  onSaved?: () => void;
}) {
  const [detail, setDetail] = useState<PropertyDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("view");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const mapDivRef = useRef<HTMLDivElement>(null);

  const [editForm, setEditForm] = useState<PropertyFormState>(initialFormState);
  const [editImages, setEditImages] = useState<UploadedImage[]>([]);
  const [locationTouched, setLocationTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showSoldOutConfirm, setShowSoldOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Mirrors homedot-mobile-app's handlePropertyPress: the detail endpoint
  // comes back with an empty propertyDetails array for a listing that hasn't
  // been admin-approved yet — mobile surfaces that as a toast instead of
  // opening a (nonexistent) detail screen. Tracked separately from `loading`
  // so this doesn't leave the page stuck on the skeleton forever.
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const res = await MarketplaceScreenService.getMyPropertyDetail(
        slug,
        purpose,
      );
      if (cancelled) return;
      setLoading(false);
      const record = res.data?.data?.[0]?.propertyDetails?.[0];
      if (res.success && res.data?.status && record) {
        // Diagnostic only — PropertyDetailRecord's field names (particularly
        // noOfFloors/roadWidth/state) are unverified against a live response
        // (see rawNumeric above), so this makes it easy to check DevTools'
        // console for the actual raw keys/values this endpoint returns.
        if (process.env.NODE_ENV !== "production") {
          console.debug("[MyPropertyDetail] raw property record:", record);
        }
        setDetail(record);
      } else if (res.success && res.data?.status) {
        setPendingApproval(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, purpose]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (lightbox === null) return;
    const total = detail?.propertyImages?.length ?? 0;
    if (total === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowRight")
        setLightbox((i) => (i === null ? i : (i + 1) % total));
      else if (e.key === "ArrowLeft")
        setLightbox((i) => (i === null ? i : (i - 1 + total) % total));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, detail?.propertyImages?.length]);

  // Unlike MarketplaceScreen's PropertyDetail (which only has a free-text
  // address and has to geocode it), the owner's own record already carries
  // lat/lng, so the real map can be built directly without a geocode round
  // trip. Falls back to the decorative pin panel if coordinates are absent
  // or the Maps script/key isn't available.
  useEffect(() => {
    if (!detail || detail.latitude == null || detail.longitude == null)
      return;
    let cancelled = false;
    const center = { lat: detail.latitude, lng: detail.longitude };
    loadGoogleMapsScript()
      .then((google) => {
        if (cancelled || !mapDivRef.current) return;
        const map = new google.maps.Map(mapDivRef.current, {
          center,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        });
        new google.maps.Marker({ position: center, map });
        setMapReady(true);
      })
      .catch(() => {
        // leave mapReady false — decorative fallback panel stays visible
      });
    return () => {
      cancelled = true;
    };
    // Deliberately keyed on coordinates alone — re-running this whenever
    // `detail` changes (e.g. after an unrelated price edit) would tear down
    // and rebuild the map for no visible change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.latitude, detail?.longitude]);

  if (pendingApproval) {
    return (
      <div style={{ paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        <div style={wrap}>
          <div
            style={{
              textAlign: "center",
              padding: "70px 20px",
              border: `1px dashed ${colors.line}`,
              borderRadius: radius.lg,
              background: colors.card,
            }}
          >
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(245,158,11,0.12)",
                color: "#D97706",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 18px",
              }}
            >
              <Icon name="clock" size={28} />
            </span>
            <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>
              Pending admin approval
            </h3>
            <p
              style={{
                color: colors.muted,
                marginBottom: spacing.lg,
                maxWidth: 420,
                marginInline: "auto",
              }}
            >
              Property details are available after admin approval. Check back
              soon.
            </p>
            <Button variant="outline" size="lg" onClick={onBack}>
              Back to My Property
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div style={{ paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        <div style={wrap}>
          <div
            className="skeleton-shimmer"
            style={{ height: 220, borderRadius: radius.lg }}
          />
          <div
            style={{
              marginTop: spacing.xl,
              display: "flex",
              flexDirection: "column",
              gap: spacing.md,
            }}
          >
            <div
              className="skeleton-shimmer"
              style={{ height: 16, width: "60%", borderRadius: 6 }}
            />
            <div
              className="skeleton-shimmer"
              style={{ height: 16, width: "40%", borderRadius: 6 }}
            />
          </div>
        </div>
      </div>
    );
  }

  const isSold = detail.status === "Sold Out";
  const typeName = detail.propertyTypeDetails?.[0]?.propertyType ?? "Property";
  const kind = resolveKind(typeName);
  const kindStyle = BUCKET_STYLE[KIND_BUCKET[kind]];
  const kindIcon = KIND_ICON[kind];
  const images = detail.propertyImages ?? [];
  const amenityTitles = parseAmenities(detail.amenities);
  const noOfFloors = rawNumeric(detail, "noOfFloors", "no_of_floors");
  const roadWidth = rawNumeric(detail, "roadWidth", "road_width");

  const keyFacts: { icon: IconName; label: string; value: string }[] =
    kind === "plot"
      ? [
          {
            icon: "plot",
            label: "Plot area",
            value: detail.plotArea
              ? `${detail.plotArea.toLocaleString()} sqft`
              : "—",
          },
          {
            icon: "ruler",
            label: "Dimensions",
            value:
              detail.length && detail.breadth
                ? `${detail.length} × ${detail.breadth} ft`
                : "—",
          },
          {
            icon: "compass",
            label: "Road width",
            value: roadWidth ? `${roadWidth} ft` : "—",
          },
        ]
      : kind === "office"
        ? [
            {
              icon: "office",
              label: "Built-up area",
              value: detail.buildUpArea
                ? `${detail.buildUpArea.toLocaleString()} sqft`
                : "—",
            },
            {
              icon: "cube",
              label: "Carpet area",
              value: detail.carpetArea
                ? `${detail.carpetArea.toLocaleString()} sqft`
                : "—",
            },
            {
              icon: "ruler",
              label: "Floors",
              value: noOfFloors != null ? String(noOfFloors) : "—",
            },
          ]
        : [
            {
              icon: "house",
              label: "Bedrooms",
              value: formatBedrooms(detail.bedrooms) ?? "—",
            },
            {
              icon: "drop",
              label: "Bathrooms",
              value: detail.bathrooms != null ? String(detail.bathrooms) : "—",
            },
            {
              icon: "cube",
              label: "Built-up area",
              value: detail.buildUpArea
                ? `${detail.buildUpArea.toLocaleString()} sqft`
                : "—",
            },
          ];

  const detailRows: [string, string][] = [
    ["Property type", typeName],
    ["Listing", purpose === "Rent" ? "For Rent" : "For Sale"],
  ];
  const bedroomsLabel = formatBedrooms(detail.bedrooms);
  if (bedroomsLabel) detailRows.push(["Bedrooms", bedroomsLabel]);
  if (detail.bathrooms != null)
    detailRows.push(["Bathrooms", String(detail.bathrooms)]);
  if (kind !== "plot" && detail.buildUpArea)
    detailRows.push([
      "Built-up area",
      `${detail.buildUpArea.toLocaleString()} sqft`,
    ]);
  if (detail.carpetArea)
    detailRows.push(["Carpet area", `${detail.carpetArea.toLocaleString()} sqft`]);
  if (detail.plotArea)
    detailRows.push(["Plot area", `${detail.plotArea.toLocaleString()} sqft`]);
  if (detail.length && detail.breadth)
    detailRows.push(["Dimensions", `${detail.length} × ${detail.breadth} ft`]);
  if (noOfFloors != null) detailRows.push(["No. of floors", String(noOfFloors)]);
  if (roadWidth) detailRows.push(["Road width", `${roadWidth} ft`]);
  if (detail.maintenanceCharge)
    detailRows.push([
      "Maintenance charge",
      `₹${detail.maintenanceCharge.toLocaleString("en-IN")} / month`,
    ]);
  if (detail.garage != null) detailRows.push(["Garage", String(detail.garage)]);
  if (detail.balcony != null)
    detailRows.push(["Balcony", String(detail.balcony)]);
  if (detail.furnished) detailRows.push(["Furnishing", detail.furnished]);
  if (detail.listedBy)
    detailRows.push([
      "Listed by",
      detail.listedBy.charAt(0).toUpperCase() + detail.listedBy.slice(1),
    ]);

  const directionsUrl =
    detail.latitude != null && detail.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${detail.latitude},${detail.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${detail.propertySubLocation || detail.propertyLocation}, ${detail.propertyCity}`,
        )}`;

  function handleMobileGalleryScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  const startEdit = () => {
    setSubmitError(null);
    setLocationTouched(false);
    setEditForm({
      ...initialFormState,
      title: detail.propertyAdTitle,
      description: detail.description ?? "",
      price: String(detail.price ?? ""),
      location: {
        address: detail.propertySubLocation || detail.propertyLocation || "",
        lat: detail.latitude ?? DEFAULT_MAP_CENTER.lat,
        lng: detail.longitude ?? DEFAULT_MAP_CENTER.lng,
      },
      city: detail.propertyCity ?? "",
      // The detail endpoint doesn't echo `property_state` back (not modeled
      // on PropertyDetailRecord — homedot-mobile-app's own detail screen
      // never reads it either), so this starts blank; the owner re-enters it
      // if they want to continue past the Details step. Everything else on
      // the form is still prefilled.
      state: "",
      country: detail.propertyCountry || "India",
      bedrooms: formatBedrooms(detail.bedrooms) ?? "",
      bathrooms: detail.bathrooms != null ? String(detail.bathrooms) : "",
      balcony: detail.balcony != null ? String(detail.balcony) : "",
      furnished: detail.furnished ?? "",
      buildUpArea: detail.buildUpArea != null ? String(detail.buildUpArea) : "",
      carpetArea: detail.carpetArea != null ? String(detail.carpetArea) : "",
      plotArea: detail.plotArea != null ? String(detail.plotArea) : "",
      noOfFloors: noOfFloors != null ? String(noOfFloors) : "",
      roadWidth: roadWidth != null ? String(roadWidth) : "",
      maintenanceCharge:
        detail.maintenanceCharge != null
          ? String(detail.maintenanceCharge)
          : "",
      garage: detail.garage != null ? String(detail.garage) : "",
      length: detail.length != null ? String(detail.length) : "",
      breadth: detail.breadth != null ? String(detail.breadth) : "",
      // Matched back against AMENITY_CATALOG by title, since ids are purely
      // local (not server-assigned) — see parseAmenities. Anything the API
      // sent that isn't in the fixed catalog (a free-text "Others" entry)
      // can't be represented here and is dropped, matching the catalog's
      // own closed set.
      amenities: AMENITY_CATALOG.filter((a) =>
        parseAmenities(detail.amenities).includes(a.title),
      ),
    });
    setEditImages(images.map((img) => ({ id: img._id, url: img.imageFile })));
    setMode("editDetails");

    // The detail endpoint doesn't return `property_state`, so the form
    // above seeds it blank — geocode the listing's own address to fill it
    // in automatically instead of making the owner look it up by hand.
    // Geocoding by address (not detail.latitude/longitude) deliberately —
    // those two are documented as unconfirmed on a live response and empty
    // here in practice, whereas propertyLocation/propertyCity/propertyCountry
    // are non-optional on PropertyDetailRecord and always present. Guarded
    // on the field still being blank when the geocode resolves, so it never
    // clobbers something the owner already typed in the meantime.
    const address = [
      detail.propertySubLocation || detail.propertyLocation,
      detail.propertyCity,
      detail.propertyCountry,
    ]
      .filter(Boolean)
      .join(", ");
    if (address) {
      loadGoogleMapsScript()
        .then((google) => {
          new google.maps.Geocoder().geocode(
            { address },
            (results, status) => {
              const state =
                status === "OK"
                  ? parseAddressComponents(results?.[0]?.address_components ?? [])
                      .state
                  : undefined;
              if (!state) return;
              setEditForm((f) => (f.state ? f : { ...f, state }));
            },
          );
        })
        .catch(() => {
          // leave state blank — owner can still type it in by hand
        });
    }
  };

  const setEditFormTracked = (
    updater: (f: PropertyFormState) => PropertyFormState,
  ) => {
    setEditForm((prev) => {
      const next = updater(prev);
      if (next.location !== prev.location) setLocationTouched(true);
      return next;
    });
  };

  const saveEdit = async () => {
    if (getMissingFields(kind, editForm, purpose).includes("price")) {
      const minPrice = getMinPrice(purpose);
      setToast(
        editForm.price.trim()
          ? `Minimum ${purpose === "Rent" ? "rent" : "price"} is ₹${minPrice.toLocaleString("en-IN")}.`
          : "Enter a valid price to continue.",
      );
      setMode("editDetails");
      return;
    }
    const propertyType: PropertyTypeRecord = {
      _id: detail.propertyTypeDetails?.[0]?._id ?? "",
      propertyType: typeName,
    };
    const payload = buildPropertyPayload(
      propertyType,
      editForm,
      editImages.map((i) => i.id),
    );
    // The owner never touched the map — keep the property's existing
    // location/coordinates untouched rather than resend whatever default the
    // form was seeded with (avoids silently relocating the listing).
    if (!locationTouched) {
      payload.property_location =
        detail.propertyLocation ?? payload.property_location;
      payload.property_sub_location =
        detail.propertySubLocation ?? payload.property_sub_location;
      payload.google_address_string =
        detail.propertyLocation ?? payload.google_address_string;
      if (detail.latitude != null) payload.latitude = detail.latitude;
      if (detail.longitude != null) payload.longitude = detail.longitude;
    }

    setSubmitting(true);
    setSubmitError(null);
    const res = await MarketplaceScreenService.updateProperty(
      slug,
      payload,
      purpose,
    );
    setSubmitting(false);
    if (!res.success || !res.data?.status) {
      setSubmitError(
        res.data?.message ||
          res.message ||
          "Couldn't save your changes. Please try again.",
      );
      return;
    }
    // Re-fetch rather than hand-merge `payload` into `detail`: payload only
    // carries image ids (not the server's resolved propertyImages), so a
    // manual merge here left the gallery showing the pre-edit images even
    // though the update (including newly uploaded photos) had succeeded.
    const refreshed = await MarketplaceScreenService.getMyPropertyDetail(
      slug,
      purpose,
    );
    const refreshedRecord = refreshed.data?.data?.[0]?.propertyDetails?.[0];
    if (refreshed.success && refreshed.data?.status && refreshedRecord) {
      setDetail(refreshedRecord);
    }
    setMode("view");
    setToast("Listing updated.");
    onSaved?.();
  };

  const confirmSoldOut = async () => {
    setActionLoading(true);
    const res = await MarketplaceScreenService.markPropertySoldOut(
      slug,
      purpose,
    );
    setActionLoading(false);
    if (!res.success || !res.data?.status) {
      setToast(
        res.data?.message ||
          res.message ||
          "Couldn't update the listing. Please try again.",
      );
      return;
    }
    setDetail({ ...detail, status: "Sold Out" });
    setShowSoldOutConfirm(false);
    onSoldOut();
  };

  const confirmDelete = async () => {
    setActionLoading(true);
    const res = await MarketplaceScreenService.deleteProperty(
      slug,
      purpose,
    );
    setActionLoading(false);
    if (!res.success || !res.data?.status) {
      setToast(
        res.data?.message ||
          res.message ||
          "Couldn't delete the listing. Please try again.",
      );
      return;
    }
    setShowDeleteConfirm(false);
    onDeleted();
  };

  if (mode !== "view") {
    return (
      <div style={{ paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        <div style={wrap}>
          <div
            className="pa-form-card"
            style={{
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.lg,
              padding: "clamp(24px, 4vw, 44px)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: fontSize.xs,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: colors.muted,
                marginBottom: spacing.lg,
              }}
            >
              Edit listing
            </span>
            {mode === "editDetails" && process.env.NODE_ENV !== "production" && (
              // TEMPORARY diagnostic — shows exactly what the API returned
              // for this listing, so a screenshot of this box tells us the
              // real field name for road width/floors instead of guessing.
              // Safe to delete once that's confirmed; never renders in prod.
              <div
                style={{
                  marginBottom: spacing.lg,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  border: "1px dashed #F59E0B",
                  background: "#FFFBEB",
                }}
              >
                <b
                  style={{
                    display: "block",
                    fontSize: fontSize.xs,
                    color: "#B45309",
                    marginBottom: 6,
                  }}
                >
                  DEBUG — raw property record from the API (dev only)
                </b>
                <pre
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: colors.ink2,
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(detail, null, 2)}
                </pre>
              </div>
            )}
            {mode === "editDetails" && (
              <DetailsStep
                kind={kind}
                typeName={typeName}
                purpose={purpose}
                form={editForm}
                setForm={setEditFormTracked}
                onBack={() => setMode("view")}
                onContinue={() => setMode("editImages")}
              />
            )}
            {mode === "editImages" && (
              <ImagesStep
                initialImages={editImages}
                setImages={setEditImages}
                onBack={() => setMode("editDetails")}
                onContinue={() => setMode("editReview")}
              />
            )}
            {mode === "editReview" && (
              <ReviewStep
                typeName={typeName}
                purpose={purpose}
                form={editForm}
                images={editImages}
                submitting={submitting}
                error={submitError}
                onBack={() => setMode("editImages")}
                onSubmit={saveEdit}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
      <div style={wrapWide}>
        {/* back */}
        <div style={{ marginBottom: spacing.lg }}>
          <button
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: fontSize.sm,
              fontWeight: 600,
              color: colors.ink2,
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.full,
              padding: "9px 16px",
              boxShadow: shadow.sm,
              cursor: "pointer",
            }}
          >
            <Icon name="arrowLeft" size={16} />
            Back to My Property
          </button>
        </div>

        {/* gallery */}
        <div style={{ position: "relative" }}>
          {images.length > 0 ? (
            <>
              <Reveal
                className={`hidden lg:grid ${images.length > 1 ? "lg:grid-cols-[1.55fr_1fr]" : "grid-cols-1"}`}
                style={{ gap: 10, height: "clamp(320px, 36vw, 440px)" }}
              >
                <button
                  onClick={() => setLightbox(0)}
                  className="card-hover"
                  style={{
                    position: "relative",
                    borderRadius: radius.lg,
                    overflow: "hidden",
                    cursor: "zoom-in",
                    background: colors.primarySoft,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[0].imageFile}
                    alt={detail.propertyAdTitle}
                    className="card-hover-img"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, transparent 55%, rgba(10,20,34,0.45) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      bottom: 14,
                      background: isSold
                        ? "linear-gradient(90deg, #EF4444, #DC2626)"
                        : "linear-gradient(90deg, #10B981, #059669)",
                      color: colors.white,
                      fontSize: fontSize.xs,
                      fontWeight: 700,
                      padding: "6px 14px",
                      borderRadius: radius.full,
                    }}
                  >
                    {isSold ? "Sold Out" : "Live"}
                  </span>
                  {images.length > 1 && (
                    <span
                      style={{
                        position: "absolute",
                        right: 14,
                        bottom: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: "rgba(10,20,34,0.55)",
                        color: colors.white,
                        fontSize: fontSize.xs,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: radius.full,
                      }}
                    >
                      <Icon name="grid" size={12} color={colors.white} /> View
                      all {images.length} photos
                    </span>
                  )}
                </button>
                {images.length > 1 && (
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr",
                      gridTemplateRows: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {images.slice(1, 4).map((img, i) => {
                      const isLastVisible = i === 2 && images.length > 4;
                      return (
                        <button
                          key={img._id}
                          onClick={() => setLightbox(i + 1)}
                          className="card-hover"
                          style={{
                            position: "relative",
                            borderRadius: radius.md,
                            overflow: "hidden",
                            cursor: "zoom-in",
                            background: colors.primarySoft,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.imageFile}
                            alt={`View ${i + 2}`}
                            className="card-hover-img"
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {isLastVisible && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(10,20,34,0.6)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                color: colors.white,
                                fontWeight: 700,
                                fontSize: fontSize.md,
                              }}
                            >
                              <Icon name="grid" size={18} color={colors.white} />
                              +{images.length - 4} photos
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Reveal>

              {/* gallery — mobile swipe carousel */}
              <Reveal className="lg:hidden" style={{ position: "relative" }}>
                <div
                  onScroll={handleMobileGalleryScroll}
                  className="pd-carousel flex overflow-x-auto"
                  style={{
                    borderRadius: radius.lg,
                    height: "clamp(220px, 62vw, 320px)",
                    background: colors.primarySoft,
                  }}
                >
                  {images.map((img, i) => (
                    <button
                      key={img._id}
                      onClick={() => setLightbox(i)}
                      style={{
                        flex: "0 0 100%",
                        position: "relative",
                        cursor: "zoom-in",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.imageFile}
                        alt={`${detail.propertyAdTitle} — view ${i + 1}`}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: radius.lg,
                    background:
                      "linear-gradient(180deg, transparent 60%, rgba(10,20,34,0.4) 100%)",
                    pointerEvents: "none",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 14,
                    background: isSold
                      ? "linear-gradient(90deg, #EF4444, #DC2626)"
                      : "linear-gradient(90deg, #10B981, #059669)",
                    color: colors.white,
                    fontSize: fontSize.xs,
                    fontWeight: 700,
                    padding: "6px 14px",
                    borderRadius: radius.full,
                  }}
                >
                  {isSold ? "Sold Out" : "Live"}
                </span>
                {images.length > 1 && (
                  <span
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 14,
                      background: "rgba(10,20,34,0.55)",
                      color: colors.white,
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      padding: "6px 12px",
                      borderRadius: radius.full,
                    }}
                  >
                    {mobileIndex + 1} / {images.length}
                  </span>
                )}
                {images.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: 14,
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: 5,
                    }}
                  >
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`pd-dot ${i === mobileIndex ? "active" : ""}`}
                      />
                    ))}
                  </div>
                )}
              </Reveal>
            </>
          ) : (
            <div
              style={{
                borderRadius: radius.lg,
                height: "clamp(220px, 30vw, 320px)",
                background: colors.primarySoft,
                display: "grid",
                placeItems: "center",
                color: colors.muted,
              }}
            >
              <Icon name="house" size={36} />
            </div>
          )}

          {isSold && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 3,
                pointerEvents: "none",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: fontSize.xxl,
                  fontWeight: 800,
                  color: colors.white,
                  letterSpacing: "0.1em",
                  border: "3px solid rgba(255,255,255,0.85)",
                  padding: "8px 24px",
                  borderRadius: radius.md,
                  background: "rgba(15,23,42,0.35)",
                  transform: "rotate(-8deg)",
                }}
              >
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        {/* header: category + title + price — floats over the gallery on desktop */}
        <Reveal
          className="lg:-mt-7"
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: spacing.xxl,
            marginTop: spacing.lg,
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.lg,
            padding: `${spacing.lg}px ${spacing.xl}px`,
            boxShadow: shadow.md,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: fontSize.xs,
                fontWeight: 600,
                color: kindStyle.accent,
                background: kindStyle.soft,
                padding: "5px 12px",
                borderRadius: 8,
                marginBottom: spacing.md,
              }}
            >
              <Icon name={kindIcon} size={13} /> {typeName}
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(21px, 2.6vw, 30px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                marginBottom: spacing.sm,
                fontWeight: 600,
              }}
            >
              {detail.propertyAdTitle}
            </h1>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: fontSize.base,
                color: colors.muted,
              }}
            >
              <Icon name="location" size={16} />{" "}
              {detail.propertySubLocation || detail.propertyLocation}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <em
              style={{
                fontStyle: "normal",
                fontSize: fontSize.xs,
                color: colors.muted,
                display: "block",
                marginBottom: 5,
              }}
            >
              {isSold ? "Last listed price" : "Price"}
            </em>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 2.8vw, 34px)",
                fontWeight: 700,
                color: colors.price,
                lineHeight: 1,
              }}
            >
              {formatPriceINR(detail.price ?? 0)}
            </div>
          </div>
        </Reveal>

        {/* key facts */}
        <Reveal
          stagger
          className="grid grid-cols-2 lg:grid-cols-3"
          style={{ gap: spacing.md, margin: `${spacing.xl}px 0 4px` }}
        >
          {keyFacts.map((k) => (
            <div
              key={k.label}
              className="card-hover pd-key-fact"
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.md,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.md,
                padding: "16px 18px",
                boxShadow: shadow.sm,
              }}
            >
              <span
                className="pd-key-fact-icon"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: kindStyle.soft,
                  color: kindStyle.accent,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={k.icon} size={20} />
              </span>
              <div>
                <b
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontSize: fontSize.md + 1,
                  }}
                >
                  {k.value}
                </b>
                <em
                  style={{
                    fontStyle: "normal",
                    fontSize: fontSize.xs,
                    color: colors.muted,
                  }}
                >
                  {k.label}
                </em>
              </div>
            </div>
          ))}
        </Reveal>

        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_320px]"
          style={{ gap: spacing.xxl, marginTop: spacing.md, alignItems: "start" }}
        >
          {/* main column */}
          <div>
            {detail.description && (
              <Reveal
                style={{
                  padding: `${spacing.xl}px 0`,
                  borderBottom: `1px solid ${colors.line}`,
                }}
              >
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.sm,
                    fontSize: fontSize.lg + 2,
                    marginBottom: spacing.md,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: kindStyle.accent,
                      display: "inline-block",
                    }}
                  />
                  About this property
                </h2>
                <p
                  style={{
                    color: colors.ink2,
                    fontSize: fontSize.base,
                    lineHeight: 1.7,
                  }}
                >
                  {detail.description}
                </p>
              </Reveal>
            )}

            <Reveal
              style={{
                padding: `${spacing.xl}px 0`,
                borderBottom: `1px solid ${colors.line}`,
              }}
            >
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  fontSize: fontSize.lg + 2,
                  marginBottom: spacing.md,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: kindStyle.accent,
                    display: "inline-block",
                  }}
                />
                Property details
              </h2>
              <div
                className="grid grid-cols-1 sm:grid-cols-2"
                style={{ columnGap: spacing.xxl }}
              >
                {detailRows.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: spacing.md,
                      padding: "13px 0",
                      borderBottom: `1px solid ${colors.line}`,
                      fontSize: fontSize.base,
                    }}
                  >
                    <span style={{ color: colors.muted }}>{k}</span>
                    <span style={{ color: colors.ink, fontWeight: 600 }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            {amenityTitles.length > 0 && (
              <Reveal
                style={{
                  padding: `${spacing.xl}px 0`,
                  borderBottom: `1px solid ${colors.line}`,
                }}
              >
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.sm,
                    fontSize: fontSize.lg + 2,
                    marginBottom: spacing.md,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: kindStyle.accent,
                      display: "inline-block",
                    }}
                  />
                  Amenities
                </h2>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  style={{ gap: spacing.md }}
                >
                  {amenityTitles.map((a) => (
                    <span
                      key={a}
                      className="card-hover"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing.md - 1,
                        fontSize: fontSize.base - 1,
                        color: colors.ink2,
                        background: colors.card,
                        border: `1px solid ${colors.line}`,
                        borderRadius: radius.md,
                        padding: "12px 14px",
                      }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: kindStyle.soft,
                          color: kindStyle.accent,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name={AMENITY_ICON[a] ?? "check"} size={16} />
                      </span>
                      {a}
                    </span>
                  ))}
                </div>
              </Reveal>
            )}

            <Reveal style={{ padding: `${spacing.xl}px 0` }}>
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  fontSize: fontSize.lg + 2,
                  marginBottom: spacing.md,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: kindStyle.accent,
                    display: "inline-block",
                  }}
                />
                Location
              </h2>
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: fontSize.base,
                  color: colors.ink2,
                  marginBottom: spacing.lg,
                }}
              >
                <Icon name="location" size={17} color={kindStyle.accent} />{" "}
                {detail.propertySubLocation || detail.propertyLocation},{" "}
                {detail.propertyCity}
              </p>
              <div
                style={{
                  position: "relative",
                  height: 260,
                  borderRadius: radius.lg,
                  overflow: "hidden",
                  border: `1px solid ${colors.line}`,
                  background:
                    "repeating-linear-gradient(0deg, rgba(16,28,48,0.045) 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, rgba(16,28,48,0.045) 0 1px, transparent 1px 34px), #EEF1F5",
                }}
              >
                <div
                  ref={mapDivRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: mapReady ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                />
                {!mapReady && (
                  <>
                    <span
                      className="pd-map-glow"
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 140,
                        height: 140,
                        marginLeft: -70,
                        marginTop: -70,
                        borderRadius: "50%",
                        background: kindStyle.accent,
                        filter: "blur(46px)",
                        opacity: 0.3,
                      }}
                    />
                    <div
                      className="pd-map-pin"
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <span
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: "50%",
                          background: kindStyle.accent,
                          color: colors.white,
                          display: "grid",
                          placeItems: "center",
                          boxShadow: shadow.md,
                        }}
                      >
                        <Icon
                          name="location"
                          size={22}
                          color={colors.white}
                          filled
                        />
                      </span>
                    </div>
                  </>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: colors.card,
                    color: colors.ink,
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    padding: "8px 14px",
                    borderRadius: radius.full,
                    boxShadow: shadow.sm,
                  }}
                >
                  <Icon name="compass" size={14} color={kindStyle.accent} />{" "}
                  Get directions
                </a>
              </div>
            </Reveal>
          </div>

          {/* sidebar — owner actions */}
          <Reveal
            delay={100}
            style={{
              position: "sticky",
              top: 100,
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.lg,
              overflow: "hidden",
              boxShadow: shadow.md,
            }}
          >
            <div
              style={{
                height: 5,
                background: `linear-gradient(90deg, ${kindStyle.accent}, ${colors.accent})`,
              }}
            />
            <div
              style={{
                padding: spacing.xl,
                display: "flex",
                flexDirection: "column",
                gap: spacing.sm,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: spacing.sm,
                }}
              >
                <b
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: fontSize.md,
                  }}
                >
                  Manage listing
                </b>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: fontSize.xs,
                    fontWeight: 700,
                    color: colors.white,
                    background: isSold
                      ? "linear-gradient(90deg, #EF4444, #DC2626)"
                      : "linear-gradient(90deg, #10B981, #059669)",
                    padding: "5px 12px",
                    borderRadius: radius.full,
                  }}
                >
                  {isSold ? "Sold Out" : "Live"}
                </span>
              </div>

              {!isSold ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    full
                    onClick={startEdit}
                    icon={<Icon name="edit" size={16} />}
                  >
                    Edit Listing
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    full
                    onClick={() => setShowSoldOutConfirm(true)}
                  >
                    Mark as Sold Out
                  </Button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "12px 0 2px",
                      textAlign: "center",
                      color: "#E5484D",
                      fontWeight: 600,
                      fontSize: fontSize.sm,
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="trash" size={15} /> Delete Listing
                  </button>
                </>
              ) : (
                <p
                  style={{
                    color: colors.muted,
                    fontSize: fontSize.sm,
                    lineHeight: 1.55,
                  }}
                >
                  This listing is sold out. Contact HomeDot support if you
                  need to make further changes.
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {lightbox !== null && images.length > 0 && (
        <div
          onClick={() => setLightbox(null)}
          className="pd-lightbox-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10,20,34,0.92)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: 40,
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="pd-lightbox-arrow"
            style={{
              position: "absolute",
              zIndex: 2,
              top: 24,
              right: 28,
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.14)",
              color: colors.white,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="close" size={22} color={colors.white} />
          </button>
          {images.length > 1 && (
            <span
              style={{
                position: "absolute",
                zIndex: 2,
                top: 30,
                left: 28,
                color: colors.white,
                fontWeight: 600,
                fontSize: fontSize.sm,
                background: "rgba(255,255,255,0.14)",
                padding: "7px 14px",
                borderRadius: radius.full,
              }}
            >
              {lightbox + 1} / {images.length}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={lightbox}
            src={images[lightbox].imageFile}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="pd-lightbox-img"
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "90vw",
              maxHeight: "78vh",
              objectFit: "contain",
              borderRadius: radius.md,
              boxShadow: shadow.lg,
            }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) =>
                    i === null ? i : (i - 1 + images.length) % images.length,
                  );
                }}
                aria-label="Previous photo"
                className="pd-lightbox-arrow"
                style={{
                  position: "absolute",
                  zIndex: 2,
                  left: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.14)",
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="arrowLeft" size={22} color={colors.white} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) =>
                    i === null ? i : (i + 1) % images.length,
                  );
                }}
                aria-label="Next photo"
                className="pd-lightbox-arrow"
                style={{
                  position: "absolute",
                  zIndex: 2,
                  right: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.14)",
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="arrow" size={22} color={colors.white} />
              </button>
            </>
          )}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              zIndex: 2,
              left: "50%",
              bottom: 24,
              transform: "translateX(-50%)",
              display: "flex",
              gap: 10,
              maxWidth: "90vw",
              overflowX: "auto",
            }}
          >
            {images.length > 1 &&
              images.map((img, i) => (
                <button
                  key={img._id}
                  onClick={() => setLightbox(i)}
                  style={{
                    width: 66,
                    height: 48,
                    borderRadius: 9,
                    overflow: "hidden",
                    flexShrink: 0,
                    border:
                      i === lightbox
                        ? `2px solid ${colors.white}`
                        : "2px solid transparent",
                    opacity: i === lightbox ? 1 : 0.55,
                    transition: "opacity 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageFile}
                    alt={`View ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>
              ))}
          </div>
        </div>
      )}

      {showSoldOutConfirm && (
        <ConfirmModal
          tone="warn"
          title="Mark as Sold Out?"
          subtitle="This can't be undone from here — once marked sold out, you'll need to contact HomeDot support to reverse it."
          confirmLabel="Yes, Mark as Sold Out"
          loading={actionLoading}
          onClose={() => setShowSoldOutConfirm(false)}
          onConfirm={confirmSoldOut}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          tone="danger"
          title="Delete this listing?"
          subtitle="This will remove the listing from HomeDot. This can't be undone."
          confirmLabel="Yes, Delete Listing"
          loading={actionLoading}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100,
            background: colors.ink,
            color: colors.white,
            padding: "12px 20px",
            borderRadius: radius.full,
            fontSize: fontSize.sm,
            fontWeight: 600,
            boxShadow: shadow.lg,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function ConfirmModal({
  tone,
  title,
  subtitle,
  confirmLabel,
  loading,
  onClose,
  onConfirm,
}: {
  tone: "warn" | "danger";
  title: string;
  subtitle: string;
  confirmLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const grad =
    tone === "danger"
      ? "linear-gradient(135deg, #EF4444, #DC2626)"
      : "linear-gradient(135deg, #F59E0B, #D97706)";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: colors.overlay,
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(420px, 100%)",
          background: colors.card,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
          textAlign: "center",
          padding: "0 0 30px",
        }}
      >
        <div style={{ height: 4, background: grad }} />
        <div style={{ padding: "34px 28px 0" }}>
          <span
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: grad,
              color: colors.white,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
            }}
          >
            <Icon
              name={tone === "danger" ? "close" : "clock"}
              size={32}
              strokeWidth={2.4}
            />
          </span>
          <h2
            style={{
              fontSize: fontSize.lg + 1,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: colors.muted,
              fontSize: fontSize.sm,
              lineHeight: 1.55,
              marginBottom: spacing.lg,
            }}
          >
            {subtitle}
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm,
              padding: "0 6px",
            }}
          >
            <Button variant="primary" size="lg" full onClick={onConfirm}>
              {loading ? "Saving…" : confirmLabel}
            </Button>
            <Button variant="outline" size="lg" full onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
