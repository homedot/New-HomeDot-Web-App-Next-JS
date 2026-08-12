"use client";

import { useEffect } from "react";
import { colors } from "@/constants/colors";
import { radius } from "@/utils/size";
import Icon from "@/components/Icon";

/** Full-screen viewer for a single profile photo — same overlay/close-button
 * treatment as ProjectsScreen/ProjectDetail's lightbox (fade-in backdrop +
 * scale-in image, Escape/click-outside to close), just without the
 * multi-image arrows/thumbnails those galleries need. Used by ProfileScreen
 * (homeowner) and ProfessionalProfileScreen so tapping the avatar actually
 * does something instead of it looking like a static icon. */
export default function AvatarLightbox({ src, alt = "", onClose }: { src: string; alt?: string; onClose: () => void }) {
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

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
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
    </div>
  );
}
