import { Link } from "react-router-dom";
import { HOME_FAQ } from "./homeFaq.js";

/* Title on the left, answers on the right. Collapsed by default to keep the
   page short. The answers are still in the prerendered HTML (<details>
   content is in the DOM), and they are the same text as the FAQPage JSON-LD,
   so homeFaq.js is left untouched. */
export default function HomeFaq() {
  return (
    <section id="faq" className="faq-sec section-pad">
      <div className="wrap faq-wrap">
        <div className="faq-side reveal">
          <span className="eyebrow">FAQ</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Questions, <em>answered first.</em></h2>
          <p>Something else? <Link className="more-link" to="/book-demo">Book a demo</Link> and ask us.</p>
        </div>
        <div className="home-faq reveal d1">
          {HOME_FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
