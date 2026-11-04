import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import { useActiveAccount } from "src/core/org/hooks/useActiveAccount.js";
import { ORG_ACCOUNT_PAGES } from "src/core/org/constants/constants.js";

/**
 * Wraps a page's content so that choosing another "Acting as" account re-mounts it: every request it makes then
 * carries the new account, with no full page reload (the sidebar, scroll and the rest of the app stay put).
 * Pages that do not use an account (the inbox shows all of them) are never re-mounted.
 */
export function AccountScope({ children }) {
  const { pathname } = useLocation();
  const [accountId] = useActiveAccount();
  const bound = ORG_ACCOUNT_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return <Fragment key={bound ? accountId || "none" : "static"}>{children}</Fragment>;
}
