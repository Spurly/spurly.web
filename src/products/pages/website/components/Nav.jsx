import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MenuIcon } from "../icons.jsx";
import { useAuth } from "src/core/auth/hooks/useAuth";

const LINKS = [
  { href: "#tour", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it's for" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
];

export default function Nav({ menuOpen, onToggleMenu }) {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"nav" + (scrolled ? " scrolled" : "")} role="banner">
      <nav className="nav-inner" aria-label="Primary">
        <a className="brand" href="#top" aria-label="Spurly home">
          <img src="/spurly-icon-128.png" alt="" width="34" height="34" />
          <span>Spurly</span>
        </a>
        <div className="nav-links">
          {LINKS.map((l) => (
            l.to ? <Link key={l.to} to={l.to}>{l.label}</Link> : <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>
        <div className="nav-cta">
          <Link to="/book-demo" className="btn btn-ghost btn-sm nav-demo">Book a demo</Link>
          {!loading && (user ? (
            <Link to="/dashboard" className="nav-signin">Dashboard</Link>
          ) : (
            <Link to="/login" className="nav-signin">Sign in</Link>
          ))}
          {!loading && !user && (
            <Link to="/signup" className="btn btn-primary btn-sm" data-magnetic>Start 7-day free trial</Link>
          )}
          <button className="nav-toggle" aria-label="Open menu" aria-expanded={menuOpen ? "true" : "false"} onClick={onToggleMenu}>
            <MenuIcon />
          </button>
        </div>
      </nav>
    </header>
  );
}
