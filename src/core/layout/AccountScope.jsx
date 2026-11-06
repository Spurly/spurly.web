import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import { useActiveAccount } from "src/core/org/hooks/useActiveAccount.js";
import { ORG_ACCOUNT_PAGES } from "src/core/org/constants/constants.js";

/**
 * Wraps the route tree so that choosing another "Acting as" account re-mounts the current page: its data hooks,
 * fetched lists and local state all reset and every request it makes carries the new account, with no full page
 * reload. It must sit ABOVE the pages (not inside the layout): each page calls its own data hooks and then renders
 * the layout, so a key placed inside the layout would reset only the markup and leave the old account's data on screen.
 * Pages that do not use an account (the inbox shows all of them, settings, home) are never re-mounted.
 */
export function AccountScope({ children }) {
  const { pathname } = useLocation();
  const [accountId] = useActiveAccount();
  const bound = ORG_ACCOUNT_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return <Fragment key={bound ? accountId || "none" : "static"}>{children}</Fragment>;
}
