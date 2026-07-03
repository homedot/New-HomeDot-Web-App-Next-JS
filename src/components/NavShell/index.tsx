"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Wraps the site header and toggles a `nav-scrolled` class on it once the page has
 * scrolled past a small threshold — the header shrinks, its blur/shadow intensify,
 * and a bottom border fades in, all animated via CSS transitions. Mutates the class
 * directly (no React state) so it doesn't re-render the header on every scroll tick. */
export default function NavShell({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      el.classList.toggle("nav-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={ref} className={className}>
      {children}
    </header>
  );
}
