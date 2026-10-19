import { useEffect, useRef } from "react";
import { DEMO_CALENDAR_URL, DEMO_WIDGET_SRC } from "../booking.js";

function loadWidget() {
  if (document.querySelector(`script[src="${DEMO_WIDGET_SRC}"]`)) {
    window.Calendly?.initInlineWidgets?.();
    return;
  }
  const s = document.createElement("script");
  s.src = DEMO_WIDGET_SRC;
  s.async = true;
  document.body.appendChild(s);
}

/* Inline Calendly calendar. The widget script is added in an effect so nothing
   touches window/document during render (prerender-safe). With `lazy` the
   script waits until the calendar is near the viewport, so a long page does
   not pay for it up front. */
export default function CalendlyEmbed({ lazy = false, height = 700 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!lazy || !("IntersectionObserver" in window)) {
      loadWidget();
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadWidget();
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [lazy]);

  return (
    <div
      ref={ref}
      className="calendly-inline-widget"
      data-url={`${DEMO_CALENDAR_URL}?hide_gdpr_banner=1`}
      style={{ minWidth: 320, height }}
    />
  );
}
