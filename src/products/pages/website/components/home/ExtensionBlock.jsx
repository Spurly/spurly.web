import { Link } from "react-router-dom";
import { ChromeLink } from "../Button.jsx";

export default function ExtensionBlock() {
  return (
    <section id="extension" className="section-pad" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="ext-block glass reveal">
          <div>
            <h2 className="h3">Prefer to capture as you browse?</h2>
            <p>The optional Spurly Chrome extension saves profiles from LinkedIn and Sales Navigator pages straight into Spurly. <Link className="more-link" to="/product/chrome-extension">About the extension →</Link></p>
          </div>
          <ChromeLink variant="primary" size="lg">Add to Chrome</ChromeLink>
        </div>
      </div>
    </section>
  );
}
