import { Link } from "react-router-dom";
import {
  TargetIcon,
  SendIcon,
  ChartIcon,
  ShieldIcon,
  GiftIcon,
  StarIcon,
} from "./icons.jsx";
import "./auth.css";

/**
 * Two-column shell shared by every auth / onboarding page.
 * Left = brand panel (`aside`), right = page content (`children`), with an
 * optional top-right slot (e.g. "Already have an account? Log in") and an
 * optional `bodyTop` flag to top-align the right column (used by the wider
 * survey / install pages).
 */
export function AuthShell({ aside, topRight, children, bodyTop = false }) {
  return (
    <div className="sp-auth">
      <aside className="sp-auth__aside">
        <span className="sp-auth__aside-dots" aria-hidden="true" />
        {aside}
      </aside>
      <div className="sp-auth__main">
        <div className="sp-auth__topbar">{topRight}</div>
        <div
          className={"sp-auth__body" + (bodyTop ? " sp-auth__body--top" : "")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function Brand() {
  return (
    <Link to="/" className="sp-brand" aria-label="Spurly home">
      <img src="/spurly-mark.png" alt="" />
      <span>Spurly</span>
    </Link>
  );
}

const FEATURES = [
  {
    Icon: TargetIcon,
    t: "Capture Leads Instantly",
    d: "Extract leads from LinkedIn profiles, Sales Navigator and more in one click.",
  },
  {
    Icon: SendIcon,
    t: "Automate Outreach",
    d: "Send personalized connection requests and follow-ups that get replies.",
  },
  {
    Icon: ChartIcon,
    t: "Track & Optimize",
    d: "Monitor performance and optimize your campaigns for better results.",
  },
  {
    Icon: ShieldIcon,
    t: "Safe & Secure",
    d: "Your data is encrypted and we never publish anything without your permission.",
  },
];

const TESTIMONIAL = {
  text: "“Spurly can completely transformed your LinkedIn outreach. Spurly can help you book 3x more meetings in a month!”",
  name: "Richard Samuel",
  role: "Founder, Spurly",
};

function Testimonial() {
  return (
    <div className="sp-quote">
      <div className="sp-quote__stars" aria-label="5 out of 5 stars">
        ★★★★★
      </div>
      <p className="sp-quote__text">{TESTIMONIAL.text}</p>
      <div className="sp-quote__who">
        {/* <span className="sp-quote__avatar" aria-hidden="true" /> */}
        <div>
          <div className="sp-quote__name">{TESTIMONIAL.name}</div>
          <div className="sp-quote__role">{TESTIMONIAL.role}</div>
        </div>
      </div>
    </div>
  );
}

/** Left panel for the Create Account / Login pages. */
export function FeaturesAside() {
  return (
    <>
      <Brand />
      <h1 className="sp-aside__lead">
        Create your
        <br />
        <span className="acc">Spurly</span> account
      </h1>
      <p className="sp-aside__sub">
        Start capturing leads, automating outreach and growing your pipeline on
        LinkedIn.
      </p>
      <div className="sp-feats">
        {FEATURES.map(({ Icon, t, d }) => (
          <div className="sp-feat" key={t}>
            <span className="sp-feat__ic">
              <Icon s={20} />
            </span>
            <div>
              <div className="sp-feat__t">{t}</div>
              <div className="sp-feat__d">{d}</div>
            </div>
          </div>
        ))}
      </div>
      <Testimonial />
    </>
  );
}

/**
 * Left panel for the onboarding steps (survey / install). Shows a welcome
 * message, a rewards/progress card, condensed feature list and testimonial.
 */
export function WelcomeAside({
  step = 2,
  total = 3,
  credits = 100,
  allSet = false,
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <>
      <Brand />
      {allSet ? (
        <>
          <h1 className="sp-aside__hello">🎉 You’re all set!</h1>
          <p className="sp-aside__hello-sub">
            Your account is ready and you’ve unlocked <b>{credits} credits</b>{" "}
            to get started.
          </p>
          <div className="sp-reward">
            <div className="sp-reward__row">
              <span className="sp-reward__icon">
                <GiftIcon s={22} />
              </span>
              <div>
                <div className="sp-reward__title">Your Welcome Bonus</div>
                <div className="sp-reward__desc">
                  <b style={{ color: "var(--sp-primary)", fontSize: 18 }}>
                    {credits}
                  </b>{" "}
                  credits added to your account
                </div>
              </div>
            </div>
            <div className="sp-checklist">
              <div className="sp-check">
                <span className="sp-check__ic">
                  <StarIcon s={16} />
                </span>
                Account created
              </div>
              <div className="sp-check">
                <span className="sp-check__ic">
                  <StarIcon s={16} />
                </span>
                Profile set up
              </div>
              <div className="sp-check">
                <span className="sp-check__ic">
                  <StarIcon s={16} />
                </span>
                Ready to install
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h1 className="sp-aside__hello">👋 Welcome to Spurly!</h1>
          <p className="sp-aside__hello-sub">
            Let’s personalize your experience so you can get the most out of
            Spurly.
          </p>
          <div className="sp-reward">
            <div className="sp-reward__row">
              <span className="sp-reward__icon">
                <GiftIcon s={22} />
              </span>
              <div>
                <div className="sp-reward__title">
                  You’ve unlocked{" "}
                  <span className="acc">{credits} credits!</span>
                </div>
                <div className="sp-reward__desc">
                  Complete onboarding to unlock more rewards.
                </div>
              </div>
            </div>
            <div className="sp-reward__bar">
              <span className="sp-reward__track">
                <span
                  className="sp-reward__fill"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="sp-reward__step">
                Step {step} of {total}
              </span>
            </div>
          </div>
        </>
      )}
      <div className="sp-feats" style={{ marginTop: 34 }}>
        <div className="sp-feats__h">Why users love Spurly</div>
        {FEATURES.slice(0, 3).map(({ Icon, t, d }) => (
          <div className="sp-feat" key={t}>
            <span className="sp-feat__ic">
              <Icon s={20} />
            </span>
            <div>
              <div className="sp-feat__t">{t}</div>
              <div className="sp-feat__d">{d}</div>
            </div>
          </div>
        ))}
      </div>
      <Testimonial />
    </>
  );
}

const STEP_LABELS = [
  "Create Account",
  "Tell us about you",
  "Install Extension",
];

/** Top progress stepper used on the onboarding pages. `current` is 1-based. */
export function Stepper({ current }) {
  return (
    <div className="sp-steps" role="list" aria-label="Onboarding progress">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const state =
          n < current ? "is-done" : n === current ? "is-active" : "";
        return (
          <div key={label} style={{ display: "contents" }}>
            <div className={"sp-step " + state} role="listitem">
              <span className="sp-step__dot">{n < current ? "✓" : n}</span>
              <span className="sp-step__label">{label}</span>
            </div>
            {n < STEP_LABELS.length && (
              <span
                className={"sp-step__bar" + (n < current ? " is-done" : "")}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
