import personalizationApi from '../gateway/personalization.js';
import { getToastError } from 'src/shared/utils/apiError';
import { PERSONALIZATION_EVENTS } from '../constants/constants.js';

/**
 * Personalization Controller
 *
 * Thin orchestration over the personalization API. Every method is a plain
 * async function taking the caller's `eventEmitter` first and reporting the
 * outcome by emitting an event instead of returning/throwing — try/catch and
 * async/await live here (and in the gateway) only.
 *
 * The difference from the other controllers is error SHAPE. This feature fails
 * in several distinct, user-visible ways and each needs a different response in
 * the UI, so the error emitted on failure carries a `code` rather than only a
 * message:
 *
 *   PERSONALIZATION_QUOTA_EXCEEDED  daily cap spent -> show reset time
 *   PERSONALIZATION_UNAVAILABLE     no provider answered -> offer retry
 *   INSUFFICIENT_CREDITS (402)      -> prompt to top up
 *
 * Collapsing these into one "something went wrong" is the difference between a
 * user waiting a minute and a user assuming the feature is broken.
 */

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

/** Emits STATUS_SUCCESS with provider health/quota/context data, or STATUS_FAILURE. */
async function getStatus(eventEmitter) {
  try {
    const data = await call(() => personalizationApi.status(), 'Failed to check AI availability');
    eventEmitter.emit(PERSONALIZATION_EVENTS.STATUS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(PERSONALIZATION_EVENTS.STATUS_FAILURE, error);
  }
}

/** Emits CONTEXT_SUCCESS with the saved context, or CONTEXT_FAILURE. */
async function getContext(eventEmitter) {
  try {
    const data = await call(() => personalizationApi.getContext(), 'Failed to load your context');
    eventEmitter.emit(PERSONALIZATION_EVENTS.CONTEXT_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(PERSONALIZATION_EVENTS.CONTEXT_FAILURE, error);
  }
}

/** Save context. Partial — send only the fields that changed. Emits SAVE_CONTEXT_SUCCESS/FAILURE. */
async function saveContext(eventEmitter, patch) {
  try {
    const data = await call(() => personalizationApi.updateContext(patch), 'Failed to save your context');
    eventEmitter.emit(PERSONALIZATION_EVENTS.SAVE_CONTEXT_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(PERSONALIZATION_EVENTS.SAVE_CONTEXT_FAILURE, error);
  }
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
 * @param {string} [params.recipientName] - set ONLY for a reply to one open
 *   inbox thread (see AiWriteButton's use in Thread.jsx). Its presence tells
 *   the server this is a one-off reply to a known person, not a campaign
 *   template — the server then writes literal text instead of {{tokens}},
 *   since nothing fills a token in outside a campaign send.
 * Emits COMPOSE_SUCCESS with the draft ({ text, mode, ... }), or COMPOSE_FAILURE.
 */
async function compose(eventEmitter, { content = '', type, templateId, tone, instruction = '', regenerate = false, recipientName = '' }) {
  try {
    const payload = { type, regenerate };

    // Only send set values — the server treats an empty string as a real value.
    if (content?.trim()) payload.content = content;
    if (templateId) payload.templateId = templateId;
    if (tone) payload.tone = tone;
    if (instruction?.trim()) payload.instruction = instruction.trim();
    if (recipientName?.trim()) payload.recipientName = recipientName.trim();

    const data = await call(() => personalizationApi.compose(payload), 'Failed to generate a message');
    eventEmitter.emit(PERSONALIZATION_EVENTS.COMPOSE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(PERSONALIZATION_EVENTS.COMPOSE_FAILURE, error);
  }
}

/**
 * Human-readable message for an error emitted on a *_FAILURE event, suited to
 * a toast or an inline strip. Kept next to the codes it maps so a new backend
 * code can't silently fall through to a generic string.
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

const personalizationController = { getStatus, getContext, saveContext, compose };
export default personalizationController;
