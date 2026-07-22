"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import LocationMapPicker, { type LocationValue } from "@/components/LocationMapPicker";
import ProfessionalDashboardService from "@/services/ProfessionalDashboardService";

interface ImageItem {
  key: string;
  file?: File;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  imageId?: string;
}

/** Web counterpart of homedot-mobile-app's UploadImagesModal (opened from
 * ProfessionalGalleryScreen's "+" FAB) — same photo-upload state machine as
 * InitiateProjectModal (uploading/done/error, drag/drop, tap to retry,
 * reusing .pa-dropzone/.pa-image-tile), plus a required location. Mobile
 * collects the address into what it calls "location" in its own UI, but
 * actually sends it to the backend as `projectName` — see
 * ProfessionalGalleryService.addProject's comment; this modal only needs to
 * produce that one string, so the field is just labeled "Location" here. */
export default function AddWorkModal({
  loading,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { projectName: string; projectImages: string[] }) => Promise<void>;
}) {
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [touched, setTouched] = useState(false);

  const [items, setItems] = useState<ImageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  const canSubmit = !!location?.address && doneImageIds.length > 0 && !uploading && !loading;

  const submit = async () => {
    setTouched(true);
    if (!canSubmit || !location) return;
    await onSubmit({ projectName: location.address, projectImages: doneImageIds });
  };

  return (
    <div className="eq-modal-overlay" onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} className="eq-modal-card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 20px", borderBottom: `1px solid ${colors.line}` }}>
          <div style={{ paddingRight: 12 }}>
            <p style={{ fontSize: fontSize.md - 1, fontWeight: 700, color: colors.ink, margin: 0 }}>Add work photos</p>
            <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0, marginTop: 2 }}>Showcase completed work in your Workfolio</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: colors.muted, flexShrink: 0 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: spacing.md }}>
          <Field label="Location" error={touched && !location?.address ? "Required" : undefined}>
            <LocationMapPicker value={location} onChange={setLocation} height={180} />
          </Field>

          <Field label="Photos" error={touched && doneImageIds.length === 0 ? "Add at least one photo" : undefined}>
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
              <Icon name="briefcase" size={15} color="#fff" /> {loading ? "Adding…" : "Add to Workfolio"}
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
