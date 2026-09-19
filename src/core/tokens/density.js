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
  /*
   * v2 raised every step. The old `default` (36px rows, 13px text) was
   * drawn for a near-monochrome power tool; the system this app actually
   * wants is airier, and a lead row carrying an avatar, a name and a
   * headline was cramped at 36.
   *
   * `compact` is not vestigial: it is 36px, i.e. exactly the old default,
   * and it is what the admin tables want when you are scanning hundreds
   * of rows of users or transactions rather than reading people.
   *
   * padX matches --ui-pad-x (16) so the first column header lands on the
   * same vertical line as everything else in the card.
   */
  compact: {
    row: 44,
    header: 40,
    padX: 14,
    fontSize: 13,
    avatar: 24,
  },
  /*
   * v3 (Blue identity): 58px rows, 44px header, 14px gutters, 13px cells.
   * The fit meter and the two-line name cell (name over headline) need the
   * extra height — spurlyDESIGN.md, "Density".
   */
  default: {
    row: 58,
    header: 44,
    padX: 14,
    fontSize: 13,
    avatar: 30,
  },
  comfortable: {
    row: 64,
    header: 44,
    padX: 16,
    fontSize: 13,
    avatar: 32,
  },
};

export const DEFAULT_DENSITY = 'default';

export function resolveDensity(name) {
  return DENSITY[name] || DENSITY[DEFAULT_DENSITY];
}
