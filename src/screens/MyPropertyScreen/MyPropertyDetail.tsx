"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import { DEFAULT_MAP_CENTER } from "@/constants/MapConstants";
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
  initialFormState,
  resolveKind,
  type PropertyFormState,
  type UploadedImage,
} from "@/screens/PropertyAddScreen/shared";

// marginInline (not the margin shorthand) so spreading `wrap` alongside an
// explicit marginBottom elsewhere doesn't trip React's shorthand/longhand
// conflict warning.
const wrap: CSSProperties = { maxWidth: 780, marginInline: "auto", padding: `0 ${spacing.xl}px` };

type Purpose = "Buy" | "Rent";
type Mode = "view" | "editDetails" | "editImages" | "editReview";

function formatPriceINR(amount: number): string {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(amount % 1e7 === 0 ? 0 : 2)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(amount % 1e5 === 0 ? 0 : 2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function MyPropertyDetail({
  slug,
  purpose,
  onBack,
  onSoldOut,
  onDeleted,
}: {
  slug: string;
  purpose: Purpose;
  onBack: () => void;
  onSoldOut: () => void;
  onDeleted: () => void;
}) {
  const [detail, setDetail] = useState<PropertyDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("view");
  const [lightbox, setLightbox] = useState<number | null>(null);

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
      const res = await MarketplaceScreenService.getMyPropertyDetail(slug, purpose);
      if (cancelled) return;
      setLoading(false);
      const record = res.data?.data?.[0]?.propertyDetails?.[0];
      if (res.success && res.data?.status && record) {
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
            <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>Pending admin approval</h3>
            <p style={{ color: colors.muted, marginBottom: spacing.lg, maxWidth: 420, marginInline: "auto" }}>
              Property details are available after admin approval. Check back soon.
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
          <div className="skeleton-shimmer" style={{ height: 220, borderRadius: radius.lg }} />
          <div style={{ marginTop: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.md }}>
            <div className="skeleton-shimmer" style={{ height: 16, width: "60%", borderRadius: 6 }} />
            <div className="skeleton-shimmer" style={{ height: 16, width: "40%", borderRadius: 6 }} />
          </div>
        </div>
      </div>
    );
  }

  const isSold = detail.status === "Sold Out";
  const typeName = detail.propertyTypeDetails?.[0]?.propertyType ?? "Property";
  const kind = resolveKind(typeName);
  const images = detail.propertyImages ?? [];

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
      bedrooms: detail.bedrooms ? `${detail.bedrooms.replace(/_BHK$/i, "").replace("4_PLUS", "5+")} BHK` : "",
      bathrooms: detail.bathrooms != null ? String(detail.bathrooms) : "",
      balcony: detail.balcony != null ? String(detail.balcony) : "",
      furnished: detail.furnished ?? "",
      buildUpArea: detail.buildUpArea != null ? String(detail.buildUpArea) : "",
      carpetArea: detail.carpetArea != null ? String(detail.carpetArea) : "",
      plotArea: detail.plotArea != null ? String(detail.plotArea) : "",
      noOfFloors: detail.noOfFloors != null ? String(detail.noOfFloors) : "",
      roadWidth: detail.roadWidth != null ? String(detail.roadWidth) : "",
      maintenanceCharge: detail.maintenanceCharge != null ? String(detail.maintenanceCharge) : "",
      garage: detail.garage != null ? String(detail.garage) : "",
      length: detail.length != null ? String(detail.length) : "",
      breadth: detail.breadth != null ? String(detail.breadth) : "",
      // Matched back against AMENITY_CATALOG by title, since ids are purely
      // local (not server-assigned) — see parseAmenities. Anything the API
      // sent that isn't in the fixed catalog (a free-text "Others" entry)
      // can't be represented here and is dropped, matching the catalog's
      // own closed set.
      amenities: AMENITY_CATALOG.filter((a) => parseAmenities(detail.amenities).includes(a.title)),
    });
    setEditImages(images.map((img) => ({ id: img._id, url: img.imageFile })));
    setMode("editDetails");
  };

  const setEditFormTracked = (updater: (f: PropertyFormState) => PropertyFormState) => {
    setEditForm((prev) => {
      const next = updater(prev);
      if (next.location !== prev.location) setLocationTouched(true);
      return next;
    });
  };

  const saveEdit = async () => {
    const propertyType: PropertyTypeRecord = {
      _id: detail.propertyTypeDetails?.[0]?._id ?? "",
      propertyType: typeName,
    };
    const payload = buildPropertyPayload(propertyType, editForm, editImages.map((i) => i.id));
    // The owner never touched the map — keep the property's existing
    // location/coordinates untouched rather than resend whatever default the
    // form was seeded with (avoids silently relocating the listing).
    if (!locationTouched) {
      payload.property_location = detail.propertyLocation ?? payload.property_location;
      payload.property_sub_location = detail.propertySubLocation ?? payload.property_sub_location;
      payload.google_address_string = detail.propertyLocation ?? payload.google_address_string;
      if (detail.latitude != null) payload.latitude = detail.latitude;
      if (detail.longitude != null) payload.longitude = detail.longitude;
    }

    setSubmitting(true);
    setSubmitError(null);
    const res = await MarketplaceScreenService.updateProperty(slug, payload, purpose);
    setSubmitting(false);
    if (!res.success || !res.data?.status) {
      setSubmitError(res.data?.message || res.message || "Couldn't save your changes. Please try again.");
      return;
    }
    setDetail({
      ...detail,
      propertyAdTitle: payload.property_ad_title,
      description: payload.description,
      price: payload.price,
      propertyLocation: payload.property_location,
      propertySubLocation: payload.property_sub_location,
      propertyCity: payload.property_city,
      propertyCountry: payload.property_country,
      latitude: payload.latitude,
      longitude: payload.longitude,
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
      balcony: payload.balcony,
      furnished: payload.furnished,
      buildUpArea: payload.build_up_area,
      carpetArea: payload.carpet_area,
      plotArea: payload.plot_area,
      noOfFloors: payload.no_of_floors,
      roadWidth: payload.road_width,
      maintenanceCharge: payload.maintenanceCharge,
      garage: payload.garage,
      length: payload.length,
      breadth: payload.breadth,
    });
    setMode("view");
    setToast("Listing updated.");
  };

  const confirmSoldOut = async () => {
    setActionLoading(true);
    const res = await MarketplaceScreenService.markPropertySoldOut(slug, purpose);
    setActionLoading(false);
    if (!res.success || !res.data?.status) {
      setToast(res.data?.message || res.message || "Couldn't update the listing. Please try again.");
      return;
    }
    setDetail({ ...detail, status: "Sold Out" });
    setShowSoldOutConfirm(false);
    onSoldOut();
  };

  const confirmDelete = async () => {
    setActionLoading(true);
    const res = await MarketplaceScreenService.deleteProperty(detail._id, purpose);
    setActionLoading(false);
    if (!res.success || !res.data?.status) {
      setToast(res.data?.message || res.message || "Couldn't delete the listing. Please try again.");
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
      <div style={{ ...wrap, marginBottom: spacing.lg }}>
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
          }}
        >
          <Icon name="arrowLeft" size={16} />
          Back to My Property
        </button>
      </div>

      <div style={wrap}>
        {/* gallery */}
        <div
          style={{
            position: "relative",
            borderRadius: radius.lg,
            overflow: "hidden",
            height: "clamp(200px, 30vw, 320px)",
            background: colors.primarySoft,
            marginBottom: spacing.xl,
          }}
        >
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0].imageFile}
              alt={detail.propertyAdTitle}
              onClick={() => setLightbox(0)}
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: colors.muted }}>
              <Icon name="house" size={36} />
            </div>
          )}
          {isSold && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15,23,42,0.45)",
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
                  transform: "rotate(-8deg)",
                }}
              >
                SOLD OUT
              </span>
            </div>
          )}
          {images.length > 1 && (
            <div className="no-scrollbar" style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", gap: 8, overflowX: "auto" }}>
              {images.slice(1, 6).map((img, i) => (
                <button
                  key={img._id}
                  onClick={() => setLightbox(i + 1)}
                  style={{ flexShrink: 0, width: 56, height: 56, borderRadius: radius.sm, overflow: "hidden", border: "2px solid rgba(255,255,255,0.8)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageFile} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* title + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.md }}>
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: fontSize.xs,
                fontWeight: 700,
                color: colors.white,
                background: isSold ? "linear-gradient(90deg, #EF4444, #DC2626)" : "linear-gradient(90deg, #10B981, #059669)",
                padding: "5px 13px",
                borderRadius: radius.full,
                marginBottom: spacing.sm,
              }}
            >
              {isSold ? "Sold Out" : "Live"}
            </span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(21px, 2.6vw, 28px)", fontWeight: 600 }}>{detail.propertyAdTitle}</h1>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <em style={{ fontStyle: "normal", fontSize: fontSize.xs, color: colors.muted, display: "block" }}>
              {isSold ? "Last listed price" : "Price"}
            </em>
            <b style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xl, fontWeight: 700, color: colors.price }}>
              {formatPriceINR(detail.price ?? 0)}
            </b>
          </div>
        </div>

        {/* detail rows */}
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.lg,
            boxShadow: shadow.sm,
            marginBottom: spacing.xl,
            overflow: "hidden",
          }}
        >
          <DetailRow icon="location" label="Location" value={detail.propertySubLocation || detail.propertyLocation} />
          {detail.bedrooms && <DetailRow icon="ruler" label="Bedrooms" value={detail.bedrooms.replace(/_/g, " ")} />}
          {detail.bathrooms != null && <DetailRow icon="ruler" label="Bathrooms" value={String(detail.bathrooms)} />}
          {detail.buildUpArea != null && <DetailRow icon="ruler" label="Build-up Area" value={`${detail.buildUpArea} sqft`} />}
          {detail.carpetArea != null && <DetailRow icon="ruler" label="Carpet Area" value={`${detail.carpetArea} sqft`} />}
          {detail.plotArea != null && <DetailRow icon="ruler" label="Plot Area" value={`${detail.plotArea} sqft`} />}
          {detail.furnished && <DetailRow icon="sofa" label="Furnished" value={detail.furnished} />}
          {detail.noOfFloors != null && <DetailRow icon="ruler" label="Floors" value={String(detail.noOfFloors)} />}
          {detail.garage != null && <DetailRow icon="ruler" label="Parking" value={String(detail.garage)} />}
        </div>

        {detail.description && (
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.lg,
              boxShadow: shadow.sm,
              padding: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <h2 style={{ fontSize: fontSize.md, fontWeight: 700, marginBottom: spacing.sm }}>Description</h2>
            <p style={{ color: colors.ink2, fontSize: fontSize.sm, lineHeight: 1.6 }}>{detail.description}</p>
          </div>
        )}

        {/* actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {!isSold && (
            <Button variant="primary" size="lg" full onClick={startEdit} icon={<Icon name="edit" size={16} />}>
              Edit Listing
            </Button>
          )}
          {!isSold && (
            <Button variant="outline" size="lg" full onClick={() => setShowSoldOutConfirm(true)}>
              Mark as Sold Out
            </Button>
          )}
          {!isSold && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ padding: "14px 0", textAlign: "center", color: "#E5484D", fontWeight: 600, fontSize: fontSize.sm }}
            >
              Delete Listing
            </button>
          )}
          {isSold && (
            <p style={{ textAlign: "center", color: colors.muted, fontSize: fontSize.sm, padding: "14px 0" }}>
              This listing is sold out. Contact HomeDot support if you need to make further changes.
            </p>
          )}
        </div>
      </div>

      {lightbox !== null && images.length > 0 && (
        <div
          onClick={() => setLightbox(null)}
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
            style={{ position: "absolute", top: 24, right: 28, width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.14)", color: colors.white, display: "grid", placeItems: "center" }}
          >
            <Icon name="close" size={22} color={colors.white} />
          </button>
          <span
            style={{ position: "absolute", top: 30, left: 28, color: colors.white, fontWeight: 600, fontSize: fontSize.sm, background: "rgba(255,255,255,0.14)", padding: "7px 14px", borderRadius: radius.full }}
          >
            {lightbox + 1} / {images.length}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox].imageFile}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: radius.md }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i - 1 + images.length) % images.length));
                }}
                aria-label="Previous photo"
                style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.14)", color: colors.white, display: "grid", placeItems: "center" }}
              >
                <Icon name="arrowLeft" size={22} color={colors.white} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i + 1) % images.length));
                }}
                aria-label="Next photo"
                style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.14)", color: colors.white, display: "grid", placeItems: "center" }}
              >
                <Icon name="arrow" size={22} color={colors.white} />
              </button>
            </>
          )}
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

function DetailRow({ icon, label, value }: { icon: "location" | "ruler" | "sofa"; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", gap: spacing.md, borderBottom: `1px solid ${colors.line}` }}>
      <span style={{ width: 36, height: 36, borderRadius: "50%", background: colors.primarySoft, color: colors.primary, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={16} />
      </span>
      <span style={{ flex: 1, fontSize: fontSize.base, color: colors.muted, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: fontSize.base, fontWeight: 600, color: colors.ink, textAlign: "right", textTransform: "capitalize" }}>{value}</span>
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
  const grad = tone === "danger" ? "linear-gradient(135deg, #EF4444, #DC2626)" : "linear-gradient(135deg, #F59E0B, #D97706)";
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: colors.overlay, backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(420px, 100%)", background: colors.card, borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)", textAlign: "center", padding: "0 0 30px" }}
      >
        <div style={{ height: 4, background: grad }} />
        <div style={{ padding: "34px 28px 0" }}>
          <span style={{ width: 76, height: 76, borderRadius: "50%", background: grad, color: colors.white, display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <Icon name={tone === "danger" ? "close" : "clock"} size={32} strokeWidth={2.4} />
          </span>
          <h2 style={{ fontSize: fontSize.lg + 1, fontWeight: 700, marginBottom: 10 }}>{title}</h2>
          <p style={{ color: colors.muted, fontSize: fontSize.sm, lineHeight: 1.55, marginBottom: spacing.lg }}>{subtitle}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, padding: "0 6px" }}>
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
