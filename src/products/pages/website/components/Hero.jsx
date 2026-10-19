import { Link } from "react-router-dom";
import HeroVideo from "./home/HeroVideo.jsx";
import { usePrice } from "../hooks/usePrice.js";
import PriceTag from "./PriceTag.jsx";

/* Hero: five things and nothing else. A two-part pill, a short headline, one
   line of copy, one button, then the demo video frame. Plain HTML and CSS, so
   the prerendered page is the whole hero and the headline is the LCP element.
   Keywords: "AI SDR" is the category (headline + pill), "LinkedIn automation"
   and "outreach" sit in the pill, "AI agent" in the copy. */

export default function Hero() {
  const price = usePrice();

  return (
    <section className="hero">
      <div className="hero-panel">
        <div className="wrap hero-center">
          <span className="hero-pill"><b>AI SDR</b>LinkedIn automation &amp; outreach</span>
          <h1 className="display">
            <span className="ln">Your <em>AI SDR</em></span>{" "}
            <span className="ln">for LinkedIn.</span>
          </h1>
          <p className="lead">An AI agent that finds people already interested in you, writes personal messages and follows up until they reply.</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg" data-magnetic>
              Start 7-day free trial <span className="arr" aria-hidden="true">→</span>
            </Link>
            <Link to="/book-demo" className="btn btn-ghost btn-lg">Book a call</Link>
          </div>
          <p className="hero-micro">No card needed · then <PriceTag price={price} />/month · cancel anytime</p>
          {price.sale && (
            <p className="sale-pill"><b>{price.sale.label} live</b>{price.sale.percentOff}% off · {price.sale.saleLabel}/month instead of {price.sale.listLabel}</p>
          )}
        </div>

        <HeroVideo />
      </div>
    </section>
  );
}
