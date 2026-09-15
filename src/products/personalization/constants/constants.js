/** Template types, matching the backend and templatesController. */
export const TEMPLATE_TYPES = {
  CONNECTION: 'CONNECTION_REQUEST',
  MESSAGE: 'DIRECT_MESSAGE',
};

/** Maps a campaign's `actionType` to the template type it needs. */
export const TYPE_FOR_ACTION = {
  connection: TEMPLATE_TYPES.CONNECTION,
  message: TEMPLATE_TYPES.MESSAGE,
};

/** Tone options offered in the UI. Mirrors TONES in the backend's prompts.js. */
export const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'warm', label: 'Warm' },
  { value: 'direct', label: 'Direct' },
  { value: 'curious', label: 'Curious' },
];

/** The fields the Settings form collects, with their limits and copy. */
export const CONTEXT_FIELDS = [
  {
    key: 'whatWeDo',
    label: 'What you do',
    placeholder: 'We build a Chrome extension that helps B2B founders run LinkedIn outreach without spreadsheets.',
    help: 'One or two sentences. This is the single most useful thing you can fill in.',
    max: 600,
    rows: 3,
  },
  {
    key: 'targetAudience',
    label: 'Who you reach out to',
    placeholder: 'Founders and heads of growth at seed to Series A B2B SaaS companies, mostly in India and the US.',
    help: 'Roles, industries, company sizes — so the AI pitches at the right level.',
    max: 400,
    rows: 2,
  },
  {
    key: 'outreachGoal',
    label: 'What you want from them',
    placeholder: "A 15-minute demo, or just to stay in touch with people building in the same space.",
    help: 'Shapes the ask at the end. Vague asks are what make outreach read as spam.',
    max: 400,
    rows: 2,
  },
  {
    key: 'voiceRules',
    label: "Do's and don'ts",
    placeholder: "Never say 'synergy' or 'circle back'. Keep it under three sentences. Mention we're YC-backed.",
    help: 'Anything you want it to always or never do. These override the built-in rules.',
    max: 600,
    rows: 3,
  },
];

/**
 * Events the personalization controller emits and the personalization
 * hooks/components listen for.
 */
export const PERSONALIZATION_EVENTS = {
  STATUS_SUCCESS: 'PERSONALIZATION_STATUS_SUCCESS',
  STATUS_FAILURE: 'PERSONALIZATION_STATUS_FAILURE',
  CONTEXT_SUCCESS: 'PERSONALIZATION_CONTEXT_SUCCESS',
  CONTEXT_FAILURE: 'PERSONALIZATION_CONTEXT_FAILURE',
  SAVE_CONTEXT_SUCCESS: 'PERSONALIZATION_SAVE_CONTEXT_SUCCESS',
  SAVE_CONTEXT_FAILURE: 'PERSONALIZATION_SAVE_CONTEXT_FAILURE',
  COMPOSE_SUCCESS: 'PERSONALIZATION_COMPOSE_SUCCESS',
  COMPOSE_FAILURE: 'PERSONALIZATION_COMPOSE_FAILURE',
};
