"use client";

import { useEffect, useRef } from "react";
import { colors } from "@/constants/colors";

/** Layered, drifting, morphing blobs + a panning dot-grid behind the hero copy.
 * Parallaxes with both scroll and cursor position, and fades out as the user scrolls
 * past — giving the "diving into the page, explore as you move" feel on load. */
export default function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let scrollY = 0;
    let mx = 0;
    let my = 0;
    let raf = 0;

    const apply = () => {
      const shift = Math.min(scrollY * 0.14, 90);
      const fade = Math.max(1 - scrollY / 650, 0.25);
      scene.style.transform = `translate3d(${mx}px, ${shift + my}px, 0)`;
      scene.style.opacity = `${fade}`;
    };

    const onScroll = () => {
      scrollY = window.scrollY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    const onMove = (e: MouseEvent) => {
      mx = ((e.clientX / window.innerWidth) - 0.5) * 22;
      my = ((e.clientY / window.innerHeight) - 0.5) * 16;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (fine) window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      if (fine) window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div ref={sceneRef} className="hero-scene" aria-hidden="true">
      <div className="hero-grid" />
      <span
        className="hero-blob hero-blob-a"
        style={{ width: 340, height: 340, left: "4%", top: "-10%", background: `radial-gradient(circle, ${colors.accent}, transparent 70%)`, opacity: 0.5 }}
      />
      <span
        className="hero-blob hero-blob-b"
        style={{ width: 260, height: 260, right: "8%", top: "16%", background: "radial-gradient(circle, #34A853, transparent 70%)", opacity: 0.32 }}
      />
      <span
        className="hero-blob hero-blob-c"
        style={{ width: 420, height: 420, left: "36%", bottom: "-20%", background: `radial-gradient(circle, ${colors.primaryDeep}, transparent 72%)`, opacity: 0.55 }}
      />
      <span
        className="hero-blob hero-blob-a"
        style={{ width: 190, height: 190, right: "22%", bottom: "6%", background: `radial-gradient(circle, ${colors.gold}, transparent 70%)`, opacity: 0.28, animationDelay: "-9s" }}
      />
    </div>
  );
}
