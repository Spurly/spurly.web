import { useState } from "react";
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
import TweaksPanel from "./components/TweaksPanel.jsx";
import SoundOnboarding from "./components/SoundOnboarding.jsx";
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
      <TweaksPanel />
      <SoundOnboarding />
    </>
  );
}
