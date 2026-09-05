/**
 * LinkedIn connection degree.
 *
 * Stored as a number by some captures and a string by others, so everything
 * that renders it normalises through here rather than each call site guessing.
 *
 * Rendered as an ordinal, not a bare digit: a lone "3" beside a name reads as
 * part of the name, or as a count of something. "3rd" is self-describing and
 * costs one character.
 */
const LABELS = { 1: '1st', 2: '2nd', 3: '3rd' };

export function degreeLabel(value) {
  const n = Number(value);
  return LABELS[n] || null;
}

export function degreeTitle(value) {
  const label = degreeLabel(value);
  return label ? `${label}-degree connection` : undefined;
}
