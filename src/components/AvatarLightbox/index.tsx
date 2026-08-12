"use client";

import { useEffect } from "react";
import { colors } from "@/constants/colors";
import { radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";

/** Full-screen viewer for a single profile photo — same overlay/close-button
 * treatment as ProjectsScreen/ProjectDetail's lightbox (fade-in backdrop +
 * scale-in image, Escape/click-outside to close), just without the
 * multi-image arrows/thumbnails those galleries need. Used by ProfileScreen
 * (homeowner) and ProfessionalProfileScreen so tapping the avatar actually
 * does something instead of it looking like a static icon. `onRemove` is
 * optional — same "Remove photo" affordance as WorkfolioLightbox's delete
 * button, only shown where the caller actually wants a remove action
 * (both edit-profile screens; ProfessionalDashboardScreen's read-only rail
 * avatar omits it). */
export default function AvatarLightbox({
  src,
  alt = "",
  onClose,
  onRemove,
  removing = false,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
  onRemove?: () => void;
  removing?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="pd-lightbox-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10,20,34,0.92)",
        backdropFilter: "blur(4px)",
        display: "flex",
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

      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: "90vw" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="pd-lightbox-img"
          style={{
            maxWidth: "min(90vw, 520px)",
            maxHeight: "80vh",
            width: "100%",
            height: "auto",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            borderRadius: radius.lg,
            cursor: "default",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
          }}
        />

        {onRemove && (
          <button
            onClick={onRemove}
            disabled={removing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: fontSize.xs,
              fontWeight: 700,
              color: "#FCA5A5",
              background: "rgba(220,38,38,0.16)",
              padding: "8px 16px",
              borderRadius: radius.full,
            }}
          >
            <Icon name="trash" size={13} color="#FCA5A5" /> {removing ? "Removing…" : "Remove photo"}
          </button>
        )}
      </div>
    </div>
  );
}
