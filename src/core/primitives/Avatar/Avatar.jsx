import { useState } from 'react';
import { identityColor } from 'src/core/tokens';

/**
 * One avatar for the whole app.
 *
 * The fallback is tinted from the name rather than left grey. A table of a
 * hundred identical grey circles is the flattest thing on a page and carries no
 * information; a stable per-person hue makes rows recognisable at a glance and
 * costs nothing. `tone="neutral"` opts out where identity isn't the point.
 */
export function Avatar({
  src = null,
  name = '',
  size = 28,
  shape = 'circle',
  tone = 'identity',
  className = '',
}) {
  const [failed, setFailed] = useState(false);
  /* Two initials, first and last word ("Amara Osei" → AO), as the handoff
     draws them — one letter alone collides constantly in a list of people. */
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  const initial =
    words.length === 0
      ? '?'
      : (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
  const showImage = src && !failed;
  const radius = shape === 'circle' ? '50%' : 'var(--ui-radius-xs)';

  if (showImage) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className={`shrink-0 object-cover ${className}`}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  const palette =
    tone === 'identity'
      ? identityColor(name)
      : tone === 'accent'
        ? { bg: 'var(--ui-accent-tint)', fg: 'var(--ui-accent-fg)' }
        : { bg: 'var(--ui-surface-active)', fg: 'var(--ui-text-secondary)' };

  return (
    <span
      aria-hidden="true"
      className={`shrink-0 grid place-items-center font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: Math.max(9, Math.round(size * 0.38 * 2) / 2),
        background: palette.bg,
        color: palette.fg,
      }}
    >
      {initial}
    </span>
  );
}
