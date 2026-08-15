import personalizationApi from 'src/core/gateway/personalizationApi.js';
import { getToastError } from 'src/common/utils/apiError';

/**
 * Personalization Controller
 *
 * Thin orchestration over the personalization API, matching the pattern in
 * messageTemplatesController: unwrap the { success, data } envelope and throw a
 * readable Error so components can rely on the payload.
 *
 * The difference from the other controllers is error SHAPE. This feature fails
 * in several distinct, user-visible ways and each needs a different response in
 * the UI, so the thrown Error carries a `code` rather than only a message:
 *
 *   PERSONALIZATION_QUOTA_EXCEEDED  daily cap spent -> show reset time
 *   PERSONALIZATION_UNAVAILABLE     no provider answered -> offer retry
 *   INSUFFICIENT_CREDITS (402)      -> prompt to top up
 *
 * Collapsing these into one "something went wrong" is the difference between a
 * user waiting a minute and a user assuming the feature is broken.
 */

/** Template types, matching the backend and messageTemplatesController. */
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

function toError(raw, fallbackMessage) {
  const error = new Error(raw?.message || fallbackMessage);
  error.code = raw?.error || (raw?.status === 0 ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR');
  error.status = raw?.status ?? 0;
  error.fieldErrors = raw?.errors || null;
  // Present on 503s — which providers were tried and why each was passed over.
  error.attempts = raw?.attempts || null;
  return error;
}

async function call(fn, fallbackMessage) {
  let res;
  try {
    res = await fn();
  } catch (raw) {
    throw toError(raw, fallbackMessage);
  }
  if (!res?.success) throw toError(res, fallbackMessage);
  return res.data;
}

class PersonalizationController {
  /** Provider health, remaining daily quota, and whether context is filled in. */
  async getStatus() {
    return call(() => personalizationApi.status(), 'Failed to check AI availability');
  }

  /** The user's saved context, plus a preview of what the model will be told. */
  async getContext() {
    return call(() => personalizationApi.getContext(), 'Failed to load your context');
  }

  /** Save context. Partial — send only the fields that changed. */
  async saveContext(patch) {
    return call(() => personalizationApi.updateContext(patch), 'Failed to save your context');
  }

  /**
   * Write a new message, or improve an existing one.
   *
   * Which of the two happens is decided by whether `content` has anything in
   * it, and the server makes that call — so callers pass whatever is in the box
   * and get the sensible result either way.
   *
   * @param {Object} params
   * @param {string} [params.content] - current text; empty means "write one"
   * @param {'CONNECTION_REQUEST'|'DIRECT_MESSAGE'} params.type
   * @param {string} [params.templateId]
   * @param {string} [params.tone]
   * @param {string} [params.instruction]
   * @param {boolean} [params.regenerate]
   * @returns {Promise<Object>} draft, with `mode` of 'compose' or 'improve'
   */
  async compose({ content = '', type, templateId, tone, instruction = '', regenerate = false }) {
    const payload = { type, regenerate };

    // Only send set values — the server treats an empty string as a real value.
    if (content?.trim()) payload.content = content;
    if (templateId) payload.templateId = templateId;
    if (tone) payload.tone = tone;
    if (instruction?.trim()) payload.instruction = instruction.trim();

    return call(() => personalizationApi.compose(payload), 'Failed to generate a message');
  }
}

/**
 * Human-readable message for a thrown controller error, suited to a toast or
 * an inline strip. Kept next to the codes it maps so a new backend code can't
 * silently fall through to a generic string.
 *
 * The mapped codes below are curated copy and are returned as-is. Everything
 * else goes through `getToastError`, which refuses to pass a provider
 * diagnostic ("switch MODEL_NAME to …") along to someone who clicked a button.
 * That guard belongs here rather than at each call site, because this function
 * is what every AI surface reaches for.
 *
 * @param {Error} error
 * @param {string} [fallback] - Names the action that failed.
 * @returns {string}
 */
export function describeError(error, fallback = 'Something went wrong generating the message.') {
  switch (error?.code) {
    case 'PERSONALIZATION_QUOTA_EXCEEDED':
      return error.message || "You've hit today's AI limit. It resets at midnight UTC.";
    case 'PERSONALIZATION_UNAVAILABLE':
      return 'AI writing is temporarily unavailable — every provider is busy. Try again in a minute.';
    case 'NETWORK_ERROR':
      return 'Cannot reach the server. Check your connection.';
    default:
      if (error?.status === 402) {
        return 'Not enough credits to generate a message.';
      }
      return getToastError(error, fallback);
  }
}

export default new PersonalizationController();
