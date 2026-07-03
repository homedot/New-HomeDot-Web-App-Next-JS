"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A tall block whose content stays pinned (`position: sticky`) on screen while the
 * user scrolls through it; exposes a 0→1 `--pin` custom property tracking how far
 * they've scrolled through that pinned range, for full-bleed "scroll to zoom/reveal a
 * scene" moments (pair with `.pin-scale` / `.pin-rise`). `heightVh` controls how much
 * scroll distance the pin lasts for — bigger means a slower, longer scrub. `navOffset`
 * nudges the centred content down by that many px so it doesn't render underneath a
 * sticky header sitting above it (the background layer still fills the full 100vh). */
export default function ScrollPin({
  children,
  heightVh = 220,
  navOffset = 0,
  className,
}: {
  children: ReactNode;
  heightVh?: number;
  navOffset?: number;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let raf = 0;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const rect = outer.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
        inner.style.setProperty("--pin", progress.toFixed(3));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={outerRef} className={["scroll-pin-outer", className].filter(Boolean).join(" ")} style={{ height: `${heightVh}vh` }}>
      <div ref={innerRef} className="scroll-pin-inner" style={navOffset ? { paddingTop: navOffset } : undefined}>
        {children}
      </div>
    </div>
  );
}
