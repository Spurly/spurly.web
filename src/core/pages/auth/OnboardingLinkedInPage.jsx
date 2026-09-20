import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

/**
 * Retry the vendor pull twice, 5s apart, after coming back from hosted auth
 * (D4). Mirrors useLinkedInSettings.js's post-redirect loop and for the same
 * reason: the hosted-auth binding callback is built from BACKEND_PUBLIC_URL
 * and never reaches a developer machine at all, and even in production it can
 * still be missed, so re-reading OUR OWN row is reading the one place that
 * has not heard about the connection yet. `refresh()` (POST
 * /hub/account/refresh) asks the vendor directly instead.
 */
const RETRY_INTERVAL_MS = 5000;
const RETRY_MAX_ATTEMPTS = 2;

/** How long the "Connected!" message shows before moving on. */
const CONTINUE_DELAY_MS = 1200;

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
 */
export default function OnboardingLinkedInPage() {
  const navigate = useNavigate();
  const { setOnboardingStage } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [checkingAgain, setCheckingAgain] = useState(false);
  const [waitingOnCallback, setWaitingOnCallback] = useState(false);

  const advancedRef = useRef(false);

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

  /**
   * The hosted flow redirects back here with ?linked=1 or ?linked=0 -- always
   * in the NEW tab handleConnect opened, not the original one. Read it once,
   * then strip it, same as useLinkedInSettings.js: a refresh replaying the
   * toast, or a bookmarked/shared URL claiming a success that never
   * happened, are both wrong.
   */
  useEffect(() => {
    const linked = searchParams.get("linked");
    if (linked === null) return undefined;

    setSearchParams({}, { replace: true });

    if (linked !== "1") {
      toast.error("LinkedIn was not connected");
      return undefined;
    }

    setWaitingOnCallback(true);
    let attempts = 0;
    let timer = null;
    let cancelled = false;

    const onPullSuccess = (next) => {
      if (cancelled) return;
      setAccount(next);
      setLoading(false);
      if (next?.connected) {
        setWaitingOnCallback(false);
        return;
      }
      if (attempts < RETRY_MAX_ATTEMPTS) {
        timer = setTimeout(pull, RETRY_INTERVAL_MS);
      } else {
        setWaitingOnCallback(false);
        toast.error("Still waiting on LinkedIn -- try “Check again” in a moment");
      }
    };
    const onPullFailure = (err) => {
      if (cancelled) return;
      setWaitingOnCallback(false);
      setLoading(false);
      toast.error(getToastError(err, "Could not confirm the connection"));
    };
    function pull() {
      attempts += 1;
      const emitter = new EventEmitter();
      emitter.once(ACCOUNT_EVENTS.REFRESH_SUCCESS, onPullSuccess);
      emitter.once(ACCOUNT_EVENTS.REFRESH_FAILURE, onPullFailure);
      accountController.refresh(emitter);
    }
    pull();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const connected = Boolean(account?.connected);

  /**
   * Whatever got us here (already connected on load, or the redirect pull
   * above just confirmed it), advance the stage exactly once and move on --
   * same "confirm, then continue automatically" shape as
   * InstallExtensionPage's install confirmation.
   */
  useEffect(() => {
    if (!connected || advancedRef.current) return undefined;
    advancedRef.current = true;
    setOnboardingStage("audience");
    const timer = setTimeout(() => navigate("/onboarding/audience"), CONTINUE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [connected, navigate, setOnboardingStage]);

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

  function handleCheckAgain() {
    if (checkingAgain) return;
    setCheckingAgain(true);
    const emitter = new EventEmitter();
    emitter.once(ACCOUNT_EVENTS.REFRESH_SUCCESS, (next) => {
      setAccount(next);
      setCheckingAgain(false);
      if (!next?.connected) toast.error("Still not connected -- give it a moment and try again");
    });
    emitter.once(ACCOUNT_EVENTS.REFRESH_FAILURE, (err) => {
      setCheckingAgain(false);
      toast.error(getToastError(err, "Could not refresh the connection"));
    });
    accountController.refresh(emitter);
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
              {account?.linkedinName ? ` as ${account.linkedinName}` : ""}. Continuing…
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

        {!connected && (
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
            ) : waitingOnCallback ? (
              <>
                <span className="sp-spin" /> Confirming…
              </>
            ) : (
              <>
                <LinkedInIcon s={18} /> Connect with LinkedIn <ArrowRightIcon s={16} />
              </>
            )}
          </button>
        )}

        {!connected && !loading && (
          <button
            type="button"
            className="sp-btn sp-btn--ghost"
            onClick={handleCheckAgain}
            disabled={checkingAgain}
            style={{ marginTop: 2 }}
          >
            {checkingAgain ? "Checking…" : "Already connected? Check again"}
          </button>
        )}
      </div>
    </AuthShell>
  );
}
