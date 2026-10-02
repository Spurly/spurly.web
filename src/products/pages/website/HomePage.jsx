import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Seo from "./components/Seo.jsx";
import { ORGANIZATION_LD, WEBSITE_LD } from "./seo.js";
import Nav from "./components/Nav.jsx";
import MobileMenu from "./components/MobileMenu.jsx";
import Hero from "./components/Hero.jsx";
import LogoCloud from "./components/LogoCloud.jsx";
import ProductShowcase from "./components/ProductShowcase.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import Audiences from "./components/Audiences.jsx";
import Webcam from "./components/Webcam.jsx";
import LiveDemo from "./components/LiveDemo.jsx";
import Pricing from "./components/Pricing.jsx";
import FinalCTA from "./components/FinalCTA.jsx";
import Footer from "./components/Footer.jsx";
import useScrollReveal from "./hooks/useScrollReveal.js";
import useMagnetic from "./hooks/useMagnetic.js";
import { HOME_LD } from "./structuredData.js";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useScrollReveal();
  useMagnetic();

  function setMenu(open) {
    setMenuOpen(open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  return (
    <>
      <Seo
        title="Spurly — LinkedIn Lead Capture & Outreach Chrome Extension"
        description="Spurly captures leads from LinkedIn & Sales Navigator, enriches profiles and sends personalized outreach at scale. Built for recruiters, founders and job-seekers. Start free."
        path="/"
        jsonLd={[ORGANIZATION_LD, WEBSITE_LD, ...HOME_LD]}
      />
      <Helmet>
        <link rel="preload" href="/fonts/fraunces-opsz.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Helmet>
      <Nav menuOpen={menuOpen} onToggleMenu={() => setMenu(!menuOpen)} />
      <MobileMenu open={menuOpen} onClose={() => setMenu(false)} />

      <main id="top">
        <Hero />
        <LogoCloud />
        <ProductShowcase />
        <HowItWorks />
        <Audiences />
        <Webcam />
        <LiveDemo />
        <Pricing />
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}
