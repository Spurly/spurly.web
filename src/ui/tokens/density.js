/**
 * Table density.
 *
 * Row height is a token, not cell padding. This is the whole reason the old
 * table produced 240px rows next to 40px ones: height was whatever the tallest
 * cell's content decided. Here it is fixed up front and every part reads it.
 */
export const DENSITY = {
  compact: {
    row: 32,
    header: 30,
    padX: 10,
    fontSize: 12.5,
    avatar: 20,
  },
  default: {
    row: 38,
    header: 34,
    padX: 12,
    fontSize: 13,
    avatar: 22,
  },
  comfortable: {
    row: 46,
    header: 38,
    padX: 14,
    fontSize: 13.5,
    avatar: 26,
  },
};

export const DEFAULT_DENSITY = 'default';

export function resolveDensity(name) {
  return DENSITY[name] || DENSITY[DEFAULT_DENSITY];
}
