import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ORG_ALL_VIEW_PAGES } from 'src/shared/orgAccount/constants/constants.js';
import { wantsAllAccounts, setAllAccountsView, subscribeActiveAccount } from 'src/shared/orgAccount/activeAccount.js';

/**
 * Whether the member is looking at EVERY account's data on this page, and a setter. Only pages that support it
 * (the leads page) ever report true; elsewhere one account is always in effect.
 */
export function useAllAccountsView() {
  const { pathname } = useLocation();
  const [wanted, setWanted] = useState(wantsAllAccounts);
  useEffect(() => subscribeActiveAccount(() => setWanted(wantsAllAccounts())), []);
  const supported = ORG_ALL_VIEW_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return [wanted && supported, setAllAccountsView, supported];
}
