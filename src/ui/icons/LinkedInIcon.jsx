/**
 * The LinkedIn brand mark.
 *
 * Deliberately NOT lucide's `Linkedin` outline glyph, which is a generic
 * line-art approximation. Rows in the table are scanned, not read: the real
 * mark — blue rounded plate, white "in" — is recognised at 14px in a way an
 * outline is not.
 *
 * Drawn as a filled plate plus white letterforms rather than the usual single
 * knocked-out path, so the "in" stays white on any row background (hover,
 * selection, dark surfaces) instead of showing whatever sits behind it.
 *
 * `color` is the plate; pass `currentColor` to make it inherit instead.
 */
export function LinkedInIcon({ size = 14, color = '#0A66C2', className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      // Decorative by default (LinkCell already labels the link it sits in);
      // labelled only when a caller passes an aria-label, e.g. a column header.
      aria-hidden={props['aria-label'] ? undefined : 'true'}
      role={props['aria-label'] ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      <rect width="24" height="24" rx="4" fill={color} />
      <path
        fill="#fff"
        d="M7.119 20.452H3.555V9h3.564v11.452zM5.337 7.433a2.065 2.065 0 1 1 0-4.13 2.065 2.065 0 0 1 0 4.13zM20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z"
      />
    </svg>
  );
}
