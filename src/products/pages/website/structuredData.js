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
    "Spurly is a LinkedIn automation tool that finds your ideal prospects, writes personal messages with AI and follows up automatically, stopping when they reply. Runs from the cloud at a safe daily pace, with one inbox for replies. Built for founders and sales teams. Includes an optional Chrome extension for capturing profiles. 7-day free trial.",
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
    description: "Three steps from a LinkedIn search to a conversation in your inbox.",
    step: [
      { "@type": "HowToStep", position: "1", name: "Connect LinkedIn securely", text: "Sign in to your LinkedIn account once through a secure connection." },
      { "@type": "HowToStep", position: "2", name: "Pick an audience, launch a sequence", text: "Search with filters, find people at target companies, import post authors or a CSV. AI drafts the connection note and follow-ups, and you approve them." },
      { "@type": "HowToStep", position: "3", name: "Reply from one inbox", text: "Spurly connects, waits for the accept and follows up at a safe pace from the cloud. When someone answers, the sequence stops and the conversation waits in your inbox." },
    ],
  },
];
