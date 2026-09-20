import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "src/core/auth/hooks/useAuth";
import { useToast } from "src/core/primitives";
import { getToastError } from "src/shared/utils/apiError";
import EventEmitter from "src/shared/utils/EventEmitter.js";
import leadController from "src/products/leads/controller/lead.js";
import { LEAD_EVENTS } from "src/products/leads/constants/constants.js";
import accountController from "src/products/settings/controller/account.js";
import { ACCOUNT_EVENTS } from "src/products/settings/constants/constants.js";
import { AudienceForm } from "src/products/pages/leads/components/AudienceForm.jsx";
import { AuthShell, WelcomeAside, Stepper } from "./components/AuthShell.jsx";
import { LinkedInIcon, ArrowRightIcon } from "./components/icons.jsx";

/**
 * The one refusal worth a distinct state rather than a toast: no usable
 * LinkedIn connection. A toast vanishes and the fix is a different page --
 * same reasoning as useLeadsPage.js's own needsAccount handling, reused here
 * as the failure-side half of this page's account gate.
 */
const NO_ACCOUNT_CODES = ["NO_LINKEDIN_ACCOUNT", "LINKEDIN_ACCOUNT_NOT_READY"];

/**
 * Prefill the audience *name* field only -- never a filter value.
 *
 * The survey's primaryGoal ("generate_leads", "recruit_candidates", ...)
 * says what the user is here to do, not who to search for: it carries no
 * location, industry, company or title. Guessing a filter from it would
 * mean sending LinkedIn's structured search an id we invented rather than
 * one FilterTagPicker resolved (see the file header) -- silently wrong, or
 * silently empty. A name is free text with no such failure mode, so it is
 * the only field this maps.
 */
const GOAL_NAME_PREFILL = {
  generate_leads: "My first leads audience",
  linkedin_outreach: "My first outreach audience",
  recruit_candidates: "My first candidate search",
  personal_branding: "My first audience",
  agency_prospecting: "My first client audience",
};

/**
 * Step 4 of 5 -- build the first audience LinkedIn will search. Protected
 * route (auth + active subscription, like every onboarding page).
 *
 * Reuses AudienceForm.jsx and FilterTagPicker.jsx verbatim (the same
 * components /hub/leads uses for "New audience") rather than a simpler
 * free-text substitute: LinkedIn's structured search takes only its own
 * internal ids for location/industry/company/school, never typed text, and
 * FilterTagPicker is what turns a keystroke into a real id via
 * GET /hub/audience/params. A plain text input here would silently send the
 * wrong id, or none at all.
 *
 * Submits through the SAME leadController.createSearch the /hub/leads page
 * uses -- one POST /hub/searches, one success/failure event pair, no second
 * copy of this logic to drift from the first (see useLeadsPage.js's own note
 * on why createAudience is a single path).
 */
export default function OnboardingAudiencePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setOnboardingStage } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [accountConnected, setAccountConnected] = useState(false);
  const initialName = useMemo(
    () => GOAL_NAME_PREFILL[user?.primaryGoal] ?? "",
    [user?.primaryGoal],
  );

  /*
   * Upfront gate: a user can reach this page never having connected
   * LinkedIn at all (D5's "I'll do this later" skip advances the stage to
   * 'audience' without connecting). Check once on mount rather than waiting
   * for a submit to fail against FilterTagPicker's own lookups.
   */
  useEffect(() => {
    const emitter = new EventEmitter();
    emitter.once(ACCOUNT_EVENTS.GET_SUCCESS, (account) => {
      setAccountConnected(Boolean(account?.connected));
      setCheckingAccount(false);
    });
    emitter.once(ACCOUNT_EVENTS.GET_FAILURE, (err) => {
      toast.error(getToastError(err, "Could not check your LinkedIn connection"));
      setCheckingAccount(false);
    });
    accountController.get(emitter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(payload) {
    if (submitting) return;
    setSubmitting(true);
    const emitter = new EventEmitter();
    emitter.once(LEAD_EVENTS.CREATE_SEARCH_SUCCESS, () => {
      setSubmitting(false);
      setOnboardingStage("install");
      toast.success("Queued. Importing starts within a minute.");
      navigate("/onboarding/install");
    });
    emitter.once(LEAD_EVENTS.CREATE_SEARCH_FAILURE, (err) => {
      setSubmitting(false);
      const code = err?.response?.data?.code;
      if (NO_ACCOUNT_CODES.includes(code)) {
        // The upfront check passed but the connection dropped (or never
        // really took) before this submit reached the vendor. Fall back to
        // the same gate the mount check would have shown.
        setAccountConnected(false);
      } else {
        toast.error(getToastError(err, "Could not queue that search"));
      }
    });
    leadController.createSearch(emitter, payload);
  }

  return (
    <AuthShell
      aside={<WelcomeAside step={4} total={5} credits={100} />}
      bodyTop
    >
      <div className="sp-card sp-card--wide">
        <Stepper current={4} />

        <div className="sp-card__head">
          <h2 className="sp-card__title">
            Build your first <span className="acc">audience</span>
          </h2>
          <p className="sp-card__sub">
            Tell Spurly who to look for on LinkedIn -- it starts paging results
            in the background as soon as you queue it.
          </p>
        </div>

        {checkingAccount ? (
          <div className="sp-store">
            <span className="sp-spin" />
            <div>
              <div className="sp-store__name">Checking your connection…</div>
            </div>
          </div>
        ) : !accountConnected ? (
          <>
            <div className="sp-store">
              <LinkedInIcon s={40} />
              <div>
                <div className="sp-store__name">Connect LinkedIn to build an audience</div>
                <div className="sp-store__ver">
                  This step searches LinkedIn through your own account
                </div>
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
        ) : (
          <AudienceForm
            initialName={initialName}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </AuthShell>
  );
}
