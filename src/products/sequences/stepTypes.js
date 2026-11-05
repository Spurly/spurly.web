import { Eye, UserPlus, ThumbsUp, MessageSquare, Send, Clock, Award, UserCheck, Mail, GitBranch, Hourglass, Shuffle, ScanSearch } from 'lucide-react';

/**
 * Frontend mirror of the backend's step type catalogue
 * (`spurly.backend/src/products/hub/sequences/stepTypes.js`). Kept as a
 * separate, hand-copied list rather than a shared package — same call the
 * rest of this codebase makes for its API contracts (e.g. IMPORT_FIELDS /
 * STAGEABLE_FIELDS in csv_field_mapping). If a step type or its config shape
 * changes on the backend, update both.
 */

export const WAIT_MODES = [
  { value: 'fixed', label: 'Fixed delay' },
  { value: 'until-accepted', label: 'Wait for acceptance' },
];

/**
 * `defaultConfig` seeds a freshly-added step so it renders with valid fields
 * immediately — an empty `{}` would show blank required inputs before the
 * user has touched anything, which reads as broken rather than unfilled.
 */
export const STEP_TYPES = [
  {
    value: 'profile_visit',
    label: 'Visit profile',
    icon: Eye,
    description: 'Views the lead’s profile — the "warm the lead" move before inviting.',
    defaultConfig: { notify: true },
  },
  {
    value: 'connect',
    label: 'Send connection request',
    icon: UserPlus,
    description: 'Sends an invitation, with an optional note.',
    defaultConfig: { note: '' },
  },
  {
    value: 'like_post',
    label: 'Like a recent post',
    icon: ThumbsUp,
    description: 'Reacts to the lead’s most recent post.',
    defaultConfig: {},
  },
  {
    value: 'comment_post',
    label: 'Comment on a recent post',
    icon: MessageSquare,
    description: 'Posts a real comment on the lead’s most recent post.',
    defaultConfig: { text: '' },
  },
  {
    value: 'message',
    label: 'Send a message',
    icon: Send,
    description: 'Sends a direct message. Use {{firstName}} to personalize.',
    defaultConfig: { text: '' },
  },
  {
    value: 'wait',
    label: 'Wait',
    icon: Clock,
    description: 'A fixed pause, or waiting until the lead accepts your invite.',
    defaultConfig: { mode: 'fixed', days: 2, maxDays: 7 },
  },
  {
    value: 'endorse_skill',
    label: 'Endorse a skill',
    icon: Award,
    description: 'Only works on 1st-degree connections — skipped otherwise, never failed.',
    defaultConfig: { skillName: '' },
  },
  {
    value: 'follow',
    label: 'Follow',
    icon: UserCheck,
    description: 'Follows the lead on LinkedIn. Limited to 25 a day to keep the account safe.',
    defaultConfig: {},
  },
  {
    value: 'inmail',
    label: 'Send an InMail',
    icon: Mail,
    description: 'Messages someone you are not connected to. Uses an InMail credit; skipped for 1st-degree leads.',
    defaultConfig: { subject: '', text: '' },
  },
];

/**
 * v2 (tree) nodes. They are NOT in STEP_TYPES: the flat v1 builder never offers them. They branch: a Yes list and a No list.
 * Mirror of the backend's TREE_STEP_TYPES (sequences/service/stepTypes.js).
 */
export const TREE_STEP_TYPES = [
  {
    value: 'condition',
    label: 'Condition',
    icon: GitBranch,
    description: 'Branches on something already known about the lead. Free: it uses no pacing and makes no LinkedIn call.',
    defaultConfig: { op: 'all', checks: [{ check: 'is_connected', params: {} }] },
  },
  {
    value: 'wait_for',
    label: 'Wait for event',
    icon: Hourglass,
    description: 'Waits for the lead to accept or reply. Event first goes Yes, deadline first goes No.',
    defaultConfig: { event: 'accepted', maxDays: 3 },
  },
  {
    value: 'split',
    label: 'A/B split',
    icon: Shuffle,
    description: 'Sends a share of leads down Yes and the rest down No. A lead always gets the same side.',
    defaultConfig: { ratio: 50 },
  },
];

/** v2-only action: a paced read whose answer a later condition uses. Not branching. Mirror of the backend's check_recent_posts. */
export const TREE_ACTION_TYPES = [
  {
    value: 'check_recent_posts',
    label: 'Check recent posts',
    icon: ScanSearch,
    description: 'Looks at the lead’s latest post (paced like a profile visit) so a later condition can branch on it.',
    defaultConfig: { withinDays: 30 },
  },
];

export const BRANCHING_TYPES = TREE_STEP_TYPES.map((t) => t.value);

export const STEP_TYPE_MAP = {
  ...Object.fromEntries(STEP_TYPES.map((t) => [t.value, t])),
  ...Object.fromEntries(TREE_STEP_TYPES.map((t) => [t.value, t])),
  ...Object.fromEntries(TREE_ACTION_TYPES.map((t) => [t.value, t])),
};

export const stepTypeLabel = (type) => STEP_TYPE_MAP[type]?.label ?? type;

/**
 * A fresh step for the builder — label-agnostic default type so the first
 * add always works regardless of catalogue order changes.
 */
export function makeStep(type) {
  const def = STEP_TYPE_MAP[type] ?? STEP_TYPES[0];
  return { type: def.value, config: { ...def.defaultConfig }, delayDays: 0 };
}

/**
 * Client-side mirror of the backend's `validateStep` — good enough to
 * disable "Create"/"Save" and point at what's missing, but the server is
 * still the real gate (same "server re-validates everything" pattern this
 * codebase uses everywhere else, e.g. sourcing's assertStructuredFilters).
 */
export function stepError(step) {
  const config = step?.config || {};
  switch (step?.type) {
    case 'comment_post':
      if (!config.text?.trim()) return 'Comment text is required';
      if (config.text.length > 1250) return 'Comment cannot exceed 1250 characters';
      return null;
    case 'message':
      if (!config.text?.trim()) return 'Message text is required';
      return null;
    case 'inmail':
      if (!config.text?.trim()) return 'InMail text is required';
      if (config.text.length > 1900) return 'InMail cannot exceed 1900 characters';
      if (config.subject && config.subject.length > 200) return 'Subject cannot exceed 200 characters';
      return null;
    case 'connect':
      if (config.note && config.note.length > 300) return 'Note cannot exceed 300 characters';
      return null;
    case 'wait': {
      const mode = config.mode || 'fixed';
      if (mode === 'fixed' && !(Number(config.days) > 0)) return 'Enter a number of days greater than 0';
      if (mode === 'until-accepted' && !(Number(config.maxDays) > 0)) return 'Enter a maximum number of days greater than 0';
      return null;
    }
    case 'endorse_skill':
      if (!config.skillName?.trim()) return 'Skill name is required';
      return null;
    default:
      return null;
  }
}

export function stepsError(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return 'A sequence needs at least one step';
  for (let i = 0; i < steps.length; i += 1) {
    const err = stepError(steps[i]);
    if (err) return `Step ${i + 1}: ${err}`;
  }
  return null;
}
