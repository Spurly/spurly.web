import { useEffect, useRef, useState } from "react";
import { subscribeRouteLoading } from "src/app/routeLoadingStore";

/**
 * Thin top-of-page progress indicator for in-flight route chunk loads.
 *
 * Rendered OUTSIDE the <Suspense> boundary in AppRoutes so it is never
 * itself deferred by v7_startTransition -- it's the only visible signal a
 * user gets that navigation is happening while the previous page still
 * shows underneath (see routeLoadingStore.js for the why).
 *
 * Delayed by SHOW_DELAY_MS so a normal fast chunk load (already cached,
 * same-region request) never flashes it -- only a genuinely slow one
 * shows it, which is the only case it needs to cover.
 */
const SHOW_DELAY_MS = 200;

export function RouteProgressBar() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return subscribeRouteLoading((loading) => {
      clearTimeout(timerRef.current);
      if (loading) {
        timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      } else {
        setVisible(false);
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] overflow-hidden pointer-events-none"
      role="progressbar"
      aria-label="Loading page"
    >
      <div className="route-progress-bar h-full w-1/3 bg-[var(--ui-accent)]" />
      <style>{`
        @keyframes route-progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .route-progress-bar {
          animation: route-progress-slide 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
