import { Link } from "react-router-dom";
import {
  TargetIcon,
  SendIcon,
  ChartIcon,
  ShieldIcon,
  GiftIcon,
  StarIcon,
} from "./icons.jsx";
import "../auth.css";

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
      <div className="sp-auth__main">
        <div className="sp-auth__topbar">
          <Brand />
          <span className="sp-auth__topbar-right">{topRight}</span>
        </div>
        <div
          className={"sp-auth__body" + (bodyTop ? " sp-auth__body--top" : "")}
        >
          {children}
        </div>
      </div>
      <aside className="sp-auth__aside">
        <span className="sp-auth__aside-glow" aria-hidden="true" />
        {aside}
      </aside>
    </div>
  );
}

export function Brand() {
  return (
    <Link to="/" className="sp-brand" aria-label="Spurly home">
      <img src="/Spurly Icon Square.png" alt="" />
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

/* Illustrative rows for the panel's product vignette — clearly an example
   (labelled so), fictional people, no fit numbers claimed. */
const EXAMPLE_ROWS = [
  ['AO', 'Amara Osei', 'VP RevOps'],
  ['JL', 'Jonas Lindqvist', 'CRO'],
  ['SM', 'Sofia Marchetti', 'Partnerships'],
];

/**
 * The blue half of the signed-out screens (Auth mockup): what Spurly is, in
 * one line, three facts about how it runs, and a small picture of the
 * working line doing its job. Every figure here is a property of the
 * product, not a customer metric we can't back.
 */
export function FeaturesAside() {
  return (
    <div className="sp-panel">
      <h1 className="sp-panel__lead">Spurly runs the top of your pipeline while you sleep.</h1>
      <p className="sp-panel__sub">
        It sources the audience, fills in what the search left out, and hands you a list you can act on — sending
        connection requests and messages inside a daily cap that keeps your account safe.
      </p>
      <div className="sp-panel__stats">
        <div>
          <div className="sp-panel__stat">10 / call</div>
          <div className="sp-panel__stat-l">LinkedIn paging</div>
        </div>
        <div>
          <div className="sp-panel__stat">1 cap</div>
          <div className="sp-panel__stat-l">Shared by every send</div>
        </div>
        <div>
          <div className="sp-panel__stat">0</div>
          <div className="sp-panel__stat-l">Passwords stored</div>
        </div>
      </div>
      <div className="sp-panel__card" aria-hidden="true">
        <div className="sp-panel__card-head">
          <span><i className="sp-panel__dot" />Paging…</span>
          <span>Example</span>
        </div>
        <div className="sp-panel__bar"><i /></div>
        {EXAMPLE_ROWS.map(([ini, name, role]) => (
          <div className="sp-panel__row" key={name}>
            <span className="sp-panel__av">{ini}</span>
            <span className="sp-panel__name">{name} · {role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WelcomeAside({
  step = 2,
  total = 3,
  credits = 100,
  allSet = false,
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="sp-panel">
      {allSet ? (
        <>
          <h1 className="sp-aside__hello">You’re all set.</h1>
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
          <h1 className="sp-aside__hello">Welcome to Spurly.</h1>
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
    </div>
  );
}

const STEP_LABELS = [
  "Create Account",
  "Tell us about you",
  "Install Extension",
];

/** Top progress stepper used on the onboarding pages. `current` is 1-based. */
/** Progress as segment bars that fill left to right, never numbered circles (spurlyDESIGN.md). */
export function Stepper({ current }) {
  return (
    <div className="sp-segs" role="list" aria-label="Onboarding progress">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "is-done" : n === current ? "is-active" : "";
        return (
          <div key={label} className={"sp-seg " + state} role="listitem" aria-current={n === current ? "step" : undefined}>
            <span className="sp-seg__label">{label}</span>
            <span className="sp-seg__track"><i /></span>
          </div>
        );
      })}
    </div>
  );
}
