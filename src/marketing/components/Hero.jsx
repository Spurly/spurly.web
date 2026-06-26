import { ChromeLink } from "./Button.jsx";
import Button from "./Button.jsx";
import { TargetIcon } from "../icons.jsx";
import DotGlow from "./DotGlow.jsx";
import FlapBoard from "./FlapBoard.jsx";
import Globe from "./Globe.jsx";

export default function Hero() {
  return (
    <section className="hero" data-dotglow>
      <DotGlow />
      <div className="wrap hero-globe">
        <div className="hero-copy reveal in">
          <span className="chip"><span className="dot" />Now live on the Chrome Web Store</span>
          <h1 className="display">Reach anyone.<br />Anywhere they<br />work.</h1>
          <FlapBoard words="RECRUITERS,FOUNDERS,SELLERS,STUDENTS,AGENCIES" />
          <p className="sr-only">Spurly is built for recruiters, founders, sellers, students and agencies.</p>
          <p className="lead">Spurly turns LinkedIn &amp; Sales Navigator into your pipeline — capture leads, enrich every profile, and send outreach that sounds like you, to the right people in any timezone. One click, right inside your browser.</p>
          <div className="hero-actions">
            <ChromeLink variant="primary" size="lg" magnetic>
              <TargetIcon className="cta-wobble" />
              Add to Chrome — Start free
            </ChromeLink>
            <Button variant="ghost" size="lg" href="#product">See it in action</Button>
          </div>
          <div className="globe-stat" style={{ marginTop: 30 }}>
            <div className="gs"><b className="grad-text tnum">190+</b><span>countries reachable</span></div>
            <div className="gs"><b className="grad-text tnum">1-click</b><span>capture, anywhere</span></div>
            <div className="gs"><b className="grad-text tnum">100%</b><span>local-only &amp; private</span></div>
          </div>
        </div>

        <div className="hero-globe-stage reveal d1">
          <div className="globe-stage">
            <Globe />
          </div>
        </div>
      </div>
    </section>
  );
}
