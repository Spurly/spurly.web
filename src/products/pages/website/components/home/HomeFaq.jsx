import { HOME_FAQ } from "./homeFaq.js";

/* Collapsed by default to keep the page short. The answers are still in the
   prerendered HTML (<details> content is in the DOM), and they are the same
   text as the FAQPage JSON-LD. */
export default function HomeFaq() {
  return (
    <section id="faq" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">FAQ</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Questions, <em>answered first.</em></h2>
        </div>
        <div className="home-faq">
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
