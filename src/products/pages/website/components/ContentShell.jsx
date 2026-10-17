import { useState } from "react";
import Nav from "./Nav.jsx";
import MobileMenu from "./MobileMenu.jsx";
import Footer from "./Footer.jsx";

/* Shell for static content pages (legal, support, blog, pricing, product).
   Same floating top bar as the home page; its section links point at the
   home page (`home={false}`). */

export default function ContentShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function setMenu(open) {
    setMenuOpen(open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  return (
    <>
      <Nav home={false} menuOpen={menuOpen} onToggleMenu={() => setMenu(!menuOpen)} />
      <MobileMenu home={false} open={menuOpen} onClose={() => setMenu(false)} />

      <main className="content-page">{children}</main>

      <Footer />
    </>
  );
}
