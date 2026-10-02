import { useEffect, useRef } from "react";

/* Site-wide paper ribbons. Prerenders as an empty canvas (the page's paper
   colour shows), then the shader mounts after hydration from a lazy chunk. */
export default function SiteBackdrop({ still = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const reduced = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let fx = null;
    let cancelled = false;
    const id = window.setTimeout(() => {
      import("./hero/siteBackdrop.js")
        .then(({ mountSiteBackdrop }) => {
          if (cancelled) return;
          fx = mountSiteBackdrop(canvas, reduced);
          if (fx) canvas.classList.add("on");
        })
        .catch(() => {});
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      if (fx) fx.destroy();
      canvas.classList.remove("on");
    };
  }, [still]);

  // keyed on `still`: destroy() force-loses the GL context, and a lost
  // context cannot be reused, so a mode switch needs a fresh canvas element.
  return <canvas key={still ? "still" : "live"} ref={ref} className="site-fx" aria-hidden="true" />;
}
