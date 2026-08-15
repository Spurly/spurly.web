/**
 * Table density. Source of truth for row and header height.
 *
 * Row height is a token, not cell padding. This is the whole reason the old
 * table produced 240px rows next to 40px ones: height was whatever the tallest
 * cell's content decided. Here it is fixed up front and every part reads it.
 *
 * Two things changed from the first version:
 *
 *   - `header` is now TALLER than `row`, not shorter. A header 4px shorter
 *     than its rows reads as an afterthought rather than a frame. It also now
 *     equals --ui-band (40), so the table header lines up with the toolbar
 *     above it and the pagination below it.
 *
 *   - `fontSize` snaps to the six-step type scale. 12.5 and 13.5 were not
 *     perceptibly different from 13 — they only added variance.
 *
 * `padX` is deliberately 12 at default so it matches --ui-pad-x, which is what
 * the page header aligns against.
 */
export const DENSITY = {
  compact: {
    row: 32,
    header: 36,
    padX: 12,
    fontSize: 12,
    avatar: 20,
  },
  default: {
    row: 36,
    header: 40,
    padX: 12,
    fontSize: 13,
    avatar: 22,
  },
  comfortable: {
    row: 44,
    header: 40,
    padX: 12,
    fontSize: 13,
    avatar: 26,
  },
};

export const DEFAULT_DENSITY = 'default';

export function resolveDensity(name) {
  return DENSITY[name] || DENSITY[DEFAULT_DENSITY];
}
