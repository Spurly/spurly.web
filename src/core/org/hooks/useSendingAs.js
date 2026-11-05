import { useMemo } from 'react';
import { useOrgState } from './useOrgState.js';
import { useActiveAccount } from './useActiveAccount.js';
import { getKnownAccounts } from 'src/shared/orgAccount/activeAccount.js';

/**
 * Which account a send, enrol or create action will run through (D52: one acting account per action).
 * `isOrg` is false for a solo user, who sees nothing of this. `needsPick` means the member has several accounts and
 * none is in effect, so every send action must wait until one is picked in "Acting as".
 */
export function useSendingAs() {
  const org = useOrgState();
  const [activeId] = useActiveAccount();
  return useMemo(() => {
    if (!org.isMember) return { isOrg: false, name: '', needsPick: false };
    const { accounts } = getKnownAccounts();
    const chosen = accounts.find((a) => String(a.id) === String(activeId));
    const account = chosen || (accounts.length === 1 ? accounts[0] : null);
    return {
      isOrg: true,
      name: account ? account.name || account.publicIdentifier || '' : '',
      needsPick: accounts.length > 1 && !account,
    };
  }, [org.isMember, activeId]);
}
