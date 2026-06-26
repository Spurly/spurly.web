import { Link } from "react-router-dom";
import { CHROME_URL } from "./Button.jsx";
import { ShieldIcon } from "../icons.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" to="/" aria-label="Spurly home"><img src="/assets/spurly-icon.png" alt="Spurly" width="56" height="56" /><span>Spurly</span></Link>
            <p>The LinkedIn prospecting &amp; outreach tool that lives in your browser. Capture, connect, reach out — at scale.</p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h4>Product</h4>
              <a href="/#how">How it works</a>
              <a href="/#who">Who it's for</a>
              <a href="/#product">Product</a>
              <a href="/#pricing">Pricing</a>
              <Link to="/blog">Blog</Link>
            </div>
            <div className="foot-col">
              <h4>Get Spurly</h4>
              <a href={CHROME_URL} target="_blank" rel="noopener">Chrome Web Store</a>
              <a href={CHROME_URL} target="_blank" rel="noopener">Start free</a>
              <a href={CHROME_URL} target="_blank" rel="noopener">Sign in</a>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/support">Support</Link>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© <span id="yr">{new Date().getFullYear()}</span> Spurly. All rights reserved.</span>
          <span className="priv"><ShieldIcon />Local-only · your data never leaves your device without you</span>
        </div>
      </div>
    </footer>
  );
}
