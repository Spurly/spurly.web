/* ============================================================
   Reusable button/link. Renders an <a> by default (most CTAs are
   links), or a <button> when `as="button"`. Mirrors the original
   class combinations: variant (primary|ghost) + size (sm|lg).
   ============================================================ */

export const CHROME_URL =
  "https://chromewebstore.google.com/detail/dcohpfeaohfiiinjjiinojlbnnfmihoh?utm_source=item-share-cb";

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
