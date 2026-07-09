"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Fades + slides its content up the first time it scrolls into view. Pass `stagger`
 * when wrapping a grid so each direct child (card) reveals with an incremental delay,
 * without adding an extra DOM layer per grid item. */
export default function Reveal({
  children,
  className,
  style,
  delay = 0,
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reduced-motion users get the "in-view" styles unconditionally via the
    // CSS media query in globals.css, so no JS branch is needed here.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      // threshold: 0 so reveal fires as soon as any part of the target is
      // visible — a percentage-based threshold (e.g. 0.15) never satisfies
      // for targets taller than the viewport (e.g. long card grids).
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cls = [stagger ? "reveal-stagger" : "reveal", inView ? "in-view" : "", className].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={cls} style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
