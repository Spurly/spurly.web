const PALETTE_SIZE = 8;

/**
 * Stable colour for a person or company, derived from their name.
 *
 * Determinism is the whole point: the same name must produce the same colour in
 * every session and on every machine, or the colour is noise rather than a cue.
 * Never seed this with an array index or a row id.
 *
 * djb2 accumulates, then a 32-bit avalanche finalizer mixes the result. The
 * finalizer isn't optional — `% 8` reads only the low three bits, and djb2's
 * low bits barely move between similar short strings. Without it a real list of
 * names piles into three or four slots and half the palette never appears.
 */
function hash(input) {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }

  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;

  return h >>> 0;
}

export function identityColor(name) {
  const key = (name || '').trim().toLowerCase();
  if (!key) return { bg: 'var(--ui-surface-active)', fg: 'var(--ui-text-secondary)' };

  const slot = (hash(key) % PALETTE_SIZE) + 1;
  return { bg: `var(--ui-av-${slot}-bg)`, fg: `var(--ui-av-${slot}-fg)` };
}
