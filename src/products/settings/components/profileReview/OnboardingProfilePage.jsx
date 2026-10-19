import { useNavigate } from "react-router-dom";
import { useAuth } from "src/core/auth/hooks/useAuth";
import { AuthShell, WelcomeAside, Stepper } from "src/core/pages/auth/components/AuthShell.jsx";
import { LinkedInIcon, ArrowRightIcon } from "src/core/pages/auth/components/icons.jsx";
import { useProfileReview } from "../../hooks/useProfileReview.js";
import { ProfileCard } from "./ProfileCard.jsx";
import { IcpEditor } from "./IcpEditor.jsx";

/**
 * Step 4 of 6 -- "Is this you?". After LinkedIn is connected, show the user
 * everything LinkedIn holds about them (read server-side, in the background)
 * so they can confirm it is the right account, then ask who they want to
 * reach. Protected route (auth + active subscription, like every onboarding
 * page).
 *
 * Lives under products/settings, not core/pages/auth with its siblings: it
 * reads hub data, and core may not import a product (lint:arch). Products may
 * import core, so it borrows the shell, stepper and icons from there.
 *
 * Never a dead end: the read is slow and can fail, so every state has a way
 * forward (Try again, or Continue without it). Nothing here gates the next
 * step on the profile loading or on the ICP being filled in.
 */
export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const { setOnboardingStage } = useAuth();
  const review = useProfileReview(true);
  const { profile, loading, waiting, loadFailed, gaveUp, refreshing } = review;

  const snapshot = profile?.snapshot ?? null;
  const notConnected = !loading && !loadFailed && profile && !profile.connected;
  const readFailed = !loading && !waiting && !snapshot && !notConnected;

  function goToAudience() {
    setOnboardingStage("audience");
    navigate("/onboarding/audience");
  }

  function handleContinue() {
    review.saveIcp(goToAudience);
  }

  return (
    <AuthShell aside={<WelcomeAside step={4} total={6} credits={100} />} bodyTop>
      <div className="sp-card sp-card--wide">
        <Stepper current={4} />

        <div className="sp-card__head">
          <h2 className="sp-card__title">
            Is this <span className="acc">you</span>?
          </h2>
          <p className="sp-card__sub">
            This is what LinkedIn shows about your account. Check it&rsquo;s the
            right one, then tell us who you want to reach.
          </p>
        </div>

        {(loading || waiting || refreshing) && (
          <>
            <div className="sp-store" role="status" aria-live="polite">
              <span className="sp-spin sp-spin--accent" />
              <div>
                <div className="sp-store__name">Reading your LinkedIn profile…</div>
                <div className="sp-store__ver">This can take up to a minute the first time</div>
              </div>
            </div>
            <div className="sp-prof__skeleton" aria-hidden="true">
              <i style={{ width: "60%" }} />
              <i style={{ width: "85%" }} />
              <i style={{ width: "40%" }} />
            </div>
          </>
        )}

        {notConnected && (
          <>
            <div className="sp-store">
              <LinkedInIcon s={40} />
              <div>
                <div className="sp-store__name">LinkedIn isn&rsquo;t connected</div>
                <div className="sp-store__ver">Connect it to see your profile here</div>
              </div>
            </div>
            <button
              type="button"
              className="sp-btn sp-btn--primary"
              style={{ marginTop: 20 }}
              onClick={() => navigate("/onboarding/linkedin")}
            >
              <LinkedInIcon s={18} /> Connect LinkedIn <ArrowRightIcon s={16} />
            </button>
          </>
        )}

        {snapshot && !refreshing && <ProfileCard snapshot={snapshot} profile={profile.profile} />}

        {readFailed && !refreshing && (
          <>
            <div className="sp-store">
              <LinkedInIcon s={40} />
              <div>
                <div className="sp-store__name">
                  {gaveUp ? "LinkedIn is taking longer than usual" : "We couldn’t read your profile just now"}
                </div>
                <div className="sp-store__ver">
                  You can try again, or carry on &mdash; nothing else depends on it.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="sp-btn sp-btn--ghost"
              style={{ marginTop: 10 }}
              onClick={review.handleRefresh}
            >
              Try again
            </button>
          </>
        )}

        {!notConnected && !loading && !waiting && !refreshing && (
          <IcpEditor icp={review.icp} suggestions={profile?.suggestions ?? { roles: [], locations: [] }} onChange={review.updateIcp} />
        )}

        {!notConnected && !loading && (
          <>
            <button
              type="button"
              className="sp-btn sp-btn--primary"
              style={{ marginTop: 24 }}
              onClick={handleContinue}
              disabled={review.saving || waiting || refreshing}
            >
              {review.saving ? (
                <>
                  <span className="sp-spin" /> Saving…
                </>
              ) : (
                <>
                  {snapshot ? "Yes, that’s me — continue" : "Continue"} <ArrowRightIcon s={16} />
                </>
              )}
            </button>
            <button
              type="button"
              className="sp-btn sp-btn--ghost"
              style={{ marginTop: 2 }}
              onClick={goToAudience}
              disabled={review.saving}
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}
