import { Link } from "react-router-dom";
import { ChromeStoreLink } from "./Button.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" to="/" aria-label="Spurly home"><img src="/spurly-icon-128.png" alt="" width="34" height="34" /><span>Spurly</span></Link>
            <p>AI-powered LinkedIn outreach. AI drafts your messages, then campaigns find people, connect, follow up and collect replies in one inbox, from the cloud at a safe pace.</p>
            <p className="legal-name">Spurly is a product of ArkTech Catalyst.</p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h4>Product</h4>
              <Link to="/product/campaigns">Campaigns</Link>
              <Link to="/product/inbox">Inbox</Link>
              <Link to="/product/lead-finder">Lead finder</Link>
              <Link to="/product/safety">Safety</Link>
              <Link to="/product/chrome-extension">Chrome extension</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <div className="foot-col">
              <h4>Solutions</h4>
              <Link to="/solutions/founders">Founders</Link>
              <Link to="/solutions/sales-teams">Sales teams</Link>
              <Link to="/solutions/recruiters">Recruiters</Link>
              <Link to="/compare/spurly-vs-expandi">Spurly vs Expandi</Link>
              <Link to="/compare/spurly-vs-dripify">Spurly vs Dripify</Link>
              <Link to="/compare/spurly-vs-waalaxy">Spurly vs Waalaxy</Link>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/security">Security</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/book-demo">Book a demo</Link>
              <Link to="/support">Support</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </div>
            <div className="foot-col">
              <h4>Get Spurly</h4>
              <Link to="/signup">Start 7-day free trial</Link>
              <Link to="/login">Sign in</Link>
              <ChromeStoreLink>Chrome Web Store</ChromeStoreLink>
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
