import { Link } from "react-router-dom";
import { useAuth } from "src/hooks/useAuth";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it's for" },
  { href: "#pricing", label: "Pricing" },
];

export default function MobileMenu({ open, onClose }) {
  const { user, loading } = useAuth();
  return (
    <div className={"mobile-menu" + (open ? " open" : "")} aria-hidden={open ? "false" : "true"}>
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} onClick={onClose}>{l.label}</a>
      ))}
      {!loading && (user ? (
        <Link to="/dashboard" className="nav-signin mobile-signin" onClick={onClose}>Dashboard</Link>
      ) : (
        <Link to="/login" className="nav-signin mobile-signin" onClick={onClose}>Sign in</Link>
      ))}
      {!loading && !user && (
        <Link to="/signup" className="btn btn-primary btn-lg" onClick={onClose}>
          Start free — 100 credits
        </Link>
      )}
    </div>
  );
}
