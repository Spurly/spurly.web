import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MenuIcon } from "../icons.jsx";
import { NAV_LINKS } from "./navLinks.js";

/* Floating pill: logo, four section links, a quiet Log in link, one button.
   On scroll the pill tightens. `home={false}` (content pages) points the
   section links at the home page. `focused` (the landing page) keeps the section
   links and swaps the button for Book a call, which scrolls to the booking section. */
export default function Nav({ menuOpen, onToggleMenu, home = true, focused = false }) {
  const href = (h) => (home ? h : "/" + h);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"topbar" + (scrolled ? " scrolled" : "")} role="banner">
      <nav className="topbar-pill" aria-label="Primary">
        <a className="topbar-brand" href={home ? "#top" : "/"} aria-label="Spurly home">
          <img src="/spurly-icon-128.png" alt="" width="34" height="34" />
          <span>Spurly</span>
        </a>
        <div className="topbar-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={href(l.href)}>{l.label}</a>
          ))}
        </div>
        <Link to="/login" className="topbar-login">Log in</Link>
        {focused
          ? <a href="#book" className="topbar-btn">Book a call</a>
          : <Link to="/book-demo" className="topbar-btn">Book a demo</Link>}
        <button className="topbar-toggle" aria-label="Open menu" aria-expanded={menuOpen ? "true" : "false"} onClick={onToggleMenu}>
          <MenuIcon />
        </button>
      </nav>
    </header>
  );
}
