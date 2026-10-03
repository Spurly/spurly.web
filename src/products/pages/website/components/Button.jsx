/* ============================================================
   Reusable button/link. Renders an <a> by default (most CTAs are
   links), or a <button> when `as="button"`. Mirrors the original
   class combinations: variant (primary|ghost) + size (sm|lg).
   ============================================================ */

import { useLocation } from "react-router-dom";
import { CHROME_URL } from "src/shared/extension/constants.js";
import { campaignFor, chromeStoreUrl, track } from "src/shared/analytics/analytics.js";

export { CHROME_URL };

export default function Button({
  as = "a",
  variant = "primary",
  size,
  magnetic = false,
  className = "",
  children,
  ...rest
}) {
  const classes = [
    "btn",
    variant === "primary" ? "btn-primary" : variant === "ghost" ? "btn-ghost" : "",
    size === "lg" ? "btn-lg" : size === "sm" ? "btn-sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const magneticAttr = magnetic ? { "data-magnetic": "" } : {};

  if (as === "button") {
    return (
      <button className={classes} {...magneticAttr} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <a className={classes} {...magneticAttr} {...rest}>
      {children}
    </a>
  );
}

/* Convenience: the recurring external CTA to the Chrome Web Store. */
function useChromeCta() {
  const campaign = campaignFor(useLocation().pathname);
  return {
    href: chromeStoreUrl(campaign),
    onClick: () => track("add_to_chrome_click", { link_location: campaign }),
  };
}

export function ChromeLink(props) {
  return (
    <Button {...useChromeCta()} target="_blank" rel="noopener" {...props} />
  );
}

/* Same tracked Chrome Web Store link, as a plain text link (footer etc.). */
export function ChromeStoreLink({ children, ...rest }) {
  return (
    <a {...useChromeCta()} target="_blank" rel="noopener" {...rest}>
      {children}
    </a>
  );
}
