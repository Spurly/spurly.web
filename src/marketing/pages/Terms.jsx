import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ContentShell from "../components/ContentShell.jsx";

export default function Terms() {
  return (
    <ContentShell>
      <Helmet>
        <title>Terms of Service — Spurly</title>
        <meta
          name="description"
          content="The terms governing your use of Spurly, the LinkedIn & Sales Navigator prospecting Chrome extension. Acceptable use, accounts, credits, and liability."
        />
        <link rel="canonical" href="https://www.getspurly.com/terms" />
      </Helmet>

      <article className="prose wrap">
        <p className="eyebrow">Legal</p>
        <h1 className="h1">Terms of Service</h1>
        <p className="prose-meta">Last updated: June 21, 2026</p>

        <p>
          These Terms of Service ("Terms") govern your access to and use of
          Spurly, a Chrome extension and related services for prospecting on
          LinkedIn and Sales Navigator. By installing or using Spurly, you agree
          to these Terms.
        </p>

        <h2>1. The service</h2>
        <p>
          Spurly helps you capture leads, enrich profiles, and send personalized
          outreach from within your browser. We may update, improve, or change
          features over time.
        </p>

        <h2>2. Your account</h2>
        <p>
          You are responsible for keeping your account credentials secure and
          for all activity that happens under your account. You must provide
          accurate information when you sign up.
        </p>

        <h2>3. Acceptable use</h2>
        <p>Spurly is a tool; how you use it is your responsibility. You agree to:</p>
        <ul>
          <li>
            Comply with all applicable laws and the terms of any third-party
            platform you use Spurly with, including LinkedIn's User Agreement.
          </li>
          <li>
            Send outreach that is honest, relevant, and respectful — no spam,
            harassment, or deceptive messaging.
          </li>
          <li>
            Not attempt to disrupt, reverse-engineer, or abuse the service or its
            infrastructure.
          </li>
        </ul>
        <p>
          You are solely responsible for your outreach activity and for ensuring
          your use complies with the platforms you operate on.
        </p>

        <h2>4. Credits and billing</h2>
        <p>
          Spurly offers a free plan and paid plans. Credits are consumed only
          when Spurly performs work for you. Paid plans renew on a recurring
          basis until cancelled. See current pricing on our{" "}
          <a href="/#pricing">pricing section</a>.
        </p>

        <h2>5. Disclaimers</h2>
        <p>
          Spurly is provided "as is" without warranties of any kind. We do not
          guarantee specific results from your outreach, nor uninterrupted or
          error-free operation.
        </p>

        <h2>6. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Spurly and its team will not be
          liable for any indirect, incidental, or consequential damages arising
          from your use of the service.
        </p>

        <h2>7. Termination</h2>
        <p>
          You may stop using Spurly at any time. We may suspend or terminate
          access if these Terms are violated.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use after
          changes means you accept the updated Terms.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions? Email{" "}
          <a href="mailto:founders@getspurly.com">founders@getspurly.com</a>. See
          also our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </article>
    </ContentShell>
  );
}
