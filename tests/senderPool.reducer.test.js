import { describe, it, expect } from 'vitest';
import { senderPoolReducer, initialPoolState, validatePool, POOL_ACTIONS } from 'src/products/campaigns/senderPool/reducer.js';
import { SENDER_POOL_MIN, SENDER_POOL_MAX } from 'src/products/campaigns/constants/constants.js';

const toggle = (state, id) => senderPoolReducer(state, { type: POOL_ACTIONS.TOGGLE, id });

describe('sender pool reducer (M6.1)', () => {
  it('toggles an account on and off, keeping order and no duplicates', () => {
    let s = toggle(initialPoolState, 'a');
    s = toggle(s, 'b');
    expect(s.selected).toEqual(['a', 'b']);
    s = toggle(s, 'a');
    expect(s.selected).toEqual(['b']);
  });

  it('treats numeric and string ids alike', () => {
    expect(toggle(toggle(initialPoolState, 1), '1').selected).toEqual([]);
  });

  it('never grows past the maximum', () => {
    let s = initialPoolState;
    for (let i = 0; i < SENDER_POOL_MAX + 3; i += 1) s = toggle(s, `a${i}`);
    expect(s.selected).toHaveLength(SENDER_POOL_MAX);
  });

  it('validates 2..10 with a sentence, never a code', () => {
    expect(validatePool([]).ok).toBe(false);
    expect(validatePool(['a']).ok).toBe(false);
    expect(validatePool(['a']).reason).toMatch(new RegExp(`at least ${SENDER_POOL_MIN}`));
    expect(validatePool(['a', 'b']).ok).toBe(true);
    expect(validatePool(Array.from({ length: SENDER_POOL_MAX }, (_, i) => `a${i}`)).ok).toBe(true);
    const tooMany = validatePool(Array.from({ length: SENDER_POOL_MAX + 1 }, (_, i) => `a${i}`));
    expect(tooMany.ok).toBe(false);
    expect(tooMany.reason).toMatch(new RegExp(`at most ${SENDER_POOL_MAX}`));
  });

  it('set de-duplicates and clamps; clear empties', () => {
    expect(senderPoolReducer(initialPoolState, { type: POOL_ACTIONS.SET, ids: ['a', 'a', 'b'] }).selected).toEqual(['a', 'b']);
    expect(senderPoolReducer({ selected: ['a'] }, { type: POOL_ACTIONS.CLEAR })).toEqual(initialPoolState);
    expect(senderPoolReducer({ selected: ['a'] }, { type: 'nope' }).selected).toEqual(['a']);
  });
});
