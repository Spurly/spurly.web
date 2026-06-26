/* Homepage JSON-LD (SoftwareApplication + FAQ + HowTo). Rendered via Helmet
   in App so it only appears on "/", not on every SPA route. */

export const HOME_LD = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Spurly",
    url: "https://www.getspurly.com/",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Chrome",
    description:
      "LinkedIn & Sales Navigator prospecting tool that captures leads, enriches profiles, and personalizes outreach at scale.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
          text: "Spurly is a Chrome extension that turns LinkedIn and Sales Navigator into a prospecting pipeline. It captures leads, enriches profiles with emails and details, and sends personalized outreach — all in one click, without leaving your browser.",
        },
      },
      {
        "@type": "Question",
        name: "Is Spurly free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Spurly has a free plan with 100 credits per month — enough to run your first outreach campaign. Paid plans start at $29/month for 2,000 credits with full enrichment and messaging features.",
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
          text: "Yes. Spurly is 100% local-only — all captured data stays on your device and never leaves your browser without your permission.",
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
        text: "Open any LinkedIn or Sales Navigator search page and click Spurly to capture every profile into a Session — names, titles, companies, and locations — in one click.",
      },
      {
        "@type": "HowToStep",
        position: "2",
        name: "Enrich and connect",
        text: "Spurly visits each profile to enrich emails and contact details, then fires personalized connection requests with human-like pacing to keep your account safe.",
      },
      {
        "@type": "HowToStep",
        position: "3",
        name: "Reach out",
        text: "Write a message template once using {{name}} and {{company}} variables. Spurly generates a unique message for each person and sends with a live preview before anything goes out.",
      },
    ],
  },
];
