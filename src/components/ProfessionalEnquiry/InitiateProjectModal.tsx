"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import ProfessionalDashboardService, {
  type InitiateProjectPayload,
  type ProfessionalEnquiryRecord,
} from "@/services/ProfessionalDashboardService";
import {
  loadGoogleMapsScript,
  type GoogleMapsNamespace,
  type GoogleMapsPlacePrediction,
} from "@/utils/loadGoogleMapsScript";

interface ImageItem {
  key: string;
  file?: File;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  imageId?: string;
}

/** Web counterpart of homedot-mobile-app's Job/DirectEnquiryScreen "Initiate
 * Project" modal — converts an accepted enquiry into a project. Same
 * eq-modal-overlay/eq-modal-card base as RespondModal/ConfirmModal, widened
 * for the extra fields. The photo uploader is the exact state machine from
 * PropertyAddScreen/ImagesStep.tsx (uploading/done/error, drag/drop, tap to
 * retry), reusing its .pa-dropzone/.pa-image-tile CSS as-is — just posts to
 * ProfessionalDashboardService.uploadProjectImage instead of the property
 * upload call. */
export default function InitiateProjectModal({
  enquiry,
  loading,
  onClose,
  onSubmit,
}: {
  enquiry: ProfessionalEnquiryRecord;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: InitiateProjectPayload) => Promise<void>;
}) {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState(enquiry.location || "");
  const [suggestions, setSuggestions] = useState<GoogleMapsPlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationFieldRef = useRef<HTMLDivElement | null>(null);
  const googleMapsRef = useRef<GoogleMapsNamespace | null>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [touched, setTouched] = useState(false);

  const [items, setItems] = useState<ImageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Modal only mounts once opened, so this is the right time to lazily pull
  // in the Maps SDK — loadGoogleMapsScript is a cached singleton, so it's a
  // no-op if some other screen already loaded it.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript()
      .then((google) => {
        if (!cancelled) googleMapsRef.current = google;
      })
      .catch(() => {
        // Degrade silently — the field still accepts free text.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showSuggestions) return;
    const onDocClick = (e: MouseEvent) => {
      if (!locationFieldRef.current?.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showSuggestions]);

  const onLocationInputChange = (value: string) => {
    setLocation(value);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const q = value.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimer.current = setTimeout(() => {
      const google = googleMapsRef.current;
      if (!google) return;
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: q, componentRestrictions: { country: "in" } },
        (predictions, status) => {
          if (status === "OK" && predictions?.length) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        },
      );
    }, 300);
  };

  const selectSuggestion = (prediction: GoogleMapsPlacePrediction) => {
    setLocation(prediction.description);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const clearLocation = () => {
    setLocation("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const uploadOne = async (item: ImageItem) => {
    if (!item.file) return;
    const res = await ProfessionalDashboardService.uploadProjectImage(item.file);
    setItems((prev) =>
      prev.map((i) =>
        i.key === item.key
          ? res.success && res.data?.status && res.data.data?._id
            ? { ...i, status: "done" as const, imageId: res.data.data._id }
            : { ...i, status: "error" as const }
          : i,
      ),
    );
  };

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: ImageItem[] = Array.from(files).map((file) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));
    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadOne(item));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const retryItem = (item: ImageItem) => {
    setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: "uploading" } : i)));
    uploadOne(item);
  };

  const uploading = items.some((i) => i.status === "uploading");
  const doneImageIds = items.filter((i) => i.status === "done" && i.imageId).map((i) => i.imageId as string);

  const datesValid = !startDate || !endDate || startDate <= endDate;
  const canSubmit =
    projectName.trim().length > 0 &&
    location.trim().length > 0 &&
    !!startDate &&
    !!endDate &&
    datesValid &&
    doneImageIds.length > 0 &&
    !uploading &&
    !loading;

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    await onSubmit({
      projectName: projectName.trim(),
      location: location.trim(),
      startDate,
      endDate,
      projectImages: doneImageIds,
    });
  };

  return (
    <div className="eq-modal-overlay" onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} className="eq-modal-card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 20px", borderBottom: `1px solid ${colors.line}` }}>
          <div style={{ paddingRight: 12 }}>
            <p style={{ fontSize: fontSize.md - 1, fontWeight: 700, color: colors.ink, margin: 0 }}>Initiate Project</p>
            <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0, marginTop: 2 }}>
              Turn this accepted enquiry into a project — {enquiry.customerInfo?.[0]?.name || "your customer"} will see it in their projects.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: colors.muted, flexShrink: 0 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: spacing.md }}>
          <Field label="Project name" error={touched && !projectName.trim() ? "Required" : undefined}>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Full home interior — living room & kitchen"
              style={inputStyle(touched && !projectName.trim())}
            />
          </Field>

          <Field label="Location" error={touched && !location.trim() ? "Required" : undefined}>
            <div ref={locationFieldRef} style={{ position: "relative" }}>
              <input
                value={location}
                onChange={(e) => onLocationInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search site address"
                autoComplete="off"
                style={{ ...inputStyle(touched && !location.trim()), paddingRight: 36 }}
              />
              {location.trim().length > 0 && (
                <button
                  type="button"
                  onClick={clearLocation}
                  aria-label="Clear location"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    color: colors.muted,
                  }}
                >
                  <Icon name="close" size={14} />
                </button>
              )}

              {showSuggestions && suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: colors.card,
                    border: `1px solid ${colors.line}`,
                    borderRadius: radius.md,
                    boxShadow: shadow.lg,
                    zIndex: 20,
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={s.place_id}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        width: "100%",
                        padding: "10px 13px",
                        textAlign: "left",
                        fontSize: fontSize.sm,
                        color: colors.ink2,
                        borderBottom: i < suggestions.length - 1 ? `1px solid ${colors.line}` : "none",
                      }}
                    >
                      <Icon name="location" size={15} color={colors.accent} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2" style={{ gap: spacing.md }}>
            <Field label="Start date" error={touched && !startDate ? "Required" : undefined}>
              <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle(touched && !startDate)} />
            </Field>
            <Field label="End date" error={touched && (!endDate || !datesValid) ? (!endDate ? "Required" : "Must be after start date") : undefined}>
              <input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle(touched && (!endDate || !datesValid))} />
            </Field>
          </div>

          <Field label="Work photos" error={touched && doneImageIds.length === 0 ? "Add at least one photo" : undefined}>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                onFiles(e.dataTransfer.files);
              }}
              className="pa-dropzone"
              style={{
                width: "100%",
                height: 100,
                border: `1.5px dashed ${dragActive ? colors.primary : colors.line}`,
                borderRadius: radius.md,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                color: colors.muted,
                background: dragActive ? colors.primarySoft : colors.bg,
              }}
            >
              <Icon name="camera" size={20} color={colors.muted} />
              <span style={{ fontSize: fontSize.xs, fontWeight: 600, color: colors.ink }}>Drag photos here, or click to upload</span>
            </button>

            {items.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4" style={{ gap: 8, marginTop: 10 }}>
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="pa-image-tile"
                    style={{ position: "relative", borderRadius: radius.sm, overflow: "hidden", aspectRatio: "1 / 1", border: `1px solid ${colors.line}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label="Remove photo"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(16,28,48,0.65)",
                        color: colors.white,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Icon name="close" size={11} color={colors.white} />
                    </button>
                    {item.status === "uploading" && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(16,28,48,0.45)", color: colors.white, display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 600 }}>
                        Uploading…
                      </div>
                    )}
                    {item.status === "error" && (
                      <button
                        type="button"
                        onClick={() => retryItem(item)}
                        style={{ position: "absolute", inset: 0, background: "rgba(192,57,43,0.75)", color: colors.white, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, textAlign: "center", padding: 4 }}
                      >
                        Failed — retry
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Field>

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, height: 48, borderRadius: radius.md, border: `1.5px solid ${colors.line}`, background: colors.bg, color: colors.ink2, fontSize: fontSize.sm, fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              style={{
                flex: 2,
                height: 48,
                borderRadius: radius.md,
                background: colors.primary,
                color: "#fff",
                fontSize: fontSize.sm,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: canSubmit || !touched ? 1 : 0.6,
              }}
            >
              <Icon name="briefcase" size={15} color="#fff" /> {loading ? "Creating…" : "Initiate Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: fontSize.xs, fontWeight: 700, color: colors.ink2 }}>{label}</span>
      {children}
      {error && <span style={{ fontSize: 11, color: "#DC2626" }}>{error}</span>}
    </label>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    height: 44,
    border: `1.5px solid ${hasError ? "#F87171" : colors.line}`,
    background: hasError ? "#FFF5F5" : colors.bg,
    borderRadius: radius.md,
    padding: "0 14px",
    fontSize: fontSize.sm,
    color: colors.ink,
    outline: "none",
  };
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
  width: "min(560px, 100%)",
  background: colors.card,
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
  maxHeight: "90vh",
  overflowY: "auto" as const,
};
