import { ChromeLink } from "./Button.jsx";
import { TargetIcon } from "../icons.jsx";

export default function FinalCTA() {
  return (
    <section className="section-pad" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-panel reveal">
          <span className="eyebrow">Get started</span>
          <h2 className="h2" style={{ marginTop: 14 }}>Your next 100 leads are one click away.</h2>
          <p className="lead">Add Spurly to Chrome, open LinkedIn, and capture your first Session in under a minute. Free to start — no credit card.</p>
          <div className="hero-actions">
            <ChromeLink variant="primary" size="lg" magnetic>
              <TargetIcon className="cta-wobble" />
              Add to Chrome — Start free
            </ChromeLink>
          </div>
        </div>
      </div>
    </section>
  );
}
