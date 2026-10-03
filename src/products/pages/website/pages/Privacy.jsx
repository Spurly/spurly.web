import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import ContentShell from "../components/ContentShell.jsx";

/* Privacy policy. Plain-language and limited to what the product does today.
   Needs the owner's sign-off before it is treated as final (processor list,
   retention period and the legal entity name are still open, see /security). */
export default function Privacy() {
  return (
    <ContentShell>
      <Seo
        title="Privacy Policy | Spurly"
        description="How Spurly handles your data: what we collect, how your LinkedIn account is connected, where AI is used, who processes data for us, and how to delete it."
        path="/privacy"
      />

      <article className="prose wrap">
        <p className="eyebrow">Legal</p>
        <h1 className="h1">Privacy Policy</h1>
        <p className="prose-meta">Last updated: October 3, 2026</p>

        <p>
          This policy explains what Spurly collects, why, who helps us run the
          service, and what you can do about it. It describes what the product
          does today. For a shorter summary, see our{" "}
          <Link to="/security">security page</Link>.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address and a
            hashed version of your password.
          </li>
          <li>
            <strong>Your LinkedIn data, when you connect your account:</strong>{" "}
            your connections, conversations, invitations and profile viewers,
            plus the public profile details of people you find, import or
            capture (names, titles, companies, locations, profile photos and
            contact details you enrich).
          </li>
          <li>
            <strong>What you create in Spurly:</strong> audiences, campaigns,
            sequences, message templates, notes and AI drafts.
          </li>
          <li>
            <strong>Activity records:</strong> a log of the actions Spurly takes
            on your behalf, used to enforce limits and avoid repeating a send.
          </li>
          <li>
            <strong>Billing information:</strong> your plan and payment history.
            Card or UPI details are handled by our payment provider.
          </li>
          <li>
            <strong>Usage data:</strong> which pages and features are used, and
            your approximate region, to run and improve the product.
          </li>
        </ul>

        <h2>How we use it</h2>
        <p>
          We use your data to run Spurly for you: to connect to LinkedIn, find
          people, send the messages and actions in your campaigns, show your
          inbox, draft messages with AI, bill you and keep the service secure.
          We do not use it for advertising.
        </p>

        <h2>How your LinkedIn account is connected</h2>
        <p>
          You connect LinkedIn through a secure hosted login run by our
          connection partner, Unipile. Spurly acts on your account through that
          connection. You can disconnect it at any time.
        </p>

        <h2>AI features</h2>
        <p>
          Spurly uses AI models to draft connection notes, messages and comments.
          When you ask for a draft, the brief you wrote and the details needed
          to write it are sent to an AI model provider, and the draft comes
          back to you. You review and approve drafts before anything is sent or
          posted.
        </p>

        <h2>Who processes data for us</h2>
        <p>
          We rely on a small number of providers to run the service: hosting and
          database providers, our LinkedIn connection partner, an email
          provider, a payment provider, an analytics provider (Google
          Analytics) and AI model providers. They process data on our behalf to
          provide their service. We do not sell or rent your data.
        </p>

        <h2>The Chrome extension</h2>
        <p>
          The optional Spurly Chrome extension captures the public LinkedIn
          profile details of people you choose to capture and sends them to your
          Spurly account. It does not run in the background on other sites.
        </p>

        <h2>Keeping and deleting data</h2>
        <p>
          We keep your data while your account is open. You can remove leads,
          campaigns and templates inside Spurly. To delete your account and the
          data tied to it, email{" "}
          <a href="mailto:founders@getspurly.com">founders@getspurly.com</a>.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access,
          correct, export or delete your personal data, or to object to how it
          is used. Email us and we will help.
        </p>

        <h2>Security</h2>
        <p>
          Data between your browser and Spurly is encrypted in transit over
          HTTPS, and passwords are stored hashed. No system is perfectly secure.
          If you find a problem, tell us at{" "}
          <a href="mailto:founders@getspurly.com">founders@getspurly.com</a>.
        </p>

        <h2>Who Spurly is for</h2>
        <p>Spurly is for adults using LinkedIn for work. It is not directed at children.</p>

        <h2>Changes to this policy</h2>
        <p>
          If we make material changes, we will update this page and the "Last
          updated" date above.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about privacy? Email{" "}
          <a href="mailto:founders@getspurly.com">founders@getspurly.com</a>. See
          also our <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/support">Support</Link> pages.
        </p>
      </article>
    </ContentShell>
  );
}
