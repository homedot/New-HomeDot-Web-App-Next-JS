"use client";

import { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import { radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import LocationMapPicker, { type LocationValue } from "@/components/LocationMapPicker";
import EnquiryService, { type EnquiryRecord } from "@/services/EnquiryService";
import { resolveLatLng } from "@/services/ProfileService";

/** Web counterpart of homedot-mobile-app's edit-enquiry full-screen modal
 * (NotificationEnquiresCards.js). Category is shown read-only there too —
 * its picker UI is commented-out dead code on mobile, so only location and
 * requirement are actually editable in practice, mirrored here. Location
 * uses the same search-box + draggable-marker picker ProfileScreen uses for
 * the user's own address, instead of re-implementing a separate
 * autocomplete list. */
export default function EnquiryEditModal({
  enquiry,
  onClose,
  onSaved,
}: {
  enquiry: EnquiryRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [requirement, setRequirement] = useState(enquiry.requirement);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    EnquiryService.getEnquiryDetail(enquiry._id).then((res) => {
      if (cancelled) return;
      setLoadingLocation(false);
      const coords = res.data?.data?.locationKey?.coordinates;
      const { lat, lng } = coords ? resolveLatLng(coords) : { lat: 0, lng: 0 };
      setLocation({ address: enquiry.location, lat, lng });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once for this enquiry
  }, [enquiry._id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const categoryLabel = enquiry.enquiryParentCategoryName || enquiry.enquiryCategoryName;

  const submit = async () => {
    if (!requirement.trim()) {
      setError("Please describe what you need.");
      return;
    }
    if (!location) {
      setError("Please choose a location.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await EnquiryService.updateEnquiry(enquiry._id, {
      professional: enquiry.professionalInfo?.[0]?._id ?? "",
      levelOneId: enquiry.enquiryParentCategoryId || enquiry.enquiryCategory || "",
      levelOneName: categoryLabel,
      latitude: location.lat,
      longitude: location.lng,
      location: location.address,
      requirement: requirement.trim(),
      terms: true,
    });
    setSaving(false);
    if (!res.success || res.data?.status === false) {
      setError(res.data?.message || res.message || "Couldn't update your enquiry. Please try again.");
      return;
    }
    onSaved(res.data?.message || "Enquiry updated.");
  };

  return (
    <div className="eq-modal-overlay" onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} className="eq-modal-card" style={cardStyle}>
        <div style={{ background: `linear-gradient(150deg, ${colors.primaryDeep}, ${colors.primary})`, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.16)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="arrowLeft" size={17} color="#fff" />
          </button>
          <div>
            <p style={{ color: "#fff", fontSize: fontSize.md - 1, fontWeight: 700, margin: 0 }}>Edit enquiry</p>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: fontSize.xs, margin: 0, marginTop: 1 }}>Update your enquiry details below</p>
          </div>
        </div>

        <div style={{ padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <SectionLabel>Service category</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 9, background: colors.bg, border: `1.5px solid ${colors.primary}`, borderRadius: radius.md, padding: "13px 14px" }}>
              <Icon name="briefcase" size={16} color={colors.primary} />
              <span style={{ fontSize: fontSize.base, fontWeight: 600, color: colors.primary }}>{categoryLabel}</span>
            </div>
          </div>

          <div>
            <SectionLabel>Project location</SectionLabel>
            {loadingLocation ? (
              <div style={{ height: 220, borderRadius: radius.md, background: colors.bg, display: "grid", placeItems: "center" }}>
                <p style={{ color: colors.muted, fontSize: fontSize.sm }}>Loading location…</p>
              </div>
            ) : (
              <LocationMapPicker value={location} onChange={setLocation} height={200} />
            )}
          </div>

          <div>
            <SectionLabel>Project requirements</SectionLabel>
            <textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value.trimStart())}
              placeholder="Describe what you need…"
              rows={4}
              style={{
                width: "100%",
                border: `1.5px solid ${colors.primary}`,
                background: colors.bg,
                borderRadius: radius.md,
                padding: "12px 14px",
                fontSize: fontSize.sm,
                color: colors.ink,
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>

          {error && <p style={{ color: "#C0392B", fontSize: fontSize.sm, margin: 0 }}>{error}</p>}
        </div>

        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              height: 52,
              borderRadius: radius.md,
              background: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: fontSize.md - 1,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {saving ? "Updating…" : "Update enquiry"}
          </button>
          <button onClick={onClose} style={{ padding: "10px 0", fontSize: fontSize.sm, fontWeight: 600, color: colors.muted, textAlign: "center" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.muted, letterSpacing: 0.6, textTransform: "uppercase", margin: 0, marginBottom: 8 }}>
      {children}
    </p>
  );
}

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1000,
  background: colors.overlay,
  backdropFilter: "blur(7px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const cardStyle = {
  width: "min(480px, 100%)",
  background: colors.card,
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
  maxHeight: "90vh",
  overflowY: "auto" as const,
};
