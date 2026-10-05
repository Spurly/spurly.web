import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Seo from "./components/Seo.jsx";
import { ORGANIZATION_LD, WEBSITE_LD } from "./seo.js";
import Nav from "./components/Nav.jsx";
import MobileMenu from "./components/MobileMenu.jsx";
import Hero from "./components/Hero.jsx";
import LogoCloud from "./components/LogoCloud.jsx";
import HowItWorks from "./components/home/HowItWorks.jsx";
import FeatureTour from "./components/home/FeatureTour.jsx";
import Solutions from "./components/home/Solutions.jsx";
import HomeFaq from "./components/home/HomeFaq.jsx";
import Pricing from "./components/Pricing.jsx";
import FinalCTA from "./components/FinalCTA.jsx";
import Footer from "./components/Footer.jsx";
import useScrollReveal from "./hooks/useScrollReveal.js";
import useMagnetic from "./hooks/useMagnetic.js";
import { HOME_LD } from "./structuredData.js";
import { videoLd } from "./components/home/video.js";

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
        title="Spurly: LinkedIn Automation Tool for Lead Generation"
        description="Spurly finds your ideal prospects on LinkedIn, writes personal messages with AI and follows up automatically. For founders and sales teams. 7-day free trial."
        path="/"
        jsonLd={[ORGANIZATION_LD, WEBSITE_LD, ...HOME_LD, videoLd()].filter(Boolean)}
      />
      <Helmet>
        <link rel="preload" href="/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Helmet>
      <Nav menuOpen={menuOpen} onToggleMenu={() => setMenu(!menuOpen)} />
      <MobileMenu open={menuOpen} onClose={() => setMenu(false)} />

      <main id="top">
        <Hero />
        <LogoCloud />
        <HowItWorks />
        <FeatureTour />
        <Solutions />
        <Pricing />
        <HomeFaq />
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}
