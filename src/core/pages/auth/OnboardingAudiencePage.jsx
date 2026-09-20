import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "src/core/primitives";
import { getToastError } from "src/shared/utils/apiError";
import EventEmitter from "src/shared/utils/EventEmitter.js";
import leadController from "src/products/leads/controller/lead.js";
import { LEAD_EVENTS } from "src/products/leads/constants/constants.js";
import { AudienceForm } from "src/products/pages/leads/components/AudienceForm.jsx";
import { AuthShell, WelcomeAside, Stepper } from "./components/AuthShell.jsx";

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
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(payload) {
    if (submitting) return;
    setSubmitting(true);
    const emitter = new EventEmitter();
    emitter.once(LEAD_EVENTS.CREATE_SEARCH_SUCCESS, () => {
      setSubmitting(false);
      toast.success("Queued. Importing starts within a minute.");
      navigate("/onboarding/install");
    });
    emitter.once(LEAD_EVENTS.CREATE_SEARCH_FAILURE, (err) => {
      setSubmitting(false);
      toast.error(getToastError(err, "Could not queue that search"));
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

        <AudienceForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </AuthShell>
  );
}
