import { Link } from "react-router-dom";
import { useAuth } from "src/core/auth/hooks/useAuth";

const LINKS = [
  { href: "#tour", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it's for" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
];

export default function MobileMenu({ open, onClose }) {
  const { user, loading } = useAuth();
  return (
    <div className={"mobile-menu" + (open ? " open" : "")} aria-hidden={open ? "false" : "true"}>
      {LINKS.map((l) => (
        l.to ? <Link key={l.to} to={l.to} onClick={onClose}>{l.label}</Link> : <a key={l.href} href={l.href} onClick={onClose}>{l.label}</a>
      ))}
      <Link to="/book-demo" onClick={onClose}>Book a demo</Link>
      {!loading && (user ? (
        <Link to="/dashboard" className="nav-signin mobile-signin" onClick={onClose}>Dashboard</Link>
      ) : (
        <Link to="/login" className="nav-signin mobile-signin" onClick={onClose}>Sign in</Link>
      ))}
      {!loading && !user && (
        <Link to="/signup" className="btn btn-primary btn-lg" onClick={onClose}>
          Start 7-day free trial
        </Link>
      )}
    </div>
  );
}
