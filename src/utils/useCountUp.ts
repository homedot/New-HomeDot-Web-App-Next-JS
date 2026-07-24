import { useEffect, useState } from "react";

/** Eases a number from 0 up to `target` over `duration`ms on mount/target
 * change — skipped (jumps straight to target) under reduced-motion, same
 * convention as HeroScene/AmbientBackground. Shared by any dashboard tile,
 * ring or bar that wants an animated count/percentage. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion bypass just mirrors the prop, no tween to run
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default useCountUp;
