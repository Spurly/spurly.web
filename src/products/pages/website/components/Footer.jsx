import { Link } from "react-router-dom";
import { ChromeStoreLink } from "./Button.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" to="/" aria-label="Spurly home"><img src="/spurly-icon-128.png" alt="" width="34" height="34" /><span>Spurly</span></Link>
            <p>LinkedIn outreach that runs itself. Find the right people, connect, follow up and reply from one inbox — from the cloud, at a safe pace.</p>
            <p className="legal-name">Spurly is a product of ArkTech Catalyst.</p>
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
              <ChromeStoreLink>Chrome Web Store</ChromeStoreLink>
              <Link to="/signup">Start 7-day free trial</Link>
              <Link to="/login">Sign in</Link>
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
          <span>© <span id="yr">{new Date().getFullYear()}</span> ArkTech Catalyst. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
