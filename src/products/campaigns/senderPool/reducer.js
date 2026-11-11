import { SENDER_POOL_MIN, SENDER_POOL_MAX } from '../constants/constants.js';

/**
 * Pure state for "send from several accounts": which accounts are ticked. No I/O, so it is tested on its own.
 * The same rules the server enforces (2..10, no duplicates) are checked here so the button can explain itself
 * before any request is made.
 */
export const initialPoolState = { selected: [] };

export const POOL_ACTIONS = { TOGGLE: 'toggle', SET: 'set', CLEAR: 'clear' };

export function senderPoolReducer(state, action) {
  switch (action.type) {
    case POOL_ACTIONS.TOGGLE: {
      const id = String(action.id);
      const has = state.selected.includes(id);
      if (has) return { selected: state.selected.filter((x) => x !== id) };
      // The 11th tick is ignored rather than silently dropping another one; validatePool explains the limit.
      if (state.selected.length >= SENDER_POOL_MAX) return state;
      return { selected: [...state.selected, id] };
    }
    case POOL_ACTIONS.SET:
      return { selected: [...new Set((action.ids || []).map(String))].slice(0, SENDER_POOL_MAX) };
    case POOL_ACTIONS.CLEAR:
      return initialPoolState;
    default:
      return state;
  }
}

/** `{ ok, reason }`; `reason` is a short sentence for the control's title, never an error code. */
export function validatePool(selected) {
  if (selected.length < SENDER_POOL_MIN) return { ok: false, reason: `Pick at least ${SENDER_POOL_MIN} accounts to send from together.` };
  if (selected.length > SENDER_POOL_MAX) return { ok: false, reason: `Pick at most ${SENDER_POOL_MAX} accounts.` };
  return { ok: true, reason: '' };
}
