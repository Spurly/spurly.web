import { Link } from "react-router-dom";
import CalendlyEmbed from "../CalendlyEmbed.jsx";
import { DEMO_CALENDAR_URL } from "../../booking.js";
import { usePrice } from "../../hooks/usePrice.js";

const ON_THE_CALL = [
  "A clear picture of who to reach, and the exact people on LinkedIn who fit.",
  "A sample message written for your audience, so you see how it reads.",
  "A plan for how many invites to send each week and what happens when they reply.",
];

/* Book a call, on the page: the calendar loads when it nears the viewport.
   The link under the copy is the fallback when the script is blocked. */
export default function BookCall() {
  const price = usePrice();
  return (
    <section id="book" className="book section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Book a call</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Talk to the founders. <em>See it on your account.</em></h2>
          <p className="lead">A free 30-minute call. No pitch deck, no pressure. Pick a time below.</p>
        </div>
        <div className="book-grid">
          <div className="book-side reveal">
            <h3>You leave the call with</h3>
            <ol>
              {ON_THE_CALL.map((t) => <li key={t}>{t}</li>)}
            </ol>
            {price.sale && (
              <p className="book-urgent">
                {price.sale.label}: the {price.sale.audience} get {price.now} a month, {price.sale.lock}.
              </p>
            )}
            <p className="book-alt">
              Calendar not loading? <a href={DEMO_CALENDAR_URL} rel="noopener">Book on Calendly</a>.
            </p>
            <p className="book-alt">
              Prefer to set it up yourself? <Link to="/signup">Get started</Link>.
            </p>
          </div>
          <div className="book-card reveal d1">
            <CalendlyEmbed lazy height={680} />
          </div>
        </div>
      </div>
    </section>
  );
}
