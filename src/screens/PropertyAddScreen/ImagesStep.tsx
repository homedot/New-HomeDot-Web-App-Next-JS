"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import MarketplaceScreenService from "@/services/MarketplaceScreenService";
import type { UploadedImage } from "./shared";

interface ImageItem {
  key: string;
  // Absent for images that came in pre-loaded via `initialImages` (an
  // existing property's photos, in the edit flow) — there's no local File to
  // retry from, only an already-uploaded server id.
  file?: File;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  imageId?: string;
}

export default function ImagesStep({
  initialImages,
  setImages,
  onBack,
  onContinue,
}: {
  // Existing photos to seed the grid with — used when editing a property
  // that already has images, so the owner sees (and can remove) them instead
  // of a blank uploader implying there are none.
  initialImages?: UploadedImage[];
  setImages: (images: UploadedImage[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [items, setItems] = useState<ImageItem[]>(() =>
    (initialImages ?? []).map((img) => ({
      key: img.id,
      previewUrl: img.url,
      status: "done" as const,
      imageId: img.id,
    })),
  );
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Pushes the uploaded subset of `items` up to the parent (which needs it
  // for the payload and the Review step's thumbnails) whenever it changes.
  // This runs as an effect — not inline inside the setItems updater above —
  // because calling a *different* component's setState synchronously from
  // within your own setState updater trips React's
  // "Cannot update a component while rendering a different component"
  // warning (and can silently drop updates under fast-resolving uploads).
  useEffect(() => {
    setImages(
      items
        .filter((i) => i.status === "done" && i.imageId)
        .map((i) => ({ id: i.imageId as string, url: i.previewUrl })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const uploadOne = async (item: ImageItem) => {
    if (!item.file) return;
    const res = await MarketplaceScreenService.uploadPropertyImage(item.file);
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
  const hasUploaded = items.some((i) => i.status === "done");

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
        Add photos
      </h1>
      <p style={{ fontSize: fontSize.base, color: colors.muted, marginBottom: spacing.xl - 2 }}>
        Listings with real photos get far more enquiries. You can add more later.
      </p>

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
          height: 140,
          border: `1.5px dashed ${dragActive ? colors.primary : colors.line}`,
          borderRadius: radius.md,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          color: colors.muted,
          background: dragActive ? colors.primarySoft : colors.card,
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: colors.primarySoft,
            color: colors.primary,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="grid" size={20} />
        </span>
        <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.ink }}>
          Drag photos here, or click to upload
        </span>
        <span style={{ fontSize: fontSize.xs }}>JPG or PNG, multiple allowed</span>
      </button>

      {items.length > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3"
          style={{ gap: spacing.md, marginTop: spacing.lg }}
        >
          {items.map((item, i) => (
            <div
              key={item.key}
              className="pa-image-tile"
              style={{
                position: "relative",
                borderRadius: radius.md,
                overflow: "hidden",
                aspectRatio: "4 / 3",
                border: `1px solid ${colors.line}`,
                animationDelay: `${Math.min(i, 8) * 40}ms`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={() => removeItem(item.key)}
                aria-label="Remove image"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(16,28,48,0.65)",
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="close" size={13} color={colors.white} />
              </button>
              {item.status === "uploading" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(16,28,48,0.45)",
                    color: colors.white,
                    display: "grid",
                    placeItems: "center",
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                  }}
                >
                  Uploading…
                </div>
              )}
              {item.status === "error" && (
                <button
                  onClick={() => retryItem(item)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(192,57,43,0.75)",
                    color: colors.white,
                    display: "grid",
                    placeItems: "center",
                    fontSize: fontSize.xs,
                    fontWeight: 700,
                  }}
                >
                  Failed — tap to retry
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => !uploading && onContinue()}
        className={`login-cta${!uploading ? " is-ready" : ""}`}
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
          opacity: uploading ? 0.5 : 1,
        }}
      >
        {uploading ? "Uploading…" : hasUploaded ? "Continue" : "Skip for now"}
        {!uploading && <Icon name="arrow" size={18} color={colors.white} />}
      </button>
    </div>
  );
}
