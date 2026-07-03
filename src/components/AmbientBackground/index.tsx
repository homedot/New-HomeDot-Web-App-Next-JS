"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { colors } from "@/constants/colors";

const PARTICLES: { left: string; top: string; size: number; color: string; duration: number; delay: number; drift: number }[] = [
  { left: "8%", top: "18%", size: 5, color: colors.accent, duration: 13, delay: 0, drift: 14 },
  { left: "22%", top: "62%", size: 4, color: "#34A853", duration: 16, delay: 2, drift: -18 },
  { left: "41%", top: "30%", size: 6, color: colors.accent, duration: 12, delay: 5, drift: 10 },
  { left: "63%", top: "72%", size: 4, color: colors.gold, duration: 18, delay: 1, drift: -12 },
  { left: "78%", top: "22%", size: 5, color: "#34A853", duration: 14, delay: 4, drift: 16 },
  { left: "88%", top: "58%", size: 4, color: colors.accent, duration: 17, delay: 3, drift: -10 },
  { left: "52%", top: "86%", size: 5, color: colors.gold, duration: 15, delay: 6, drift: 12 },
];

/** Fixed, page-wide layer of slow-drifting, morphing gradient blobs, a panning
 * dot-grid and floating particles. Sits behind every section (see LandingScreen's
 * positioned root) and shows through wherever a section has no opaque background.
 * Reacts to both scroll (parallax) and cursor movement (fine-pointer only), giving
 * the page a sense of depth as the user explores it. */
export default function AmbientBackground() {
  const shiftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const shift = shiftRef.current;
    if (!shift) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let scrollY = 0;
    let mx = 0;
    let my = 0;
    let raf = 0;

    const apply = () => {
      const parallax = (scrollY * 0.05) % 260;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;
      const rotate = progress * 10;
      const scale = 1 + progress * 0.06;
      shift.style.transform = `translate3d(${mx}px, ${parallax + my}px, 0) rotate(${rotate}deg) scale(${scale})`;
    };

    const onScroll = () => {
      scrollY = window.scrollY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    const onMove = (e: MouseEvent) => {
      mx = ((e.clientX / window.innerWidth) - 0.5) * 26;
      my = ((e.clientY / window.innerHeight) - 0.5) * 18;
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
    <div className="ambient-layer" aria-hidden="true">
      <div ref={shiftRef} style={{ position: "absolute", inset: 0 }}>
        <span
          className="ambient-blob ambient-blob-a"
          style={{ width: 480, height: 480, left: "-10%", top: "2%", background: `radial-gradient(circle, ${colors.accent}, transparent 72%)`, opacity: 0.2 }}
        />
        <span
          className="ambient-blob ambient-blob-b"
          style={{ width: 400, height: 400, right: "-8%", top: "34%", background: "radial-gradient(circle, #34A853, transparent 72%)", opacity: 0.15 }}
        />
        <span
          className="ambient-blob ambient-blob-c"
          style={{ width: 540, height: 540, left: "16%", top: "74%", background: `radial-gradient(circle, ${colors.primary}, transparent 74%)`, opacity: 0.13 }}
        />
        <span
          className="ambient-blob ambient-blob-b"
          style={{ width: 260, height: 260, left: "48%", top: "10%", background: `radial-gradient(circle, ${colors.gold}, transparent 72%)`, opacity: 0.12, animationDelay: "-6s" }}
        />
        <div className="ambient-grid" />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="ambient-particle"
            style={
              {
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: p.color,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                "--particle-drift": `${p.drift}px`,
                "--particle-opacity": 0.5,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
