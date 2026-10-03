import { HOME_FAQ } from "./homeFaq.js";

export default function HomeFaq() {
  return (
    <section id="faq" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">FAQ</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Questions, <em>answered first.</em></h2>
        </div>
        <div className="faq-block home-faq">
          {HOME_FAQ.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
