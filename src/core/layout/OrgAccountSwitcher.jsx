import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Dropdown, useConfirm } from "src/core/primitives";
import { useOrganizations, useOrgAccounts } from "src/core/org/hooks/useOrganization.js";
import { useActiveAccount } from "src/core/org/hooks/useActiveAccount.js";
import { ORG_COPY, ORG_ACCOUNT_PAGES } from "src/core/org/constants/constants.js";
import { getKnownAccounts, rememberAccounts } from "src/shared/orgAccount/activeAccount.js";
import { hasDirtyDraft } from "src/shared/orgAccount/draftGuard.js";

const usesAccount = (pathname) => ORG_ACCOUNT_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * "Acting as": which of the organization's LinkedIn accounts the account-bound features (leads, imports, invitations,
 * posts, viewers, campaigns, sequences…) run through. The choice rides on every such request from the gateway, so no
 * page needs its own picker. One connected account needs no choice (the server uses it); with several, one is always
 * in effect (the first until the member picks another). Changing it re-mounts the page content (AccountScope), so everything on
 * screen is for the new account without reloading the app.
 *
 * Every dashboard page mounts its own layout, so this is created again on each sidebar click. It therefore starts from
 * the last list seen (kept in the browser) and refreshes it quietly: the control never blinks out. On pages that do
 * not use an account it stays in place but faded, instead of vanishing.
 */
function Picker({ orgId, expanded }) {
  const { pathname } = useLocation();
  const { accounts } = useOrgAccounts(orgId);
  const [activeId, setActive] = useActiveAccount();
  const confirm = useConfirm();
  const usable = useMemo(() => (accounts || []).filter((a) => a.status === "OK"), [accounts]);
  const known = useMemo(() => getKnownAccounts(), [accounts]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = accounts ? usable : known.accounts;

  // Keep the remembered list and the choice valid even when the control itself is not on screen (collapsed sidebar).
  useEffect(() => {
    if (!accounts) return;
    rememberAccounts(orgId, usable);
    if (usable.length < 2) {
      if (activeId) setActive("");
      return;
    }
    if (!usable.some((a) => String(a.id) === activeId)) {
      // First time on this browser: the page re-mounts (AccountScope) so its requests carry the account.
      setActive(String(usable[0].id));
    }
  }, [accounts, usable, activeId, orgId, setActive]);

  if (!expanded || shown.length < 2) return null;
  const options = shown.map((a) => [String(a.id), a.name || a.publicIdentifier || ORG_COPY.switcher.unnamed]);
  const active = usesAccount(pathname);

  return (
    <div
      className={`px-3 pb-3 transition-opacity duration-[var(--ui-dur-fast)] ${active ? "" : "opacity-45 pointer-events-none select-none"}`}
      title={active ? undefined : ORG_COPY.switcher.notUsedHere}
      aria-disabled={!active}
    >
      <span className="ui-micro mb-1 block !text-[var(--ui-text-secondary)]">{ORG_COPY.switcher.label}</span>
      <Dropdown
        variant="dashboard"
        size="sm"
        value={activeId || options[0][0]}
        options={options}
        ariaLabel={ORG_COPY.switcher.label}
        disabled={!active}
        // Same surface as "Ask Spurly" above it: the rail's translucent card and hairline border, light text, flat (no white gradient).
        className="w-full [--ui-control-bg:none] [--ui-control-shadow:none] [--ui-control-shadow-hover:none] [&_button]:w-full [&_button]:max-w-none [&_button]:h-[34px] [&_button]:!rounded-[var(--ui-radius-btn)] [&_button]:!text-[var(--ui-text-primary)] [&_svg]:!text-[var(--ui-text-secondary)]"
        onChange={(next) => {
          if (next === activeId) return;
          // D60: a builder draft is built for one account. Never lose it or re-point it silently: ask first.
          if (hasDirtyDraft()) {
            confirm({
              title: ORG_COPY.sendingAs.discardTitle,
              description: ORG_COPY.sendingAs.discardBody,
              confirmLabel: ORG_COPY.sendingAs.discardConfirm,
              tone: "danger",
            }).then((ok) => { if (ok) setActive(next); });
            return;
          }
          // No reload: the page content re-mounts (AccountScope) and its requests carry the new account.
          setActive(next);
        }}
      />
    </div>
  );
}

export function OrgAccountSwitcher({ expanded = true }) {
  const { orgs } = useOrganizations();
  const orgId = orgs ? orgs[0]?.id : getKnownAccounts().orgId;
  if (!orgId) return null;
  return <Picker orgId={orgId} expanded={expanded} />;
}
