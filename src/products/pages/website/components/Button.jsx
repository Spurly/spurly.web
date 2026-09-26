/* ============================================================
   Reusable button/link. Renders an <a> by default (most CTAs are
   links), or a <button> when `as="button"`. Mirrors the original
   class combinations: variant (primary|ghost) + size (sm|lg).
   ============================================================ */

import { CHROME_URL } from "src/shared/extension/constants.js";

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
export function ChromeLink(props) {
  return (
    <Button href={CHROME_URL} target="_blank" rel="noopener" {...props} />
  );
}
