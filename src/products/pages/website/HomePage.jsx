import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Seo from "./components/Seo.jsx";
import { ORGANIZATION_LD, WEBSITE_LD } from "./seo.js";
import Nav from "./components/Nav.jsx";
import MobileMenu from "./components/MobileMenu.jsx";
import Hero from "./components/Hero.jsx";
import UrgencyBar from "./components/UrgencyBar.jsx";
import ResultsBar from "./components/home/ResultsBar.jsx";
import ProofStrip from "./components/home/ProofStrip.jsx";
import Signals from "./components/home/Signals.jsx";
import FeatureTour from "./components/home/FeatureTour.jsx";
import BookCall from "./components/home/BookCall.jsx";
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
        title="Spurly: AI SDR & LinkedIn Automation Tool"
        description="Spurly is an AI SDR for LinkedIn. It finds high-intent leads that match your ICP, writes personalized outreach with AI and follows up. 7-day free trial."
        path="/"
        jsonLd={[ORGANIZATION_LD, WEBSITE_LD, ...HOME_LD, videoLd()].filter(Boolean)}
      />
      <Helmet>
        <link rel="preload" href="/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Helmet>
      <UrgencyBar />
      <Nav focused menuOpen={menuOpen} onToggleMenu={() => setMenu(!menuOpen)} />
      <MobileMenu focused open={menuOpen} onClose={() => setMenu(false)} />

      <main id="top">
        <Hero />
        <ResultsBar />
        <ProofStrip />
        <FeatureTour />
        <Signals />
        <Pricing />
        <BookCall />
        <HomeFaq />
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}
