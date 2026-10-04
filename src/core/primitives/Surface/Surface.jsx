import { useContext, useRef } from 'react';
import { DepthContext } from './depthContext.js';
import { useMotionAllowed } from './useMotionAllowed.js';
import { useTilt } from './useTilt.js';

/**
 * The one card surface. Card, SectionCard, MetricCard and StatTile all render
 * through this, so the chrome (radius, fill, border, shadow) lives in one place
 * and "does this card have 3D" is a single prop instead of four copies.
 *
 * depth
 *   'flat'   (default) today's card. No listeners, no extra classes, no cost.
 *   'lift'   hover raises the card. CSS only.
 *   'tilt'   pointer-tracked 3D tilt with a moving sheen. Children wrapped in
 *            <SurfaceLayer z={n}> sit above the card for parallax.
 *   'float'  tilt plus a slow idle bob, for hero cards only.
 *
 * Resolution: the `depth` prop, else the nearest <DepthProvider>, else 'flat'.
 * Anything but 'flat' quietly becomes 'flat' for touch, reduced-motion, SSR and
 * test environments (see useMotionAllowed), with identical markup and layout.
 */
const VARIANTS = {
  solid: 'bg-[var(--ui-surface-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)]',
  hairline: 'bg-[var(--ui-surface-card)] border border-[var(--ui-border-hairline)] shadow-[var(--ui-shadow-sm)]',
  sunken: 'bg-[var(--ui-surface-sunken)] border border-transparent',
};

const DEPTH_CLASS = {
  flat: '',
  lift: 'ui-surface ui-surface--lift',
  tilt: 'ui-surface ui-surface--tilt',
  float: 'ui-surface ui-surface--tilt ui-surface--float',
};

export function Surface({ as: Tag = 'div', variant = 'solid', depth, className = '', children, ...props }) {
  const pageDepth = useContext(DepthContext);
  const motionAllowed = useMotionAllowed();
  const ref = useRef(null);

  const requested = depth ?? pageDepth ?? 'flat';
  const effective = motionAllowed && DEPTH_CLASS[requested] !== undefined ? requested : 'flat';
  const tilts = effective === 'tilt' || effective === 'float';

  useTilt(ref, tilts);

  return (
    <Tag
      ref={ref}
      className={`rounded-[var(--ui-radius-lg)] ${VARIANTS[variant] ?? VARIANTS.solid} ${DEPTH_CLASS[effective]} ${className}`}
      {...props}
    >
      {children}
      {tilts && <span className="ui-surface__glare" aria-hidden="true" />}
    </Tag>
  );
}

/**
 * Content that floats `z` px above the card face while it tilts. Inert on a
 * flat card. Note: a card with `overflow-hidden` flattens its children in 3D
 * (a browser rule), so layers only separate on cards that do not clip.
 */
export function SurfaceLayer({ z = 16, className = '', style, children, ...props }) {
  return (
    <div className={`ui-surface__layer ${className}`} style={{ '--z': `${z}px`, ...style }} {...props}>
      {children}
    </div>
  );
}
