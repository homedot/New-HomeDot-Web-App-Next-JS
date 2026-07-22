"use client";

import { useEffect } from "react";
import { colors } from "@/constants/colors";
import { radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import type { GalleryImage } from "@/services/ProfessionalGalleryService";

/** Full-screen photo viewer — same overlay/close-button/arrow treatment as
 * ProjectsScreen/ProjectDetail's lightbox, plus Escape/Arrow-key navigation,
 * a thumbnail strip, and a delete action (both absent from that one but
 * present on homedot-mobile-app's ProfessionalGalleryScreen.js viewer).
 * Mobile only labels each photo "Active Project"/"Past Project" with no real
 * project details — this shows the actual projectName/location too, since
 * that data is already on hand and showing it is strictly more useful. */
export default function WorkfolioLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  onDelete,
  deleting,
}: {
  images: GalleryImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onDelete: (image: GalleryImage) => void;
  deleting: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndexChange]);

  const current = images[index];
  if (!current) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10,20,34,0.92)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        cursor: "zoom-out",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
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
          {index + 1} / {images.length}
        </span>
      )}

      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: "90vw" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.projectImage} alt="" style={{ maxWidth: "90vw", maxHeight: "68vh", objectFit: "contain", borderRadius: radius.md, cursor: "default" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              fontWeight: 700,
              color: colors.white,
              background: current.historyType ? "rgba(245,166,35,0.28)" : "rgba(34,197,94,0.28)",
              padding: "5px 12px",
              borderRadius: radius.full,
            }}
          >
            <Icon name={current.historyType ? "clock" : "check"} size={11} color={colors.white} />
            {current.historyType ? "Past Project" : "Active Project"}
          </span>
          {(current.projectName || current.location) && (
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm, fontWeight: 600 }}>
              {current.projectName}
              {current.projectName && current.location ? " · " : ""}
              {current.location}
            </span>
          )}
          <button
            onClick={() => onDelete(current)}
            disabled={deleting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: fontSize.xs,
              fontWeight: 700,
              color: "#FCA5A5",
              background: "rgba(220,38,38,0.16)",
              padding: "6px 14px",
              borderRadius: radius.full,
            }}
          >
            <Icon name="trash" size={13} color="#FCA5A5" /> {deleting ? "Removing…" : "Remove photo"}
          </button>
        </div>

        {images.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", maxWidth: "90vw", padding: "4px 2px" }}>
            {images.map((img, i) => (
              <button
                key={img._id}
                onClick={() => onIndexChange(i)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: radius.sm,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: i === index ? `2px solid ${colors.white}` : "2px solid transparent",
                  opacity: i === index ? 1 : 0.55,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.projectImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index - 1 + images.length) % images.length);
            }}
            aria-label="Previous photo"
            style={{
              position: "absolute",
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
              onIndexChange((index + 1) % images.length);
            }}
            aria-label="Next photo"
            style={{
              position: "absolute",
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
    </div>
  );
}
