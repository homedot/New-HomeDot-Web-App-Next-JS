"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Wraps the site header and toggles a `nav-scrolled` class on it once the page has
 * scrolled past a small threshold — the header shrinks, its blur/shadow intensify,
 * and a bottom border fades in, all animated via CSS transitions. Mutates the class
 * directly (no React state) so it doesn't re-render the header on every scroll tick.
 *
 * Enter/exit thresholds are intentionally different (32 vs 12): a single shared
 * threshold flickers the class on/off rapidly during momentum or rubber-band
 * scrolling right at that boundary, which reads as the header visibly shaking. */
export default function NavShell({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let scrolled = false;
    let ticking = false;

    const apply = () => {
      ticking = false;
      const y = window.scrollY;
      if (!scrolled && y > 32) {
        scrolled = true;
        el.classList.add("nav-scrolled");
      } else if (scrolled && y < 12) {
        scrolled = false;
        el.classList.remove("nav-scrolled");
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={ref} className={className}>
      {children}
    </header>
  );
}
