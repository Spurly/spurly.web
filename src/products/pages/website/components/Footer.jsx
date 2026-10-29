import { Link } from "react-router-dom";
import { ChromeStoreLink } from "./Button.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" to="/" aria-label="Spurly home"><img src="/spurly-icon-128.png" alt="" width="34" height="34" /><span>Spurly</span></Link>
            <p>AI SDR for LinkedIn. Spurly finds high-intent leads, writes personalized messages with AI and follows up until they reply, from the cloud at a safe pace.</p>
            <p className="legal-name">Spurly is a product of ArkTech Catalyst.</p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h4>Product</h4>
              <Link to="/product/campaigns">Campaigns</Link>
              <Link to="/product/inbox">Inbox</Link>
              <Link to="/product/lead-finder">Lead finder</Link>
              <Link to="/product/network">Network and invitations</Link>
              <Link to="/product/enrichment">Enrichment</Link>
              <Link to="/product/posts">Posts</Link>
              <Link to="/product/ai-assistants">Claude (MCP)</Link>
              <Link to="/product/safety">Safety</Link>
              <Link to="/product/chrome-extension">Chrome extension</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <div className="foot-col">
              <h4>Solutions</h4>
              <Link to="/solutions/founders">Founders</Link>
              <Link to="/solutions/sales-teams">Sales teams</Link>
              <Link to="/solutions/recruiters">Recruiters</Link>
              <Link to="/solutions/agencies">Agencies</Link>
              <Link to="/solutions/job-seekers">Job seekers</Link>
            </div>
            <div className="foot-col">
              <h4>Compare</h4>
              <Link to="/compare/spurly-vs-dripify">Spurly vs Dripify</Link>
              <Link to="/compare/spurly-vs-waalaxy">Spurly vs Waalaxy</Link>
              <Link to="/compare/spurly-vs-expandi">Spurly vs Expandi</Link>
              <Link to="/compare/spurly-vs-heyreach">Spurly vs HeyReach</Link>
              <Link to="/compare/spurly-vs-lemlist">Spurly vs Lemlist</Link>
              <Link to="/compare/spurly-vs-linked-helper">Spurly vs Linked Helper</Link>
              <Link to="/compare/spurly-vs-phantombuster">Spurly vs PhantomBuster</Link>
            </div>
            <div className="foot-col">
              <h4>Resources</h4>
              <Link to="/best/linkedin-automation-tools">Best LinkedIn automation tools</Link>
              <Link to="/alternatives/dripify-alternatives">Dripify alternatives</Link>
              <Link to="/alternatives/waalaxy-alternatives">Waalaxy alternatives</Link>
              <Link to="/alternatives/expandi-alternatives">Expandi alternatives</Link>
              <Link to="/alternatives/linked-helper-alternatives">Linked Helper alternatives</Link>
              <Link to="/alternatives/phantombuster-alternatives">PhantomBuster alternatives</Link>
              <Link to="/templates">Message templates</Link>
              <Link to="/templates/linkedin-connection-request-messages">Connection request messages</Link>
              <Link to="/tools/linkedin-connection-request-generator">Request message generator</Link>
              <Link to="/blog/linkedin-outreach-guide">LinkedIn outreach guide</Link>
              <Link to="/glossary/ai-sdr">What is an AI SDR?</Link>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/security">Security</Link>
              <Link to="/developers">LinkedIn API</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/book-demo">Book a demo</Link>
              <Link to="/support">Support</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </div>
            <div className="foot-col">
              <h4>Get Spurly</h4>
              <Link to="/signup">Get started</Link>
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
