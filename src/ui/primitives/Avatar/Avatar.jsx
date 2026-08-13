import { useState } from 'react';
import { identityColor } from 'src/ui/tokens';

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
  size = 22,
  shape = 'circle',
  tone = 'identity',
  className = '',
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name || '').trim().charAt(0).toUpperCase() || '?';
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
      className={`shrink-0 grid place-items-center font-medium ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: Math.max(9, Math.round(size * 0.45)),
        background: palette.bg,
        color: palette.fg,
      }}
    >
      {initial}
    </span>
  );
}
