import { PRICES, TRIAL_DAYS } from "./pricing.js";
import { HOME_FAQ } from "./components/home/homeFaq.js";

/* Homepage JSON-LD (SoftwareApplication + FAQ + HowTo). Rendered by <Seo> on
   HomePage only, and baked into the prerendered "/" at build time. */

/** One monthly Offer. The trial is described on the SoftwareApplication itself. */
function offer({ amount, currency }) {
  return {
    "@type": "Offer",
    price: amount,
    priceCurrency: currency,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: amount,
      priceCurrency: currency,
      billingDuration: "P1M",
      unitCode: "MON",
    },
    description: `${TRIAL_DAYS}-day free trial, then billed monthly.`,
  };
}

/** Product entity with the two real Offers. Used on / and /pricing. */
export const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Spurly",
  url: "https://www.getspurly.com/",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Chrome",
  description:
    "Spurly is an AI SDR for LinkedIn: it finds high-intent leads that match your ICP, writes personalized messages with AI and follows up until they reply, while you approve every message. Runs 24/7 from the cloud at a safe pace, with one inbox for replies and Claude (MCP) support. Built for founders and B2B sales teams. Includes an optional Chrome extension for capturing profiles. 7-day free trial.",
  offers: [
    offer(PRICES.INTL),
    { ...offer(PRICES.IN), eligibleRegion: "IN" },
  ],
};

export const HOME_LD = [
  SOFTWARE_LD,
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to run LinkedIn outreach with Spurly",
    description: "Three steps from defining your ICP to a conversation in your inbox.",
    step: [
      { "@type": "HowToStep", position: "1", name: "Define your ICP", text: "Connect LinkedIn once, with nothing to install. Describe who you sell to with filters such as title, company and location, or start from target companies, post authors, profile viewers or a CSV." },
      { "@type": "HowToStep", position: "2", name: "AI writes and runs the outreach", text: "AI drafts a personalized connection note and follow-ups in your voice. You approve them once, then Spurly visits profiles, connects, messages, likes and follows up on schedule at a safe pace." },
      { "@type": "HowToStep", position: "3", name: "You take the warm conversations", text: "When someone replies, their sequence stops and the chat lands in one inbox. Answer there, or ask Claude to sort replies and draft answers for you to approve." },
    ],
  },
];
