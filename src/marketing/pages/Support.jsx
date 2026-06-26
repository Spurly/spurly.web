import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ContentShell from "../components/ContentShell.jsx";

const FAQS = [
  {
    q: "What is Spurly?",
    a: "Spurly is a Chrome extension that turns LinkedIn and Sales Navigator into a prospecting pipeline. It captures leads, enriches profiles with emails and details, and sends personalized outreach — all in one click, without leaving your browser.",
  },
  {
    q: "Is Spurly free to use?",
    a: "Yes. Spurly has a free plan with 100 credits per month — enough to run your first outreach campaign. Paid plans start at $29/month for 2,000 credits with full enrichment and messaging features.",
  },
  {
    q: "Does Spurly work with Sales Navigator?",
    a: "Yes. Spurly works with both standard LinkedIn and LinkedIn Sales Navigator. You can capture leads from any search results page on either platform.",
  },
  {
    q: "Is my LinkedIn data safe with Spurly?",
    a: "Yes. Spurly is 100% local-only — all captured data stays on your device and never leaves your browser without your permission. See our Privacy Policy for full details.",
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
      <Helmet>
        <title>Support &amp; FAQ — Spurly</title>
        <meta
          name="description"
          content="Get help with Spurly. Answers to common questions about capturing leads, enrichment, pricing, privacy, and Sales Navigator — plus how to reach our team."
        />
        <link rel="canonical" href="https://www.getspurly.com/support" />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

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
