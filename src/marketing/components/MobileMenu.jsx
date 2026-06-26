import { Link } from "react-router-dom";
import { ChromeLink } from "./Button.jsx";
import { useAuthModal } from "../auth/AuthModalContext.jsx";
import { useAuth } from "src/hooks/useAuth";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it's for" },
  { href: "#pricing", label: "Pricing" },
];

export default function MobileMenu({ open, onClose }) {
  const { openAuth } = useAuthModal();
  const { user, loading } = useAuth();
  return (
    <div className={"mobile-menu" + (open ? " open" : "")} aria-hidden={open ? "false" : "true"}>
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} onClick={onClose}>{l.label}</a>
      ))}
      {!loading && (user ? (
        <Link to="/dashboard" className="nav-signin mobile-signin" onClick={onClose}>Dashboard</Link>
      ) : (
        <button
          type="button"
          className="nav-signin mobile-signin"
          onClick={() => { onClose(); openAuth("signin"); }}
        >
          Sign in
        </button>
      ))}
      {!loading && !user && (
        <ChromeLink variant="primary" size="lg" onClick={onClose}>
          Start free — 100 credits
        </ChromeLink>
      )}
    </div>
  );
}
