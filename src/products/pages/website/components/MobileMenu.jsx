import { Link } from "react-router-dom";
import { NAV_LINKS } from "./navLinks.js";

export default function MobileMenu({ open, onClose, home = true }) {
  return (
    <div className={"mobile-menu" + (open ? " open" : "")} aria-hidden={open ? "false" : "true"}>
      {NAV_LINKS.map((l) => (
        <a key={l.href} href={home ? l.href : "/" + l.href} onClick={onClose}>{l.label}</a>
      ))}
      <Link to="/book-demo" className="btn btn-primary btn-lg" onClick={onClose}>Book a demo</Link>
      <Link to="/login" className="btn btn-ghost btn-lg" onClick={onClose}>Log in</Link>
    </div>
  );
}
