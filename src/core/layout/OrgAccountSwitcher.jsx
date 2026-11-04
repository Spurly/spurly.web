import { useEffect, useMemo } from "react";
import { Dropdown } from "src/core/primitives";
import { useOrganizations, useOrgAccounts } from "src/core/org/hooks/useOrganization.js";
import { useActiveAccount } from "src/core/org/hooks/useActiveAccount.js";
import { ORG_COPY } from "src/core/org/constants/constants.js";

/**
 * "Acting as": which of the organization's LinkedIn accounts the account-bound features (leads, imports, invitations,
 * posts, viewers, campaigns, sequences…) run through. The choice rides on every such request from the gateway, so no
 * page needs its own picker. One connected account needs no choice (the server uses it); with several, one is always
 * selected. Changing it reloads the page so everything on screen is for the new account.
 */
function Picker({ orgId }) {
  const { accounts } = useOrgAccounts(orgId);
  const [activeId, setActive] = useActiveAccount();
  const usable = useMemo(() => (accounts || []).filter((a) => a.status === "OK"), [accounts]);
  const ids = usable.map((a) => String(a.id)).join(",");

  // Keep the choice valid: none with one account, and the first account when several exist and none (or a gone one) is chosen.
  useEffect(() => {
    if (!accounts) return;
    if (usable.length < 2) {
      if (activeId) setActive("");
      return;
    }
    if (!usable.some((a) => String(a.id) === activeId)) setActive(String(usable[0].id));
  }, [accounts, usable, activeId, ids, setActive]);

  if (usable.length < 2) return null;
  const options = usable.map((a) => [String(a.id), a.name || a.publicIdentifier || ORG_COPY.switcher.unnamed]);

  return (
    <div className="px-3 pb-3">
      <span className="ui-micro mb-1 block !text-[var(--ui-text-secondary)]">{ORG_COPY.switcher.label}</span>
      <Dropdown
        variant="dashboard"
        size="sm"
        value={activeId}
        options={options}
        ariaLabel={ORG_COPY.switcher.label}
        // The sidebar re-themes text tokens for its dark rail, but the control is a light surface: pin the trigger to dark text and full width.
        className="w-full [&_button]:w-full [&_button]:!text-[var(--ui-neutral-900)] [&_svg]:!text-[var(--ui-neutral-500)]"
        onChange={(next) => {
          if (next === activeId) return;
          setActive(next);
          window.location.reload();
        }}
      />
    </div>
  );
}

export function OrgAccountSwitcher() {
  const { orgs } = useOrganizations();
  const orgId = orgs?.[0]?.id;
  if (!orgId) return null;
  return <Picker orgId={orgId} />;
}
