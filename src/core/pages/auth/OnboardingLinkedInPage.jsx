import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "src/core/auth/hooks/useAuth";
import { useToast } from "src/core/primitives";
import { getToastError } from "src/shared/utils/apiError";
import EventEmitter from "src/shared/utils/EventEmitter.js";
import accountController from "src/products/settings/controller/account.js";
import { ACCOUNT_EVENTS } from "src/products/settings/constants/constants.js";
import { AuthShell, WelcomeAside, Stepper } from "./components/AuthShell.jsx";
import {
  LinkedInIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldIcon,
  TargetIcon,
  SendIcon,
} from "./components/icons.jsx";

/**
 * Where hosted auth brings the user back to. Allow-listed server-side
 * (D2) -- this is one of exactly two values the backend will accept, never
 * an arbitrary client-built URL.
 */
const RETURN_TO = "/onboarding/linkedin";

const WHY = [
  {
    Icon: ShieldIcon,
    t: "Your password stays on LinkedIn",
    d: "Spurly never sees it -- you sign in on LinkedIn's own page.",
  },
  {
    Icon: TargetIcon,
    t: "Builds your first audience",
    d: "The next step searches LinkedIn through this connection.",
  },
  {
    Icon: SendIcon,
    t: "Sends within a daily cap",
    d: "Connection requests and messages, paced to keep your account safe.",
  },
];

/**
 * Step 3 of 5 -- connect the LinkedIn account Spurly will search and send
 * from. Protected route (auth + active subscription, like every onboarding
 * page).
 *
 * This page's own load only reads status with a plain GET (`accountController
 * .get`) -- the refresh()-based, retrying re-check for the moment the user
 * comes BACK from hosted auth (?linked=1/0) is D4, not here.
 */
export default function OnboardingLinkedInPage() {
  const navigate = useNavigate();
  const { setOnboardingStage } = useAuth();
  const toast = useToast();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const emitter = new EventEmitter();
    emitter.once(ACCOUNT_EVENTS.GET_SUCCESS, (next) => {
      setAccount(next);
      setLoading(false);
    });
    emitter.once(ACCOUNT_EVENTS.GET_FAILURE, (err) => {
      toast.error(getToastError(err, "Could not check your LinkedIn connection"));
      setLoading(false);
    });
    accountController.get(emitter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connected = Boolean(account?.connected);

  function handleConnect() {
    if (connecting) return;

    // Opened NOW, synchronously, so the browser doesn't treat it as a
    // popup once the link actually arrives (same reasoning as the settings
    // page's handleConnect -- see useLinkedInSettings.js).
    const tab = window.open("", "_blank");
    setConnecting(true);

    const emitter = new EventEmitter();
    emitter.once(ACCOUNT_EVENTS.CREATE_LINK_SUCCESS, (data) => {
      setConnecting(false);
      const url = data?.url;
      if (!url) {
        tab?.close();
        toast.error("No connection link was returned");
        return;
      }
      if (tab) tab.location = url;
      else window.location.assign(url);
    });
    emitter.once(ACCOUNT_EVENTS.CREATE_LINK_FAILURE, (err) => {
      setConnecting(false);
      tab?.close();
      toast.error(getToastError(err, "Could not start the LinkedIn connection"));
    });
    accountController.createLink(emitter, RETURN_TO);
  }

  function handleContinue() {
    setOnboardingStage("audience");
    navigate("/onboarding/audience");
  }

  return (
    <AuthShell
      aside={<WelcomeAside step={3} total={5} credits={100} />}
      bodyTop
    >
      <div className="sp-card sp-card--wide">
        <Stepper current={3} />

        <div className="sp-card__head">
          <h2 className="sp-card__title">
            Connect your <span className="acc">LinkedIn</span>
          </h2>
          <p className="sp-card__sub">
            Spurly sends and tracks outreach from your own LinkedIn account, so
            the audience you build next can start filling in right away.
          </p>
        </div>

        {loading ? (
          <div className="sp-store">
            <span className="sp-spin" />
            <div>
              <div className="sp-store__name">Checking your connection…</div>
            </div>
          </div>
        ) : connected ? (
          <div className="sp-ext-installed">
            <CheckCircleIcon s={22} />
            <span>
              LinkedIn connected
              {account?.linkedinName ? ` as ${account.linkedinName}` : ""}.
            </span>
          </div>
        ) : (
          <div className="sp-store">
            <LinkedInIcon s={40} />
            <div>
              <div className="sp-store__name">Sign in on LinkedIn's own page</div>
              <div className="sp-store__ver">Your credentials never reach Spurly</div>
            </div>
          </div>
        )}

        <div className="sp-howto">
          <div className="sp-howto__h">Why connect</div>
          <div className="sp-installsteps">
            {WHY.map((w) => (
              <div className="sp-istep" key={w.t}>
                <span className="sp-istep__num">
                  <w.Icon s={16} />
                </span>
                <div>
                  <div className="sp-istep__t">{w.t}</div>
                  <div className="sp-istep__d">{w.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {connected ? (
          <button
            className="sp-btn sp-btn--primary"
            style={{ marginTop: 20 }}
            onClick={handleContinue}
          >
            Continue <ArrowRightIcon s={18} />
          </button>
        ) : (
          <button
            className="sp-btn sp-btn--primary"
            style={{ marginTop: 20 }}
            onClick={handleConnect}
            disabled={connecting || loading}
          >
            {connecting ? (
              <>
                <span className="sp-spin" /> Opening LinkedIn…
              </>
            ) : (
              <>
                <LinkedInIcon s={18} /> Connect with LinkedIn <ArrowRightIcon s={16} />
              </>
            )}
          </button>
        )}
      </div>
    </AuthShell>
  );
}
