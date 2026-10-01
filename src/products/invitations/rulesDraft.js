import { WITHDRAW_DAYS } from './constants/constants.js';
import { invitationsStrings } from '../pages/invitations/strings.js';

const t = invitationsStrings.rules;

export const parseKeywords = (text) => [...new Set(String(text).split(',').map((k) => k.trim().toLowerCase()).filter(Boolean))];

/** Client mirror of the server's rule validation: points at what is missing; the server is still the gate. */
export function rulesError(draft) {
  const days = Number(draft.afterDays);
  if (!Number.isInteger(days) || days < WITHDRAW_DAYS.min || days > WITHDRAW_DAYS.max) return t.daysRange;
  if (draft.acceptEnabled && !draft.acceptAll && parseKeywords(draft.keywordsText).length === 0) return t.needKeywords;
  return null;
}
