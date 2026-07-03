"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** Exposes a 0→1 progress value as the `--scrub` CSS custom property, updated on every
 * scroll frame from the element's own position in the viewport. Pair with a class
 * that reads `var(--scrub)` (e.g. `.scrub-rise`, `.scrub-zoom`, `.scrub-clip`) so the
 * animation tracks the scroll continuously — forward and backward — rather than
 * firing once like a plain "reveal on enter". `start`/`end` are fractions of the
 * viewport height: progress is 0 while the element's top is at `start` and 1 once it
 * reaches `end`. */
export default function ScrollScrub({
  children,
  className,
  style,
  start = 0.88,
  end = 0.42,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  start?: number;
  end?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const startY = vh * start;
        const endY = vh * end;
        const progress = Math.min(Math.max((startY - rect.top) / (startY - endY), 0), 1);
        el.style.setProperty("--scrub", progress.toFixed(3));
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
  }, [start, end]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
