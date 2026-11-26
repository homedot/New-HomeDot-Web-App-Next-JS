"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";

const VIEWPORT = 300; // on-screen crop square, px
const OUTPUT = 720; // exported image edge, px
const MAX_ZOOM = 4;

/** Square (1:1) crop step shown before a profile photo is uploaded — the
 * web counterpart of homedot-mobile-app's ImagePicker `allowsEditing: true,
 * aspect: [1, 1]` on EditProfile / ProfessionalEditProfileScreen. Drag to
 * reposition, slider or wheel to zoom; the circle is only a guide, the
 * exported file is the full square (the avatar is masked round in the UI
 * anyway). Dependency-free: a canvas draws the selected region to a JPEG. */
export default function AvatarCropModal({
  file,
  busy = false,
  onCancel,
  onConfirm,
}: {
  file: File;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [loadError, setLoadError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Stage is VIEWPORT px wide on desktop but shrinks on narrow phones; the
  // inner square is CSS-scaled by `fit`, so pointer deltas are divided by it.
  const [fit, setFit] = useState(1);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() =>
      setFit(Math.min(1, el.clientWidth / VIEWPORT) || 1),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL is an external resource tied to the file prop
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  // "Cover" scale: the shorter side exactly fills the square at zoom 1.
  const baseScale = natural ? VIEWPORT / Math.min(natural.w, natural.h) : 1;
  const scale = baseScale * zoom;

  const clamp = useCallback(
    (o: { x: number; y: number }, z: number) => {
      if (!natural) return o;
      const s = baseScale * z;
      const maxX = Math.max(0, (natural.w * s - VIEWPORT) / 2);
      const maxY = Math.max(0, (natural.h * s - VIEWPORT) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [natural, baseScale],
  );

  const applyZoom = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    setOffset((o) => clamp(o, next));
  };

  // React's onWheel is passive, so preventDefault (to stop page scroll)
  // needs a native non-passive listener.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => {
        const next = Math.min(MAX_ZOOM, Math.max(1, z - e.deltaY * 0.0015));
        setOffset((o) => clamp(o, next));
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clamp]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = (e.clientX - d.x) / fit;
    const dy = (e.clientY - d.y) / fit;
    drag.current = { id: d.id, x: e.clientX, y: e.clientY };
    setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }, zoom));
  };
  const endDrag = () => {
    drag.current = null;
  };

  const confirm = () => {
    const img = imgRef.current;
    if (!img || !natural) return;
    // Viewport's top-left in source-image pixels.
    const size = VIEWPORT / scale;
    const sx = natural.w / 2 - (VIEWPORT / 2 + offset.x) / scale;
    const sy = natural.h / 2 - (VIEWPORT / 2 + offset.y) / scale;
    const out = Math.min(OUTPUT, Math.round(size)) || OUTPUT;
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#fff"; // JPEG has no alpha — avoid black behind PNGs
    ctx.fillRect(0, 0, out, out);
    ctx.drawImage(img, sx, sy, size, size, 0, 0, out, out);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const base = file.name.replace(/\.[^.]+$/, "") || "profile";
        onConfirm(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div
      className="login-overlay"
      onClick={() => !busy && onCancel()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: colors.overlay,
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(380px, 100%)",
          background: colors.card,
          borderRadius: 24,
          boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
          padding: "26px 24px 22px",
        }}
      >
        <button
          onClick={onCancel}
          disabled={busy}
          aria-label="Close"
          style={{
            position: "absolute",
            right: 14,
            top: 14,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(16,28,48,0.06)",
            color: colors.ink,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="close" size={17} />
        </button>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Crop your photo
        </h2>
        <p
          style={{
            color: colors.muted,
            fontSize: fontSize.sm,
            marginBottom: spacing.md,
          }}
        >
          Drag to reposition, zoom to fit.
        </p>

        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: VIEWPORT,
            aspectRatio: "1 / 1",
            margin: "0 auto",
            overflow: "hidden",
            borderRadius: radius.md,
            background: "#0b1422",
            touchAction: "none",
            cursor: busy ? "default" : "grab",
            userSelect: "none",
          }}
        >
          {/* Inner fixed-size square, scaled down on narrow phones so the
              crop math can stay in VIEWPORT px. */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: VIEWPORT,
              height: VIEWPORT,
              transform: `translate(-50%, -50%) scale(${fit})`,
            }}
          >
            {src && !loadError && (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL, canvas needs the raw element
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={(e) =>
                  setNatural({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  })
                }
                onError={() => setLoadError(true)}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: natural ? natural.w * scale : "auto",
                  height: natural ? natural.h * scale : "auto",
                  maxWidth: "none",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  opacity: natural ? 1 : 0,
                  pointerEvents: "none",
                }}
              />
            )}
            {/* circular guide */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                boxShadow: "0 0 0 999px rgba(10,20,34,0.55)",
                border: "2px solid rgba(255,255,255,0.85)",
                pointerEvents: "none",
              }}
            />
          </div>
          {loadError && (
            <p
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                padding: 24,
                textAlign: "center",
                color: "#fff",
                fontSize: fontSize.sm,
              }}
            >
              This image format can&apos;t be previewed. Please choose a JPG or
              PNG.
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: `${spacing.md}px 0 ${spacing.lg}px`,
          }}
        >
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => applyZoom(zoom - 0.25)}
            disabled={busy || zoom <= 1}
            style={zoomBtn}
          >
            −
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={busy || !natural}
            onChange={(e) => applyZoom(Number(e.target.value))}
            aria-label="Zoom"
            style={{ flex: 1, accentColor: colors.primary }}
          />
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => applyZoom(zoom + 0.25)}
            disabled={busy || zoom >= MAX_ZOOM}
            style={zoomBtn}
          >
            +
          </button>
        </div>

        <div style={{ display: "flex", gap: spacing.sm }}>
          <Button variant="outline" size="md" full onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            full
            onClick={confirm}
            disabled={busy || !natural || loadError}
            icon={busy ? undefined : <Icon name="check" size={16} />}
          >
            {busy ? "Uploading…" : "Save photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const zoomBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "rgba(16,28,48,0.06)",
  color: colors.ink,
  fontSize: 18,
  fontWeight: 700,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};
