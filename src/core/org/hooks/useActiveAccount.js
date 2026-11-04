import { useEffect, useState } from 'react';
import { getActiveAccountId, setActiveAccountId, subscribeActiveAccount } from 'src/shared/orgAccount/activeAccount.js';

/** The organization member's chosen LinkedIn account ('' = none chosen) and a setter. Shared across components and tabs. */
export function useActiveAccount() {
  const [accountId, setAccountId] = useState(getActiveAccountId);
  useEffect(() => subscribeActiveAccount(() => setAccountId(getActiveAccountId())), []);
  return [accountId, setActiveAccountId];
}
