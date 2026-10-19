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
          <h2 className="h2" style={{ marginTop: 14 }}>Before you book, <em>read this.</em></h2>
          <p>Something else? <a className="more-link" href="#book">Book a call</a> and ask us.</p>
        </div>
        <div className="home-faq reveal d1">
          {HOME_FAQ.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
