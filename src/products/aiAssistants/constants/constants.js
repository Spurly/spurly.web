/** The address people paste into Claude, ChatGPT or Cursor. */
export const MCP_URL = import.meta.env.VITE_MCP_URL || 'https://api.getspurly.com/mcp';

/** What each permission means, in the words the user sees. Order is lowest to highest risk. */
export const SCOPE_INFO = {
  read: { label: 'Read', hint: 'See your campaigns, leads, inbox and numbers. Cannot change anything.' },
  draft: { label: 'Draft', hint: 'Create campaigns, sequences and templates as drafts. Nothing is sent or started.' },
  act: { label: 'Act', hint: 'Start campaigns, send messages and answer invitations. Also needs the switch below to be on.' },
};
export const SCOPE_ORDER = ['read', 'draft', 'act'];
export const DEFAULT_SCOPES = ['read', 'draft'];

export const EXPIRY_OPTIONS = [
  ['30', '30 days'],
  ['90', '90 days'],
  ['365', '1 year'],
  ['', 'Never'],
];

/** Events the aiAssistants controller emits and its hooks listen for. */
export const AI_EVENTS = {
  TOKENS_SUCCESS: 'AI_TOKENS_SUCCESS',
  TOKENS_FAILURE: 'AI_TOKENS_FAILURE',
  CREATE_SUCCESS: 'AI_TOKEN_CREATE_SUCCESS',
  CREATE_FAILURE: 'AI_TOKEN_CREATE_FAILURE',
  REVOKE_SUCCESS: 'AI_TOKEN_REVOKE_SUCCESS',
  REVOKE_FAILURE: 'AI_TOKEN_REVOKE_FAILURE',
  APPS_SUCCESS: 'AI_APPS_SUCCESS',
  APPS_FAILURE: 'AI_APPS_FAILURE',
  DISCONNECT_SUCCESS: 'AI_APP_DISCONNECT_SUCCESS',
  DISCONNECT_FAILURE: 'AI_APP_DISCONNECT_FAILURE',
  SWITCH_SUCCESS: 'AI_SWITCH_SUCCESS',
  SWITCH_FAILURE: 'AI_SWITCH_FAILURE',
  ACTIVITY_SUCCESS: 'AI_ACTIVITY_SUCCESS',
  ACTIVITY_FAILURE: 'AI_ACTIVITY_FAILURE',
  CONSENT_INFO_SUCCESS: 'AI_CONSENT_INFO_SUCCESS',
  CONSENT_INFO_FAILURE: 'AI_CONSENT_INFO_FAILURE',
  CONSENT_SUCCESS: 'AI_CONSENT_SUCCESS',
  CONSENT_FAILURE: 'AI_CONSENT_FAILURE',
};
