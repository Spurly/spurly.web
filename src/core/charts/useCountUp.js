import { useEffect, useRef, useState } from 'react';
import { useAnimatedOk } from './useAnimatedOk.js';

/**
 * Eases a displayed number toward `target`. Starts from the value currently on
 * screen, so a changed target glides rather than restarting from zero. With
 * reduced motion, no rAF, or a non-finite target it just returns the target.
 */
export function useCountUp(target, duration = 900) {
  const animate = useAnimatedOk();
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!animate || !Number.isFinite(target) || typeof requestAnimationFrame !== 'function') return undefined;
    const startValue = from.current;
    const startTime = performance.now();
    let frame = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const value = startValue + (target - startValue) * (1 - Math.pow(1 - t, 3));
      from.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, animate]);

  return animate && Number.isFinite(target) ? shown : target;
}
