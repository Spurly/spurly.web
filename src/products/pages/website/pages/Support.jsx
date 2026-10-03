import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import { breadcrumbLd } from "../seo.js";
import ContentShell from "../components/ContentShell.jsx";

const FAQS = [
  {
    q: "What is Spurly?",
    a: "Spurly runs your LinkedIn outreach for you. You connect your LinkedIn account once, then find the right people, send connection requests and follow-ups at a safe daily pace, and reply from one inbox — from the cloud, so campaigns keep going with your laptop closed. A Chrome extension lets you capture profiles as you browse.",
  },
  {
    q: "How much does Spurly cost, and is there a free trial?",
    a: "Spurly has one plan: $24.99/month (₹2,499/month in India) with a 7-day free trial. Add a card (or UPI in India) to start your 7-day free trial. You won't be charged until day 8. Cancel anytime before then and you pay nothing.",
  },
  {
    q: "Does Spurly work with Sales Navigator?",
    a: "Yes. Spurly works with both standard LinkedIn and LinkedIn Sales Navigator. You can capture leads from any search results page on either platform.",
  },
  {
    q: "Is my LinkedIn data safe with Spurly?",
    a: "Spurly processes your leads, messages and connection data on our servers, and connects to LinkedIn securely through our partner. We don't sell your data. See our Privacy Policy for full details. Spurly is designed to stay within LinkedIn's limits, but no tool can guarantee LinkedIn won't restrict an account, and LinkedIn's User Agreement restricts automation.",
  },
  {
    q: "How does Spurly send personalized messages?",
    a: "You write a message template once using variables like {{name}} and {{company}}. Spurly fills in the details for each person and sends a unique message to everyone, with a live preview before anything goes out.",
  },
  {
    q: "How do I get help or report a problem?",
    a: "Email founders@getspurly.com and we'll get back to you. Include your account email and a short description of the issue or question.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Support() {
  return (
    <ContentShell>
      <Seo
        title="Support & FAQ — Spurly"
        description="Get help with Spurly. Answers to common questions about capturing leads, enrichment, pricing, privacy, and Sales Navigator — plus how to reach our team."
        path="/support"
        jsonLd={[faqLd, breadcrumbLd([["Home", "/"], ["Support", "/support"]])]}
      />

      <article className="prose wrap">
        <p className="eyebrow">Support</p>
        <h1 className="h1">How can we help?</h1>
        <p>
          Answers to the questions we hear most. Still stuck? Email{" "}
          <a href="mailto:founders@getspurly.com">founders@getspurly.com</a> and
          we'll help you out.
        </p>

        <h2>Frequently asked questions</h2>
        {FAQS.map((f) => (
          <div key={f.q} className="faq-item">
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}

        <h2>Still need help?</h2>
        <p>
          Reach our team at{" "}
          <a href="mailto:founders@getspurly.com">founders@getspurly.com</a>. You
          can also read our <Link to="/privacy">Privacy Policy</Link> and{" "}
          <Link to="/terms">Terms of Service</Link>, or explore the{" "}
          <Link to="/blog">Spurly blog</Link> for outreach guides.
        </p>
      </article>
    </ContentShell>
  );
}
