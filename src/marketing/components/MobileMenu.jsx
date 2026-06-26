import { ChromeLink } from "./Button.jsx";
import { useAuthModal } from "../auth/AuthModalContext.jsx";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it's for" },
  { href: "#pricing", label: "Pricing" },
];

export default function MobileMenu({ open, onClose }) {
  const { openAuth } = useAuthModal();
  return (
    <div className={"mobile-menu" + (open ? " open" : "")} aria-hidden={open ? "false" : "true"}>
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} onClick={onClose}>{l.label}</a>
      ))}
      <button
        type="button"
        className="nav-signin mobile-signin"
        onClick={() => { onClose(); openAuth("signin"); }}
      >
        Sign in
      </button>
      <ChromeLink variant="primary" size="lg" onClick={onClose}>
        Start free — 100 credits
      </ChromeLink>
    </div>
  );
}
