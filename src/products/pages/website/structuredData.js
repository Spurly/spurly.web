import { PRICES, TRIAL_DAYS } from "./pricing.js";

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

export const HOME_LD = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Spurly",
    url: "https://www.getspurly.com/",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Chrome",
    description:
      "Cloud LinkedIn outreach automation: find the right people, connect, follow up and reply from one inbox, at a safe daily pace. Includes a Chrome extension for capturing profiles. 7-day free trial.",
    offers: [
      offer(PRICES.INTL),
      { ...offer(PRICES.IN), eligibleRegion: "IN" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Spurly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Spurly runs your LinkedIn outreach for you. You connect your LinkedIn account once, then find the right people, send connection requests and follow-ups at a safe daily pace, and reply from one inbox — from the cloud, so campaigns keep going with your laptop closed. A Chrome extension lets you capture profiles as you browse.",
        },
      },
      {
        "@type": "Question",
        name: "How much does Spurly cost, and is there a free trial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Spurly has one plan: $24.99/month (₹2,499/month in India) with a 7-day free trial. Add a card (or UPI in India) to start your 7-day free trial. You won't be charged until day 8. Cancel anytime before then and you pay nothing.",
        },
      },
      {
        "@type": "Question",
        name: "Who is Spurly for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Spurly is built for recruiters, founders, SDRs, job-seekers, agencies, account executives, and growth marketers — anyone who does outbound prospecting on LinkedIn.",
        },
      },
      {
        "@type": "Question",
        name: "Is my LinkedIn data safe with Spurly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Spurly processes your leads, messages and connection data on our servers, and connects to LinkedIn securely through our partner. We don't sell your data. See the Privacy Policy for details. Spurly is designed to stay within LinkedIn's limits, but no tool can guarantee LinkedIn won't restrict an account, and LinkedIn's User Agreement restricts automation.",
        },
      },
      {
        "@type": "Question",
        name: "Does Spurly work with Sales Navigator?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Spurly works with both standard LinkedIn and LinkedIn Sales Navigator. You can capture leads from any search results page on either platform.",
        },
      },
      {
        "@type": "Question",
        name: "How does Spurly send personalized messages?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You write a message template once using variables like {{name}} and {{company}}. Spurly fills in the details for each person and sends a unique message to everyone, with a live preview before anything goes out.",
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to prospect on LinkedIn with Spurly",
    description:
      "Three steps to go from a LinkedIn search to sent outreach messages using Spurly.",
    step: [
      {
        "@type": "HowToStep",
        position: "1",
        name: "Capture",
        text: "Open any LinkedIn or Sales Navigator search page and click Spurly to capture every profile with the Chrome extension — names, titles, companies, and locations — in one click. You can also find people from inside Spurly.",
      },
      {
        "@type": "HowToStep",
        position: "2",
        name: "Enrich and connect",
        text: "Spurly enriches emails and contact details, then sends personalized connection requests at a daily pace designed to stay within LinkedIn's limits.",
      },
      {
        "@type": "HowToStep",
        position: "3",
        name: "Reach out",
        text: "Write a message template once using {{name}} and {{company}} variables. Spurly fills in a unique message for each person and sends with a live preview before anything goes out.",
      },
    ],
  },
];
