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
    "AI-powered LinkedIn outreach automation in the cloud: AI drafts your messages, then Spurly helps you find the right people, connect, follow up and reply from one inbox, at a safe daily pace. Includes a Chrome extension for capturing profiles. 7-day free trial.",
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
    description: "Four steps from a LinkedIn search to a conversation in your inbox.",
    step: [
      { "@type": "HowToStep", position: "1", name: "Connect LinkedIn securely", text: "Sign in to your LinkedIn account once through a secure connection." },
      { "@type": "HowToStep", position: "2", name: "Build an audience", text: "Search with filters, find people at target companies, import post authors, paste a URL or upload a CSV." },
      { "@type": "HowToStep", position: "3", name: "Launch a sequence", text: "Connect, wait until they accept, message and follow up, with AI-drafted copy you approve. Spurly sends each step at a safe pace from the cloud." },
      { "@type": "HowToStep", position: "4", name: "Reply from one inbox", text: "When someone answers, the sequence stops for them and the conversation waits in your inbox." },
    ],
  },
];
