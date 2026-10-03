import { Link } from "react-router-dom";
import Footer from "./Footer.jsx";

/* Shell for static content pages (legal, support, blog). Reuses the site's
   glass nav + footer. Homepage section links use plain anchors so they
   navigate back to "/" and scroll. */

export default function ContentShell({ children }) {
  return (
    <>
      <header className="nav scrolled content-nav" role="banner">
        <nav className="nav-inner" aria-label="Primary">
          <Link className="brand" to="/" aria-label="Spurly home">
            <img src="/spurly-icon-128.png" alt="" width="34" height="34" />
            <span>Spurly</span>
          </Link>
          <div className="nav-links">
            <a href="/#product">Product</a>
            <a href="/#how">How it works</a>
            <a href="/#who">Who it's for</a>
            <Link to="/pricing">Pricing</Link>
            <Link to="/blog">Blog</Link>
          </div>
          <div className="nav-cta">
            <Link to="/signup" className="btn btn-primary btn-sm">Start 7-day free trial</Link>
          </div>
        </nav>
      </header>

      <main className="content-page">{children}</main>

      <Footer />
    </>
  );
}
