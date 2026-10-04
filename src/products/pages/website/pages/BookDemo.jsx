import { useEffect } from "react";
import Seo from "../components/Seo.jsx";
import { breadcrumbLd } from "../seo.js";
import ContentShell from "../components/ContentShell.jsx";
import { DEMO_CALENDAR_URL, DEMO_WIDGET_SRC } from "../booking.js";

/* Demo booking page. The Calendly widget script is added in an effect so
   nothing touches window/document during render (prerender-safe); the link
   below the heading is the fallback when the script is blocked or JS is off. */

export default function BookDemo() {
  useEffect(() => {
    if (document.querySelector(`script[src="${DEMO_WIDGET_SRC}"]`)) {
      window.Calendly?.initInlineWidgets?.();
      return;
    }
    const s = document.createElement("script");
    s.src = DEMO_WIDGET_SRC;
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <ContentShell>
      <Seo
        title="Book a demo — Spurly"
        description="Book a 30-minute call with the Spurly founders. See LinkedIn outreach that runs itself, ask questions, and plan a team or organization rollout."
        path="/book-demo"
        jsonLd={[breadcrumbLd([["Home", "/"], ["Book a demo", "/book-demo"]])]}
      />

      <article className="prose wrap">
        <p className="eyebrow">Book a demo</p>
        <h1 className="h1">Talk to the Spurly founders</h1>
        <p>
          Pick a time for a 30-minute call. We will walk through how Spurly finds people, sends
          connection requests and follow-ups at a safe pace, and brings replies into one inbox. If
          you are rolling it out to a team or an organization, we will agree a plan around how many
          seats you need.
        </p>
        <p>
          Prefer to open it in a new tab?{" "}
          <a href={DEMO_CALENDAR_URL} rel="noopener">Book on Calendly</a>.
        </p>

        <div
          className="calendly-inline-widget"
          data-url={`${DEMO_CALENDAR_URL}?hide_gdpr_banner=1`}
          style={{ minWidth: 320, height: 700 }}
        />
      </article>
    </ContentShell>
  );
}
