import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthShell, WelcomeAside, Stepper } from "./AuthShell.jsx";
import { CHROME_URL } from "src/marketing/components/Button.jsx";
import {
  ChromeIcon,
  TargetIcon,
  SendIcon,
  ChartIcon,
  ShieldIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "./icons.jsx";

const EXT_ID = "dcohpfeaohfiiinjjiinojlbnnfmihoh";
const POLL_MS = 2000;
const TIMEOUT_MS = 120000;

const INSTALL_STEPS = [
  {
    n: 1,
    t: "Add to Chrome",
    d: "Click the button below to open the Chrome Web Store.",
  },
  {
    n: 2,
    t: "Add Extension",
    d: 'Click "Add extension" in the confirmation popup.',
  },
  {
    n: 3,
    t: "Pin to Chrome",
    d: "Pin the Spurly icon to your toolbar for easy access.",
  },
];

const CAPABILITIES = [
  {
    Icon: TargetIcon,
    t: "Capture Leads",
    d: "Extract leads from LinkedIn profiles and Sales Navigator",
  },
  {
    Icon: SendIcon,
    t: "Automate Outreach",
    d: "Send personalized connection requests and follow-ups",
  },
  {
    Icon: ChartIcon,
    t: "Track & Optimize",
    d: "Monitor performance and optimize your campaigns",
  },
  {
    Icon: ShieldIcon,
    t: "Safe & Compliant",
    d: "Built with safety in mind. Your account is protected",
  },
];

function pingExtension() {
  return new Promise((resolve) => {
    try {
      if (typeof chrome === "undefined" || !chrome?.runtime?.sendMessage) {
        resolve(false);
        return;
      }
      chrome.runtime.sendMessage(EXT_ID, { type: "SPURLY_PING" }, () => {
        resolve(!chrome.runtime.lastError);
      });
    } catch {
      resolve(false);
    }
  });
}

// status: 'idle' | 'detecting' | 'installed' | 'timeout'
function useExtensionDetection() {
  const [status, setStatus] = useState("idle");
  const navigate = useNavigate();
  const activeRef = useRef(false);

  function startDetection() {
    if (activeRef.current) return;
    activeRef.current = true;
    setStatus("detecting");

    let stopped = false;
    let pollTimer;

    // Listen for postMessage from the extension content script
    function onMessage(e) {
      if (e.data?.type === "SPURLY_INSTALLED" && !stopped) {
        confirm_installed();
      }
    }
    window.addEventListener("message", onMessage);

    function confirm_installed() {
      stopped = true;
      clearTimeout(pollTimer);
      clearTimeout(timeoutTimer);
      window.removeEventListener("message", onMessage);
      setStatus("installed");
      setTimeout(() => navigate("/dashboard"), 1800);
    }

    async function poll() {
      if (stopped) return;
      const found = await pingExtension();
      if (stopped) return;
      if (found) {
        confirm_installed();
      } else {
        pollTimer = setTimeout(poll, POLL_MS);
      }
    }

    poll();

    const timeoutTimer = setTimeout(() => {
      if (stopped) return;
      stopped = true;
      clearTimeout(pollTimer);
      window.removeEventListener("message", onMessage);
      setStatus("timeout");
    }, TIMEOUT_MS);
  }

  return { status, startDetection };
}

export default function InstallExtensionPage() {
  const { status, startDetection } = useExtensionDetection();

  const isDetecting = status === "detecting";
  const isInstalled = status === "installed";
  const isTimeout = status === "timeout";

  function handleCTAClick() {
    window.open(CHROME_URL, "_blank", "noopener,noreferrer");
    startDetection();
  }

  return (
    <AuthShell
      aside={<WelcomeAside step={3} total={3} credits={100} allSet />}
      bodyTop
    >
      <div className="sp-card sp-card--wide">
        <Stepper current={3} />

        <div className="sp-card__head">
          <h2 className="sp-card__title">
            Install the <span className="acc">Spurly</span> Chrome Extension
          </h2>
          <p className="sp-card__sub">
            Install the extension to start capturing leads, automating outreach
            and growing your pipeline on LinkedIn.
          </p>
        </div>

        <div className="sp-store">
          <ChromeIcon s={40} />
          <div>
            <div className="sp-store__name">Works on Chrome Browser</div>
            <div className="sp-store__ver">Version 88 and above</div>
          </div>
          <div className="sp-store__rate">
            <div className="sp-store__stars">★★★★★</div>
            <div className="sp-store__count">4.9/5 from 500+ users</div>
          </div>
        </div>

        <div className="sp-howto">
          <div className="sp-howto__h">How to install</div>
          <div className="sp-installsteps">
            {INSTALL_STEPS.map((s) => (
              <div className="sp-istep" key={s.n}>
                <span className="sp-istep__num">{s.n}</span>
                <div>
                  <div className="sp-istep__t">{s.t}</div>
                  <div className="sp-istep__d">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA area ── */}
        {isInstalled ? (
          <div className="sp-ext-installed">
            <CheckCircleIcon s={22} />
            <span>Extension installed! Redirecting to your dashboard…</span>
          </div>
        ) : (
          <button
            className="sp-btn sp-btn--primary"
            onClick={handleCTAClick}
            disabled={isDetecting}
            style={{ marginTop: 20, opacity: isDetecting ? 0.75 : 1 }}
          >
            {isDetecting ? (
              <>
                <span className="sp-spinner" /> Waiting for installation…
              </>
            ) : (
              <>
                <ChromeIcon s={22} /> Add Spurly to Chrome{" "}
                <ArrowRightIcon s={18} />
              </>
            )}
          </button>
        )}

        {(isDetecting || isTimeout) && (
          <div className="sp-ext-manual">
            <p className="sp-ext-hint" style={{ marginTop: 0 }}>
              Installed? Click below to go to your dashboard.
            </p>
            <Link className="sp-btn sp-btn--ghost sp-btn--full" to="/dashboard">
              I've installed it — Go to Dashboard <ArrowRightIcon s={16} />
            </Link>
          </div>
        )}

        <div className="sp-install-meta">
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <CheckCircleIcon s={15} /> 100% safe and secure
          </span>
          <span>·</span>
          <span>Trusted by 500+ professionals</span>
        </div>

        <div
          className="sp-howto"
          style={{
            marginTop: 24,
            borderTop: "1px solid var(--sp-line)",
            paddingTop: 20,
          }}
        >
          <div
            className="sp-howto__h"
            style={{ textAlign: "center", color: "var(--sp-primary)" }}
          >
            What you can do with Spurly
          </div>
          <div className="sp-bonus__grid" style={{ marginTop: 6 }}>
            {CAPABILITIES.map(({ Icon, t, d }) => (
              <div className="sp-bonus__item" key={t}>
                <span className="sp-bonus__ic">
                  <Icon s={16} />
                </span>
                <div>
                  <div className="sp-istep__t" style={{ fontSize: 13.5 }}>
                    {t}
                  </div>
                  <div className="sp-bonus__t">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isDetecting && !isInstalled && (
          <p className="sp-foot-switch" style={{ marginTop: 22 }}>
            Already installed?{" "}
            <Link className="sp-link" to="/dashboard">
              Go to your dashboard
            </Link>
          </p>
        )}
      </div>
    </AuthShell>
  );
}
