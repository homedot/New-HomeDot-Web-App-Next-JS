"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { colors } from "@/constants/colors";

const TRAIL_COUNT = 7;
const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, [role='button'], article";

export default function Cursor() {
  const layerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Portal target guard: `document` doesn't exist during SSR, and even on
  // the client the very first render must match the server's markup to
  // avoid a hydration mismatch — so this flips true only after mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-detection guard for the portal target (document.body), which doesn't exist during SSR
    setMounted(true);
  }, []);

  useEffect(() => {
    // Bails until the portal-gated render below has actually committed —
    // before that, layerRef/coreRef/ringRef are still null since nothing
    // was rendered yet. Depending on `mounted` (rather than `[]`) re-runs
    // this once that render lands, instead of running only once against a
    // still-null first render and never again.
    if (!mounted) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = layerRef.current;
    const core = coreRef.current;
    const ring = ringRef.current;
    const trail = trailRefs.current;
    if (!layer || !core || !ring) return;

    document.body.classList.add("has-cursor");

    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    const tx = new Array(TRAIL_COUNT).fill(-100);
    const ty = new Array(TRAIL_COUNT).fill(-100);
    let shown = false;
    let raf = 0;

    const show = () => {
      if (!shown) {
        shown = true;
        layer.classList.add("on");
      }
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      show();
      core.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (reduce) ring.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    };

    const onOver = (e: MouseEvent) => {
      const hit = e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR);
      ring.classList.toggle("hover", !!hit);
      core.classList.toggle("hover", !!hit);
    };
    const onDown = () => ring.classList.add("down");
    const onUp = () => ring.classList.remove("down");
    const onLeave = () => {
      layer.classList.remove("on");
      shown = false;
    };

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;

      let px = mx;
      let py = my;
      for (let i = 0; i < TRAIL_COUNT; i++) {
        tx[i] += (px - tx[i]) * 0.34;
        ty[i] += (py - ty[i]) * 0.34;
        const s = 1 - (i + 1) / (TRAIL_COUNT + 2);
        const dot = trail[i];
        if (dot) {
          dot.style.transform = `translate3d(${tx[i]}px, ${ty[i]}px, 0) scale(${s})`;
          dot.style.opacity = shown ? (0.55 * s).toFixed(3) : "0";
        }
        px = tx[i];
        py = ty[i];
      }
      raf = requestAnimationFrame(loop);
    };
    if (!reduce) raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.body.classList.remove("has-cursor");
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      layer.classList.remove("on");
    };
  }, [mounted]);

  if (!mounted) return null;

  // Portaled straight to <body>: every screen mounts <Cursor /> inside a
  // `position: relative; zIndex: 0` root wrapper, which establishes its own
  // stacking context. Rendered as a normal child, .cursor-layer's z-index
  // (however large) only wins against siblings *inside* that context — a
  // portaled overlay like LoginModal, appended straight to <body>, sits in
  // a separate top-level stacking context and would paint over the cursor.
  // Portaling here keeps the cursor a body-level sibling of those overlays
  // too, so its z-index is compared where it's actually meant to win.
  return createPortal(
    <div className="cursor-layer" ref={layerRef} aria-hidden="true" style={{ "--cursor-accent": colors.accent } as CSSProperties}>
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <div
          key={i}
          className="cursor-trail"
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
        />
      ))}
      <div className="cursor-ring" ref={ringRef}>
        <svg className="cursor-glyph" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6 10.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8.5" />
        </svg>
      </div>
      <div className="cursor-core" ref={coreRef} />
    </div>,
    document.body,
  );
}
