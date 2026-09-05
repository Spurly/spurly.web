import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "src/platform/auth/useAuth";
import { useToast } from "src/ui/primitives";
import { getToastError } from "src/shared/utils/apiError";
import { AuthShell, WelcomeAside, Stepper } from "./AuthShell.jsx";
import { Dropdown } from "src/ui/primitives/Dropdown";
import {
  BriefcaseIcon,
  UsersIcon,
  TargetIcon,
  TrendIcon,
  BuildingIcon,
  GlobeIcon,
  LinkedInIcon,
  StarIcon,
  SendIcon,
  ChartIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "./icons.jsx";

/* Survey options. Values match the User-model enums on the backend. */
const ROLES = [
  ["founder", "Founder"],
  ["sdr_bdr", "SDR / BDR"],
  ["sales_manager", "Sales Manager"],
  ["recruiter", "Recruiter"],
  ["agency", "Agency"],
  ["consultant", "Consultant"],
  ["other", "Other"],
];
const TEAM_SIZES = [
  ["solo", "Solo"],
  ["2-10", "2 – 10"],
  ["11-50", "11 – 50"],
  ["51-200", "51 – 200"],
  ["200+", "200+"],
];
const GOALS = [
  ["generate_leads", "Generate Leads"],
  ["linkedin_outreach", "LinkedIn Outreach"],
  ["recruit_candidates", "Recruit Candidates"],
  ["personal_branding", "Personal Branding"],
  ["agency_prospecting", "Agency Prospecting"],
];
const ACTIVITY = [
  ["lt_500", "< 500 prospects"],
  ["500_2k", "500 – 2,000 prospects"],
  ["2k_10k", "2,000 – 10,000 prospects"],
  ["10k_plus", "10,000+ prospects"],
];
/* LinkedIn subscription tiers, cheapest first. Required — the plan affects
   InMail budget and search filters, NOT connection-invite limits. */
const LINKEDIN_PLANS = [
  ["free", "Free (Basic)"],
  ["premium_career", "Premium Career"],
  ["premium_business", "Premium Business"],
  ["premium_all_in_one", "Premium All-in-One"],
  ["sales_nav_core", "Sales Navigator Core"],
  ["sales_nav_advanced", "Sales Navigator Advanced"],
  ["sales_nav_advanced_plus", "Sales Navigator Advanced Plus"],
  ["recruiter_lite", "Recruiter Lite"],
  ["recruiter_corporate", "Recruiter Corporate"],
];

const BONUS = [
  { Icon: TrendIcon, t: "Signup on Spurly" },
  { Icon: ChartIcon, t: "Refer a fellow professional" },
  {
    Icon: SendIcon,
    t: "Earn 10% of every credit they burn.",
  },
];

/**
 * Step 2 — "Tell us a bit about yourself".
 * Protected route (only reachable once signed in). Persists the survey via
 * completeOnboarding, then advances to the install step. If onboarding is
 * already done, jumps straight to install.
 */
export default function OnboardingSurveyPage() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    role: "",
    teamSizeRange: "",
    primaryGoal: "",
    monthlyActivity: "",
    linkedinPlan: "",
    companyName: "",
    companyWebsite: "",
  });
  const [loading, setLoading] = useState(false);

  // Already onboarded? Skip ahead. Otherwise prefill anything we know.
  useEffect(() => {
    if (user?.onboardingComplete) {
      navigate("/onboarding/install", { replace: true });
      return;
    }
    if (user) {
      setForm((f) => ({
        ...f,
        role: user.role || f.role,
        teamSizeRange: user.teamSizeRange || f.teamSizeRange,
        primaryGoal: user.primaryGoal || f.primaryGoal,
        monthlyActivity: user.monthlyActivity || f.monthlyActivity,
        linkedinPlan: user.linkedinPlan || f.linkedinPlan,
        companyName: user.companyName || f.companyName,
        companyWebsite: user.companyWebsite || f.companyWebsite,
      }));
    }
  }, [user, navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setField = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const required = [
    "role",
    "teamSizeRange",
    "primaryGoal",
    "monthlyActivity",
    "linkedinPlan",
    "companyName",
  ];
  const canSubmit = required.every((k) => String(form[k]).trim()) && !loading;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await completeOnboarding({
        role: form.role,
        teamSizeRange: form.teamSizeRange,
        primaryGoal: form.primaryGoal,
        monthlyActivity: form.monthlyActivity,
        linkedinPlan: form.linkedinPlan,
        companyName: form.companyName.trim(),
        companyWebsite: form.companyWebsite.trim() || undefined,
      });
      toast.success("Details saved");
      navigate("/onboarding/install", { replace: true });
    } catch (err) {
      toast.error(getToastError(err, "Couldn't save your details"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      aside={<WelcomeAside step={2} total={3} credits={100} />}
      bodyTop
    >
      <div className="sp-card sp-card--wide">
        <Stepper current={2} />

        <div className="sp-card__head">
          <h2 className="sp-card__title">Tell us a bit about yourself</h2>
          <p className="sp-card__sub">
            This helps us personalize your experience and recommendations.
          </p>
        </div>

        <form className="sp-form" onSubmit={onSubmit} noValidate>
          <div className="sp-grid-2">
            <div className="sp-field">
              <label className="sp-label" htmlFor="ob-role">
                What best describes you?<span className="req">*</span>
              </label>
              <Dropdown
                id="ob-role"
                icon={<BriefcaseIcon s={18} />}
                value={form.role}
                onChange={setField("role")}
                placeholder="Select one"
                options={ROLES}
              />
            </div>
            <div className="sp-field">
              <label className="sp-label" htmlFor="ob-team">
                Team Size<span className="req">*</span>
              </label>
              <Dropdown
                id="ob-team"
                icon={<UsersIcon s={18} />}
                value={form.teamSizeRange}
                onChange={setField("teamSizeRange")}
                placeholder="Select one"
                options={TEAM_SIZES}
              />
            </div>
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="ob-goal">
              Primary Goal with Spurly<span className="req">*</span>
            </label>
            <Dropdown
              id="ob-goal"
              icon={<TargetIcon s={18} />}
              value={form.primaryGoal}
              onChange={setField("primaryGoal")}
              placeholder="Select one"
              options={GOALS}
            />
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="ob-activity">
              How many LinkedIn prospects do you engage with monthly?
              <span className="req">*</span>
            </label>
            <Dropdown
              id="ob-activity"
              icon={<TrendIcon s={18} />}
              value={form.monthlyActivity}
              onChange={setField("monthlyActivity")}
              placeholder="Select one"
              options={ACTIVITY}
            />
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="ob-plan">
              Which LinkedIn plan are you on?<span className="req">*</span>
            </label>
            <Dropdown
              id="ob-plan"
              icon={<LinkedInIcon s={18} />}
              value={form.linkedinPlan}
              onChange={setField("linkedinPlan")}
              placeholder="Select your plan"
              options={LINKEDIN_PLANS}
            />
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="ob-company">
              Company Name<span className="req">*</span>
            </label>
            <div className="sp-input-wrap">
              <span className="sp-ic-left">
                <BuildingIcon s={18} />
              </span>
              <input
                id="ob-company"
                type="text"
                className="sp-input has-left"
                value={form.companyName}
                onChange={set("companyName")}
                placeholder="Acme Solutions"
                required
              />
            </div>
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="ob-website">
              Company Website <span className="opt">(Optional)</span>
            </label>
            <div className="sp-input-wrap">
              <span className="sp-ic-left">
                <GlobeIcon s={18} />
              </span>
              <input
                id="ob-website"
                type="text"
                className="sp-input has-left"
                value={form.companyWebsite}
                onChange={set("companyWebsite")}
                placeholder="https://acmesolutions.com"
              />
            </div>
          </div>

          <button
            type="submit"
            className="sp-btn sp-btn--primary"
            disabled={!canSubmit}
          >
            {loading ? (
              <>
                <span className="sp-spin" /> Saving…
              </>
            ) : (
              <>
                Continue <ArrowRightIcon s={18} />
              </>
            )}
          </button>

          <button
            type="button"
            className="sp-btn sp-btn--ghost"
            onClick={() => navigate("/dashboard")}
            style={{ marginTop: 2 }}
          >
            <ArrowLeftIcon s={16} /> Back
          </button>
        </form>

        <div className="sp-bonus">
          <div className="sp-bonus__head">
            <span className="star">
              <StarIcon s={18} />
            </span>
            Complete onboarding and get more than
            <span className="acc">200 bonus credits</span>
          </div>
          <div className="sp-bonus__grid">
            {BONUS.map(({ Icon, t }) => (
              <div className="sp-bonus__item" key={t}>
                <span className="sp-bonus__ic">
                  <Icon s={16} />
                </span>
                <div>
                  <div className="sp-bonus__t">{t}</div>
                  <div className="sp-bonus__c">+ 100 credits</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
