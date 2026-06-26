import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ContentShell from "../components/ContentShell.jsx";

export default function Privacy() {
  return (
    <ContentShell>
      <Helmet>
        <title>Privacy Policy — Spurly</title>
        <meta
          name="description"
          content="How Spurly handles your data. We don't collect, sell, or share personal data beyond what's needed to run the extension. Data stays local and syncs securely for session management only."
        />
        <link rel="canonical" href="https://www.getspurly.com/privacy" />
      </Helmet>

      <article className="prose wrap">
        <p className="eyebrow">Legal</p>
        <h1 className="h1">Privacy Policy</h1>
        <p className="prose-meta">Last updated: June 21, 2026</p>

        <p>
          Spurly is built privacy-first. We do not collect, sell, or share any
          personal data beyond what is necessary for core functionality. This
          policy explains exactly what that means.
        </p>

        <h2>What we collect</h2>
        <p>
          Spurly only processes the data you actively capture while using the
          extension — the public profile information (names, titles, companies,
          locations) you choose to add to a Session, plus your account details
          for sign-in and billing. We do not run trackers that follow you around
          the web.
        </p>

        <h2>How your data is stored</h2>
        <p>
          All captured data is stored locally on your device and synced securely
          to our backend (<code>api.getspurly.com</code>) for session management
          and profile organization only. Your data never leaves your device for
          any purpose other than letting you use the product across sessions.
        </p>

        <h2>What we never do</h2>
        <ul>
          <li>We do not sell or rent your data to anyone.</li>
          <li>We do not use your data for advertising.</li>
          <li>
            We do not run analytics unrelated to the extension's purpose, or use
            your data for any other secondary purposes.
          </li>
        </ul>

        <h2>Third parties</h2>
        <p>
          We rely on a small number of infrastructure providers (such as our
          hosting and database providers) strictly to operate the service. They
          process data only on our behalf and under contract — never for their
          own purposes.
        </p>

        <h2>Your control</h2>
        <p>
          You can delete your Sessions and captured data at any time from within
          the extension. To request deletion of your account and all associated
          data, contact us at{" "}
          <a href="mailto:founders@getspurly.com">founders@getspurly.com</a>.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If we make material changes to how we handle data, we will update this
          page and revise the "Last updated" date above.
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
