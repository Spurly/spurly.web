import { relativeTime } from 'src/shared/utils/outreach';

/**
 * `relativeTime` answers "just now" under a minute, which does not take the
 * " ago" every other value wants. Same guard DateCell makes.
 */
export const sinceLabel = (value) => {
  const rel = relativeTime(value);
  return rel === 'just now' ? 'just now' : `${rel} ago`;
};
