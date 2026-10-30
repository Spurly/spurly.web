/**
 * OpenAPI 3.1 description of the Spurly LinkedIn API (/v1).
 *
 * THE single source of truth for the developer docs: every endpoint, parameter
 * table, response table, object definition, webhook payload and code sample on
 * /developers is rendered from this object, and scripts/buildOpenApi.mjs
 * publishes it as /developers/openapi.json for codegen and Postman.
 *
 * Keep it in step with spurly.backend src/products/hub/partnerApi (routes.js,
 * service/shape.js, constants). A field added there is not documented until it
 * is added here.
 */

const ID = { type: 'string', pattern: '^[a-f0-9]{24}$' };
const TS = { type: ['string', 'null'], format: 'date-time' };

const ex = {
  accountId: '6719f0c2a1b2c3d4e5f60718',
  chatId: '6719f1aa3c4d5e6f70811223',
  messageId: '6719f2bb4d5e6f7081122334',
  eventId: 'evt_6719f2c0a1b2c3d4e5f60799',
};

const exampleLinkedin = {
  state: 'connected',
  name: 'Jane Doe',
  profileUrl: 'https://www.linkedin.com/in/janedoe',
  isPremium: false,
  connectedAt: '2026-10-24T06:00:00.000Z',
};
const exampleAccount = {
  id: ex.accountId,
  externalId: 'user_123:1',
  name: 'Jane Doe',
  status: 'open',
  closedAt: null,
  linkedin: exampleLinkedin,
  directLogin: false,
  createdAt: '2026-10-24T05:58:00.000Z',
};
const exampleChat = {
  id: ex.chatId,
  name: 'Bob Smith',
  headline: 'CTO at Acme',
  profileUrl: 'https://www.linkedin.com/in/bobsmith',
  pictureUrl: 'https://media.licdn.com/dms/image/example.jpg',
  connectionDegree: 1,
  unreadCount: 2,
  lastMessageAt: '2026-10-24T06:09:00.000Z',
  lastMessageText: 'Sounds good, talk Monday.',
  lastMessageDirection: 'inbound',
  readOnly: false,
};
const exampleMessage = {
  id: ex.messageId,
  chatId: ex.chatId,
  direction: 'inbound',
  text: 'Sounds good, talk Monday.',
  sentAt: '2026-10-24T06:09:00.000Z',
  delivered: true,
  seen: false,
  seenAt: null,
  edited: false,
  deleted: false,
  attachments: [],
  reactions: [],
};
const exampleOutbound = { ...exampleMessage, id: '6719f2cc5e6f708112233445', direction: 'outbound', text: 'Thanks Bob, talk Monday.', sentAt: '2026-10-24T06:12:00.000Z', seen: false };
const examplePagination = { page: 1, limit: 30, total: 45 };

/** `{ success: true, data }` around a schema. */
function envelope(dataSchema) {
  return {
    type: 'object',
    required: ['success', 'data'],
    properties: { success: { type: 'boolean', const: true }, data: dataSchema },
  };
}
function ok(description, dataSchema, dataExample) {
  return {
    description,
    content: { 'application/json': { schema: envelope(dataSchema), example: { success: true, data: dataExample } } },
  };
}
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const errors = (...names) => Object.fromEntries(names.map((n) => [n.split(':')[0], { $ref: `#/components/responses/${n.split(':')[1]}` }]));
const COMMON = errors('401:Unauthorized', '429:RateLimited', '500:ServerError');
const SIGN_IN_ERRORS = errors('400:ValidationError', '404:NotFound', '409:Conflict', '410:Expired', '422:SignInError');

const accountIdParam = { $ref: '#/components/parameters/accountId' };
const chatIdParam = { $ref: '#/components/parameters/chatId' };
const messageIdParam = { $ref: '#/components/parameters/messageId' };

const connectResult = {
  description: 'The next state of the sign-in.',
  content: {
    'application/json': {
      schema: envelope(ref('ConnectResult')),
      examples: {
        connected: { summary: 'Connected', value: { success: true, data: { state: 'connected', account: exampleAccount } } },
        checkpoint: {
          summary: 'LinkedIn asks for a code',
          value: { success: true, data: { state: 'checkpoint', checkpoint: { type: 'OTP', expiresAt: null }, account: { ...exampleAccount, linkedin: { ...exampleLinkedin, state: 'not_connected', name: '', profileUrl: '', connectedAt: null } } } },
        },
      },
    },
  },
};

export const OPENAPI = {
  openapi: '3.1.0',
  info: {
    title: 'Spurly LinkedIn API',
    version: '1.0.0',
    summary: 'Connect LinkedIn accounts, sync the inbox, and send and receive LinkedIn messages in real time.',
    description:
      'The Spurly LinkedIn API lets your product connect your users\' LinkedIn accounts, sync their inbox and send and receive messages. Spurly runs the LinkedIn sign-in, verification, history sync and live delivery.',
    contact: { name: 'Spurly', email: 'founders@getspurly.com', url: 'https://www.getspurly.com/developers' },
  },
  servers: [{ url: 'https://api.getspurly.com/v1', description: 'Production' }],
  security: [{ apiKey: [] }],
  tags: [
    { name: 'Accounts', description: 'One account per user of yours whose LinkedIn you connect.' },
    { name: 'LinkedIn connection', description: 'Sign a LinkedIn account in, handle verification, disconnect.' },
    { name: 'Inbox', description: 'Sync status, conversations and messages.' },
    { name: 'Messages', description: 'Send messages, files and reactions; download attachments.' },
    { name: 'Webhooks', description: 'Manage your webhook and read the event feed.' },
  ],
  paths: {
    '/accounts': {
      post: {
        operationId: 'createAccount',
        tags: ['Accounts'],
        summary: 'Create or fetch an account',
        description:
          'Creates the account for `externalId`, or returns the existing one. Idempotent: retrying is safe. The first call answers `201`, later calls `200` with the same account. Creating an `externalId` whose account was closed reopens it: the response is `200`, `reopened` is `true`, and `status` is `open` again. A reopened account must reconnect LinkedIn.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['externalId'],
                properties: {
                  externalId: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9._:@-]+$', description: 'Your own id for one LinkedIn profile, not for a person: a person with several profiles gets one account each (for example `<partnerUserId>:<linkedinSlotId>`). Reusing the id on a reconnect returns the same account. Letters, digits and `. _ : @ -`.' },
                  name: { type: 'string', maxLength: 100, description: 'A display name, for your reference. Once the profile connects, Spurly shows the LinkedIn name instead.' },
                },
              },
              example: { externalId: 'user_123:1', name: 'Jane Doe' },
            },
          },
        },
        responses: {
          201: ok('Created.', { type: 'object', properties: { account: ref('Account') } }, { account: exampleAccount }),
          200: ok('Already existed (or was reopened); the account is returned. `reopened` is `true` only when a closed account was reopened.', { type: 'object', properties: { account: ref('Account'), reopened: { type: 'boolean' } } }, { account: exampleAccount }),
          ...errors('400:ValidationError'),
          ...COMMON,
        },
      },
      get: {
        operationId: 'listAccounts',
        tags: ['Accounts'],
        summary: 'List accounts',
        description: 'Your accounts, newest first.',
        parameters: [{ $ref: '#/components/parameters/page' }, { $ref: '#/components/parameters/limit30' }],
        responses: {
          200: ok('A page of accounts.', { type: 'object', properties: { accounts: { type: 'array', items: ref('Account') }, pagination: ref('Pagination') } }, { accounts: [exampleAccount], pagination: { page: 1, limit: 30, total: 1 } }),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}': {
      get: {
        operationId: 'getAccount',
        tags: ['Accounts'],
        summary: 'Get an account',
        description: 'The account and its live LinkedIn connection state.',
        parameters: [accountIdParam],
        responses: {
          200: ok('The account.', { type: 'object', properties: { account: ref('Account') } }, { account: exampleAccount }),
          ...errors('404:NotFound'),
          ...COMMON,
        },
      },
      delete: {
        operationId: 'closeAccount',
        tags: ['Accounts'],
        summary: 'Close an account',
        description:
          'Ends access for the account and disconnects its LinkedIn connection. Idempotent: closing a closed account returns it unchanged. The account stays readable with `status: closed`; every other call on it answers `409 ACCOUNT_CLOSED`. To reopen it, `POST /accounts` with the same `externalId`. If LinkedIn cannot be disconnected right now the account is still closed and the call answers `502 DISCONNECT_FAILED`; send `DELETE` again to finish.',
        parameters: [accountIdParam],
        responses: {
          200: ok('Closed.', { type: 'object', properties: { account: ref('Account') } }, { account: { ...exampleAccount, status: 'closed', closedAt: '2026-10-28T09:00:00.000Z', linkedin: { state: 'not_connected', name: '', profileUrl: '', isPremium: false, connectedAt: null } } }),
          502: { description: 'The account is closed, but LinkedIn could not be disconnected yet. Send `DELETE` again.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'The account is closed, but LinkedIn could not be disconnected yet. Send DELETE again to finish.', code: 'DISCONNECT_FAILED', status: 502 } } } },
          ...errors('404:NotFound'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/login': {
      delete: {
        operationId: 'removeDirectLogin',
        tags: ['Accounts'],
        summary: 'Remove a direct login',
        description:
          'A person who opened an account with an Open in Spurly link can set up their own Spurly sign-in (their email and a password, confirmed by a code). This removes it: the email and password stop working, and so does Google sign-in with that address. The account, its data and your Open in Spurly links are untouched; a session already open ends within 12 hours. Idempotent: `removed` is `false` when there was nothing to remove. Works on closed accounts too.',
        parameters: [accountIdParam],
        responses: {
          200: ok('Removed (or there was nothing to remove).', { type: 'object', properties: { removed: { type: 'boolean' }, account: ref('Account') } }, { removed: true, account: exampleAccount }),
          ...errors('404:NotFound'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/login-link': {
      post: {
        operationId: 'createLoginLink',
        tags: ['Accounts'],
        summary: 'Create an Open in Spurly link',
        description:
          'Returns a one-time link that signs the person into this account in the Spurly web app for 12 hours. Redirect them to `url` straight away: the link works once and expires after 120 seconds. **Access control is yours**: the link is the only way into the account, so issue it only to people entitled to that account. Sending `actor` is strongly recommended so every link can be traced to a person. A closed account answers `409 ACCOUNT_CLOSED`; another partner\'s account is a `404`.',
        parameters: [accountIdParam],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  actor: { type: 'string', maxLength: 200, description: 'Your own id or email for the person you are opening the account for. Recorded with the link for your audit trail; never shown to them.' },
                },
              },
              example: { actor: 'user_123' },
            },
          },
        },
        responses: {
          200: ok('The link.', { type: 'object', properties: { url: { type: 'string', description: 'Send the person here. The ticket is in the URL fragment.' }, expiresAt: { type: 'string', format: 'date-time' } } }, { url: 'https://getspurly.com/partner/enter#t=3f9c…', expiresAt: '2026-10-28T09:02:00.000Z' }),
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          ...COMMON,
        },
      },
    },
    '/linkedin/connect-options': {
      get: {
        operationId: 'getConnectOptions',
        tags: ['LinkedIn connection'],
        summary: 'Get sign-in options',
        description: 'The country LinkedIn will see the sign-in from when location is automatic. Use it to label that choice in your form.',
        parameters: [{ name: 'endUserIp', in: 'query', required: false, schema: { type: 'string' }, example: '49.36.1.1', description: 'The person\'s own IP address.' }],
        responses: {
          200: ok('Options.', { type: 'object', properties: { detectedCountry: { type: ['string', 'null'], description: 'ISO 3166-1 alpha-2 country code.' } } }, { detectedCountry: 'IN' }),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/linkedin/connect': {
      post: {
        operationId: 'connectLinkedin',
        tags: ['LinkedIn connection'],
        summary: 'Connect LinkedIn',
        description:
          'Signs a LinkedIn account in with email and password, or with a session cookie. Answers `connected`, or `checkpoint` when LinkedIn asks for verification. The password or cookie is used once and never stored. Reconnecting an account in `needs_reconnect` uses this same call. On an account whose person set up a direct login, connecting a different LinkedIn profile is refused with `409 DIFFERENT_PROFILE` (it is disconnected at once): create a new account for that profile.',
        parameters: [accountIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('ConnectRequest'),
              examples: {
                credentials: {
                  summary: 'Email and password',
                  value: { method: 'credentials', username: 'jane@acme.com', password: 'their-password', endUserIp: '49.36.1.1', sync: { chats: true, messages: true }, location: { mode: 'auto' } },
                },
                cookies: {
                  summary: 'Session cookie',
                  value: { method: 'cookies', accessToken: 'AQEDAR...li_at value', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', endUserIp: '49.36.1.1' },
                },
              },
            },
          },
        },
        responses: { 200: connectResult, ...SIGN_IN_ERRORS, ...COMMON },
      },
      delete: undefined,
    },
    '/accounts/{accountId}/linkedin/checkpoint': {
      post: {
        operationId: 'solveCheckpoint',
        tags: ['LinkedIn connection'],
        summary: 'Submit a verification code',
        description: 'For checkpoint types `OTP` and `2FA`, the code LinkedIn sent. For `PHONE_REGISTER`, the phone number to add, written `(+91)9876543210`; LinkedIn then texts a code, answered as an `OTP` checkpoint. May answer another checkpoint; continue until `connected`.',
        parameters: [accountIdParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string', description: 'The code LinkedIn sent, or for `PHONE_REGISTER` the phone number as `(+<country code>)<number>`.' } } }, example: { code: '123456' } } },
        },
        responses: { 200: connectResult, ...SIGN_IN_ERRORS, ...COMMON },
      },
    },
    '/accounts/{accountId}/linkedin/checkpoint/status': {
      post: {
        operationId: 'pollCheckpoint',
        tags: ['LinkedIn connection'],
        summary: 'Check an app approval',
        description: 'For checkpoint type `IN_APP_VALIDATION` (the person approves the sign-in in the LinkedIn app). Call every 3 to 5 seconds, or wait for the `account.updated` webhook.',
        parameters: [accountIdParam],
        responses: { 200: connectResult, ...SIGN_IN_ERRORS, ...COMMON },
      },
    },
    '/accounts/{accountId}/linkedin/checkpoint/another-way': {
      post: {
        operationId: 'checkpointAnotherWay',
        tags: ['LinkedIn connection'],
        summary: 'Try another verification method',
        description: 'Asks LinkedIn for a different verification method. Answers the new checkpoint. `NO_ALTERNATIVE` when there is none.',
        parameters: [accountIdParam],
        responses: { 200: connectResult, ...SIGN_IN_ERRORS, ...COMMON },
      },
    },
    '/accounts/{accountId}/linkedin/checkpoint/resend': {
      post: {
        operationId: 'resendCheckpoint',
        tags: ['LinkedIn connection'],
        summary: 'Resend the verification code',
        parameters: [accountIdParam],
        responses: {
          200: ok('Sent again.', { type: 'object', properties: { resent: { type: 'boolean' } } }, { resent: true }),
          ...SIGN_IN_ERRORS,
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/linkedin': {
      delete: {
        operationId: 'disconnectLinkedin',
        tags: ['LinkedIn connection'],
        summary: 'Disconnect LinkedIn',
        description: 'Signs the LinkedIn account out of Spurly. Conversations already synced stay readable. Connect again at any time.',
        parameters: [accountIdParam],
        responses: {
          200: ok('Disconnected.', { type: 'object', properties: { account: ref('Account') } }, { account: { ...exampleAccount, linkedin: { state: 'not_connected', name: '', profileUrl: '', isPremium: false, connectedAt: null } } }),
          ...errors('404:NotFound'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/inbox': {
      get: {
        operationId: 'getInboxStatus',
        tags: ['Inbox'],
        summary: 'Get inbox status',
        description: 'Counts and the state of the history sync. Use it to explain an empty inbox while the first sync runs, and to spot a LinkedIn connection that needs attention: `sync.status` `failed` means the person has to reconnect LinkedIn, and new messages will not arrive until they do.',
        parameters: [accountIdParam],
        responses: {
          200: ok('Inbox status.', ref('InboxStatus'), {
            connected: true, chats: 45, unread: 3, historyPending: 0,
            sync: { status: 'done', phase: 'done', chatsSeen: 45, messagesImported: 326, lastRunAt: '2026-10-24T06:05:00.000Z', firstCompletedAt: '2026-10-24T06:03:00.000Z', error: '' },
            liveFeedSeenAt: '2026-10-24T06:10:00.000Z',
          }),
          ...errors('404:NotFound'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/inbox/sync': {
      post: {
        operationId: 'syncInbox',
        tags: ['Inbox'],
        summary: 'Sync the inbox',
        description: 'Queues a history sync. Rarely needed: a sync starts on its own when LinkedIn connects or reconnects, and new messages arrive live. It does not fix a LinkedIn connection that needs attention.',
        parameters: [accountIdParam],
        responses: {
          202: ok('Queued.', { type: 'object', properties: { queued: { type: 'boolean' }, message: { type: 'string' } } }, { queued: true, message: 'Inbox sync queued. It runs in the background and fills in as it goes.' }),
          ...errors('404:NotFound', '409:Conflict'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/chats': {
      get: {
        operationId: 'listChats',
        tags: ['Inbox'],
        summary: 'List conversations',
        description: 'Most recently active first, one conversation per person. Archived conversations are not returned. The inbox holds the newest 300 conversations of the account; read pages until `pagination.total` is reached.',
        parameters: [
          accountIdParam,
          { name: 'unread', in: 'query', required: false, schema: { type: 'boolean', default: false }, description: 'Only conversations with unread messages.' },
          { name: 'q', in: 'query', required: false, schema: { type: 'string' }, description: 'Search the person\'s name and the last message.' },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit30' },
        ],
        responses: {
          200: ok('A page of conversations.', { type: 'object', properties: { chats: { type: 'array', items: ref('Chat') }, pagination: ref('Pagination') } }, { chats: [exampleChat], pagination: examplePagination }),
          ...errors('404:NotFound'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/chats/{chatId}': {
      get: {
        operationId: 'getChat',
        tags: ['Inbox'],
        summary: 'Get a conversation and its messages',
        description: 'Page 1 holds the most recent messages. Inside a page, messages run oldest to newest.',
        parameters: [
          accountIdParam,
          chatIdParam,
          { $ref: '#/components/parameters/page' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 }, description: 'Messages per page.' },
        ],
        responses: {
          200: ok('The conversation.', {
            type: 'object',
            properties: {
              chat: ref('Chat'),
              messages: { type: 'array', items: ref('Message') },
              pagination: ref('Pagination'),
              historyPending: { type: 'boolean', description: 'True while the history sync has not reached this conversation\'s older messages.' },
            },
          }, { chat: exampleChat, messages: [exampleMessage], pagination: { page: 1, limit: 50, total: 12 }, historyPending: false }),
          ...errors('404:NotFound'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/chats/{chatId}/read': {
      post: {
        operationId: 'markChatRead',
        tags: ['Inbox'],
        summary: 'Mark a conversation read',
        description: 'Clears the unread count in Spurly. Does not send a read receipt on LinkedIn.',
        parameters: [accountIdParam, chatIdParam],
        responses: { 200: ok('Done.', { type: 'object', properties: { ok: { type: 'boolean' } } }, { ok: true }), ...errors('404:NotFound'), ...COMMON },
      },
    },
    '/accounts/{accountId}/chats/{chatId}/messages': {
      post: {
        operationId: 'sendMessage',
        tags: ['Messages'],
        summary: 'Reply in a conversation',
        description: 'Sent immediately. Not retry-safe: on `SEND_UNCONFIRMED`, check the conversation before sending again.',
        parameters: [accountIdParam, chatIdParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['text'], properties: { text: { type: 'string', minLength: 1, maxLength: 8000 } } }, example: { text: 'Thanks Bob, talk Monday.' } } },
        },
        responses: {
          201: ok('Sent.', { type: 'object', properties: { sent: { type: 'boolean' }, message: ref('Message') } }, { sent: true, message: exampleOutbound }),
          ...errors('400:ValidationError', '404:NotFound', '409:Conflict', '502:SendFailed'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/conversations': {
      post: {
        operationId: 'startConversation',
        tags: ['Messages'],
        summary: 'Message someone new',
        description:
          'Sends a first message to a LinkedIn member. If a conversation with that person already exists, the message goes into it and `created` is false. LinkedIn only allows messaging 1st-degree connections and open profiles.',
        parameters: [accountIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['profile', 'text'],
                properties: {
                  profile: { type: 'string', description: 'A LinkedIn profile URL or public identifier.' },
                  text: { type: 'string', minLength: 1, maxLength: 8000 },
                },
              },
              example: { profile: 'https://www.linkedin.com/in/bobsmith', text: 'Hi Bob, great meeting you today.' },
            },
          },
        },
        responses: {
          201: ok('Sent.', {
            type: 'object',
            properties: { sent: { type: 'boolean' }, created: { type: 'boolean', description: 'True when a new conversation was started.' }, chat: ref('Chat'), message: ref('Message') },
          }, { sent: true, created: true, chat: { ...exampleChat, unreadCount: 0, lastMessageDirection: 'outbound' }, message: { ...exampleOutbound, text: 'Hi Bob, great meeting you today.' } }),
          ...errors('400:ValidationError', '404:NotFound', '409:Conflict', '502:SendFailed'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/chats/{chatId}/media': {
      post: {
        operationId: 'sendMedia',
        tags: ['Messages'],
        summary: 'Send a file, voice note or video',
        description:
          'The request body is the raw file; set its `Content-Type`. Limits: `attachment` up to 20 MB (PDF, Word, Excel, PowerPoint, plain text, CSV, PNG, JPEG, GIF, WebP); `voice` up to 10 MB (M4A); `video` up to 50 MB (MP4, MOV).',
        parameters: [
          accountIdParam,
          chatIdParam,
          { name: 'kind', in: 'query', required: true, schema: { type: 'string', enum: ['attachment', 'voice', 'video'], default: 'attachment' }, example: 'attachment' },
          { name: 'filename', in: 'query', required: false, schema: { type: 'string' }, example: 'proposal.pdf', description: 'The file name the recipient sees.' },
          { name: 'text', in: 'query', required: false, schema: { type: 'string', maxLength: 8000 }, description: 'An optional caption.' },
        ],
        requestBody: {
          required: true,
          content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
          'x-file': { name: 'proposal.pdf', type: 'application/pdf' },
        },
        responses: {
          201: ok('Sent.', { type: 'object', properties: { sent: { type: 'boolean' }, message: ref('Message') } }, {
            sent: true,
            message: { ...exampleOutbound, text: '', attachments: [{ id: '', kind: 'file', name: 'proposal.pdf', mimeType: 'application/pdf', size: 248311, durationMs: null, downloadable: false }] },
          }),
          ...errors('400:ValidationError', '404:NotFound', '409:Conflict', '413:FileTooLarge', '502:SendFailed'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/messages/{messageId}/reaction': {
      post: {
        operationId: 'reactToMessage',
        tags: ['Messages'],
        summary: 'React to a message',
        description: 'Adds your reaction, replacing your previous one on that message.',
        parameters: [accountIdParam, messageIdParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['emoji'], properties: { emoji: { type: 'string', description: 'One emoji.' } } }, example: { emoji: '👍' } } } },
        responses: {
          200: ok('Reacted.', { type: 'object', properties: { messageId: ID, reactions: { type: 'array', items: ref('Reaction') } } }, { messageId: ex.messageId, reactions: [{ emoji: '👍', fromMe: true, at: '2026-10-24T06:15:00.000Z' }] }),
          ...errors('400:ValidationError', '404:NotFound', '409:Conflict'),
          ...COMMON,
        },
      },
    },
    '/accounts/{accountId}/messages/{messageId}/attachments/{attachmentId}': {
      get: {
        operationId: 'downloadAttachment',
        tags: ['Messages'],
        summary: 'Download an attachment',
        description: 'Streams the file with its content type. Only attachments with `downloadable: true`.',
        parameters: [accountIdParam, messageIdParam, { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' }, example: 'att_1' }],
        responses: {
          200: { description: 'The file.', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
          ...errors('404:NotFound'),
          ...COMMON,
        },
      },
    },
    '/webhook': {
      get: {
        operationId: 'getWebhook',
        tags: ['Webhooks'],
        summary: 'Get your webhook',
        responses: {
          200: ok('Your webhook.', { type: 'object', properties: { url: { type: 'string' }, events: { type: 'array', items: { type: 'string' } } } }, { url: 'https://your-app.com/spurly/webhook', events: ['message.created', 'message.updated', 'account.updated'] }),
          ...COMMON,
        },
      },
      put: {
        operationId: 'setWebhook',
        tags: ['Webhooks'],
        summary: 'Set your webhook URL',
        description: 'An HTTPS URL. Send an empty string to stop deliveries; events are still recorded in the event feed.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['url'], properties: { url: { type: 'string', format: 'uri' } } }, example: { url: 'https://your-app.com/spurly/webhook' } } } },
        responses: { 200: ok('Saved.', { type: 'object', properties: { url: { type: 'string' } } }, { url: 'https://your-app.com/spurly/webhook' }), ...errors('400:ValidationError'), ...COMMON },
      },
    },
    '/webhook/test': {
      post: {
        operationId: 'testWebhook',
        tags: ['Webhooks'],
        summary: 'Send a test event',
        description: 'Delivers a signed `webhook.test` event now and answers with what your endpoint returned.',
        responses: {
          200: ok('Delivery result.', {
            type: 'object',
            properties: { event: ref('Event'), delivered: { type: 'boolean' }, status: { type: ['integer', 'null'], description: 'Your endpoint\'s HTTP status.' }, error: { type: 'string' } },
          }, { event: { id: ex.eventId, type: 'webhook.test', createdAt: '2026-10-24T06:30:00.000Z', data: { message: 'Webhook test from Spurly' } }, delivered: true, status: 200, error: '' }),
          ...errors('409:Conflict'),
          ...COMMON,
        },
      },
    },
    '/webhook/rotate-secret': {
      post: {
        operationId: 'rotateWebhookSecret',
        tags: ['Webhooks'],
        summary: 'Rotate the signing secret',
        description: 'Issues a new signing secret. The old one stops working at once, so deploy the new one straight away.',
        responses: { 200: ok('The new secret, shown once.', { type: 'object', properties: { webhookSecret: { type: 'string' } } }, { webhookSecret: 'whsec_9b1d...' }), ...COMMON },
      },
    },
    '/events': {
      get: {
        operationId: 'listEvents',
        tags: ['Webhooks'],
        summary: 'List events',
        description: 'Every event of the last 30 days, oldest first. Use it to catch up after downtime: pass the id of the last event you processed as `after`.',
        parameters: [
          { name: 'after', in: 'query', required: false, schema: { type: 'string' }, example: ex.eventId, description: 'Return events after this event id.' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200, default: 100 } },
          { name: 'type', in: 'query', required: false, schema: { type: 'string', enum: ['message.created', 'message.updated', 'account.updated', 'webhook.test'] }, description: 'Only this event type.' },
        ],
        responses: {
          200: ok('A page of events.', {
            type: 'object',
            properties: {
              events: { type: 'array', items: ref('Event') },
              hasMore: { type: 'boolean' },
              next: { type: ['string', 'null'], description: 'Pass as `after` to get the next page.' },
            },
          }, { events: [{ id: ex.eventId, type: 'message.created', createdAt: '2026-10-24T06:09:01.000Z', data: { accountId: ex.accountId, externalId: 'user_123', origin: 'linkedin', chat: exampleChat, message: exampleMessage }, delivery: { deliveredAt: '2026-10-24T06:09:01.300Z', attempts: 1, lastStatus: 200 } }], hasMore: false, next: ex.eventId }),
          ...errors('400:ValidationError'),
          ...COMMON,
        },
      },
    },
  },
  webhooks: {
    'message.created': {
      post: {
        operationId: 'onMessageCreated',
        summary: 'message.created',
        description:
          'A new message. `origin: linkedin` for a message that arrived from LinkedIn, including ones the person sent from LinkedIn itself; `origin: api` for one you sent through this API.',
        requestBody: {
          content: {
            'application/json': {
              schema: ref('MessageEvent'),
              example: { id: ex.eventId, type: 'message.created', createdAt: '2026-10-24T06:09:01.000Z', data: { accountId: ex.accountId, externalId: 'user_123', origin: 'linkedin', chat: exampleChat, message: exampleMessage } },
            },
          },
        },
        responses: { '2XX': { description: 'Received. Answer quickly; any 2xx counts.' } },
      },
    },
    'message.updated': {
      post: {
        operationId: 'onMessageUpdated',
        summary: 'message.updated',
        description: 'An existing message changed. `change` says how.',
        requestBody: {
          content: {
            'application/json': {
              schema: ref('MessageEvent'),
              example: { id: 'evt_6719f3a0a1b2c3d4e5f60801', type: 'message.updated', createdAt: '2026-10-24T06:14:00.000Z', data: { accountId: ex.accountId, externalId: 'user_123', change: 'read', chat: exampleChat, message: { ...exampleOutbound, seen: true, seenAt: '2026-10-24T06:14:00.000Z' } } },
            },
          },
        },
        responses: { '2XX': { description: 'Received.' } },
      },
    },
    'account.updated': {
      post: {
        operationId: 'onAccountUpdated',
        summary: 'account.updated',
        description: 'The LinkedIn connection state changed. Sent once per change.',
        requestBody: {
          content: {
            'application/json': {
              schema: ref('AccountEvent'),
              example: { id: 'evt_6719f3d1a1b2c3d4e5f60800', type: 'account.updated', createdAt: '2026-10-24T06:20:00.000Z', data: { accountId: ex.accountId, externalId: 'user_123', previousState: 'connected', account: { ...exampleAccount, linkedin: { ...exampleLinkedin, state: 'needs_reconnect' } } } },
            },
          },
        },
        responses: { '2XX': { description: 'Received.' } },
      },
    },
    'webhook.test': {
      post: {
        operationId: 'onWebhookTest',
        summary: 'webhook.test',
        description: 'Sent by POST /webhook/test.',
        requestBody: { content: { 'application/json': { schema: ref('Event'), example: { id: ex.eventId, type: 'webhook.test', createdAt: '2026-10-24T06:30:00.000Z', data: { message: 'Webhook test from Spurly' } } } } },
        responses: { '2XX': { description: 'Received.' } },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: { type: 'http', scheme: 'bearer', bearerFormat: 'spk_partner_...', description: 'Your API key: `Authorization: Bearer spk_partner_...`.' },
    },
    parameters: {
      accountId: { name: 'accountId', in: 'path', required: true, schema: ID, example: ex.accountId, description: 'The account id.' },
      chatId: { name: 'chatId', in: 'path', required: true, schema: ID, example: ex.chatId, description: 'The conversation id.' },
      messageId: { name: 'messageId', in: 'path', required: true, schema: ID, example: ex.messageId, description: 'The message id.' },
      page: { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 }, description: 'Page number, from 1.' },
      limit30: { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 30 }, description: 'Items per page.' },
    },
    responses: {
      ValidationError: { description: 'The request is invalid. `message` says what to fix.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'externalId is required: 1-128 characters, letters, digits and . _ : @ - only', code: 'INVALID_EXTERNAL_ID', status: 400 } } } },
      SignInError: { description: 'LinkedIn refused the sign-in, the cookie or the code. `field` names the input to highlight. See the error reference for every code.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'That email and password didn’t work on LinkedIn. Check them and try again.', code: 'INVALID_CREDENTIALS', field: 'password', status: 422 } } } },
      Expired: { description: 'The verification timed out. Start the sign-in again.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'This sign-in expired. Enter your LinkedIn details again.', code: 'EXPIRED', status: 410 } } } },
      Unauthorized: { description: 'Missing, invalid or revoked API key.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'Invalid or revoked API key.', code: 'UNAUTHORIZED', status: 401 } } } },
      NotFound: { description: 'No such account, conversation, message or attachment under your key.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'Account not found', code: 'ACCOUNT_NOT_FOUND', status: 404 } } } },
      Conflict: { description: 'The request conflicts with the current state, for example LinkedIn is not connected.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'Your LinkedIn connection needs attention before the inbox can sync.', code: 'LINKEDIN_ACCOUNT_NOT_READY', status: 409 } } } },
      FileTooLarge: { description: 'The file is over the limit for its kind.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'That file is too large (limit 20 MB).', code: 'FILE_TOO_LARGE', status: 413 } } } },
      RateLimited: { description: 'Too many requests for this key. Wait `Retry-After` seconds.', headers: { 'Retry-After': { schema: { type: 'integer' } } }, content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'Too many requests. Retry in 12 seconds.', code: 'RATE_LIMITED', status: 429 } } } },
      SendFailed: { description: 'LinkedIn did not accept or did not confirm the send.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'We did not get a confirmation from LinkedIn. Check the conversation there before sending again — it may have gone out.', code: 'SEND_UNCONFIRMED', status: 502 } } } },
      ServerError: { description: 'Something failed on our side. Safe to retry reads; check before retrying a send.', content: { 'application/json': { schema: ref('Error'), example: { success: false, message: 'Something went wrong', code: 'INTERNAL', status: 500 } } } },
    },
    schemas: {
      Account: {
        type: 'object',
        description: 'One user of yours, and their LinkedIn connection.',
        required: ['id', 'externalId', 'name', 'status', 'closedAt', 'linkedin', 'directLogin', 'createdAt'],
        properties: {
          id: { ...ID, description: 'Spurly\'s id for the account.' },
          externalId: { type: 'string', description: 'Your id for this one LinkedIn profile (e.g. `user_123:1`), reused when it reconnects.' },
          name: { type: 'string', description: 'The name you gave the account.' },
          status: { type: 'string', enum: ['open', 'closed'], description: 'A closed account has no access; see `DELETE /accounts/{accountId}`.' },
          closedAt: { type: ['string', 'null'], format: 'date-time', description: 'When the account was closed, or null while open.' },
          linkedin: ref('LinkedinConnection'),
          directLogin: { type: 'boolean', description: 'Whether the account\'s person set up their own Spurly sign-in (email + password). Remove it with `DELETE /accounts/{accountId}/login`.' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: exampleAccount,
      },
      LinkedinConnection: {
        type: 'object',
        description: 'The account\'s LinkedIn connection, live.',
        required: ['state', 'name', 'profileUrl', 'isPremium', 'connectedAt'],
        properties: {
          state: {
            type: 'string',
            enum: ['not_connected', 'connecting', 'connected', 'needs_reconnect'],
            description: '`not_connected`: none, or disconnected. `connecting`: signed in, LinkedIn is finishing setup. `connected`: live. `needs_reconnect`: LinkedIn ended the session; connect again.',
          },
          name: { type: 'string', description: 'The LinkedIn member\'s name. Empty when not connected.' },
          profileUrl: { type: 'string', description: 'Their LinkedIn profile URL. Empty when not connected.' },
          isPremium: { type: 'boolean', description: 'LinkedIn Premium, Sales Navigator or Recruiter.' },
          connectedAt: { ...TS, description: 'When this connection was made.' },
        },
      },
      ConnectRequest: {
        type: 'object',
        required: ['method'],
        properties: {
          method: { type: 'string', enum: ['credentials', 'cookies'], default: 'credentials', description: 'Sign in with email and password, or with a session cookie.' },
          username: { type: 'string', description: '`credentials`: the LinkedIn email or phone number.' },
          password: { type: 'string', description: '`credentials`: the LinkedIn password. Never stored.' },
          accessToken: { type: 'string', description: '`cookies`: the value of the `li_at` cookie.' },
          premiumToken: { type: 'string', description: '`cookies`: the value of the `li_a` cookie (Sales Navigator or Recruiter only).' },
          userAgent: { type: 'string', maxLength: 512, description: '`cookies`: the user agent of the browser the cookie came from. Recommended.' },
          endUserIp: { type: 'string', description: 'The person\'s own IP address. Strongly recommended: with automatic location LinkedIn then sees the sign-in from their country, which means fewer verification steps.' },
          sync: {
            type: 'object',
            description: 'What history to import. Both default to true.',
            properties: { chats: { type: 'boolean', default: true }, messages: { type: 'boolean', default: true } },
          },
          location: {
            type: 'object',
            description: 'Where LinkedIn sees the sign-in from.',
            properties: {
              mode: { type: 'string', enum: ['auto', 'country', 'proxy'], default: 'auto' },
              country: { type: 'string', description: '`country`: ISO 3166-1 alpha-2 code, for example `IN`.' },
              proxy: {
                type: 'object',
                description: '`proxy`: your own proxy.',
                properties: {
                  protocol: { type: 'string', enum: ['http', 'https', 'socks5'] },
                  host: { type: 'string' },
                  port: { type: 'integer', minimum: 1, maximum: 65535 },
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
      },
      ConnectResult: {
        type: 'object',
        required: ['state', 'account'],
        properties: {
          state: { type: 'string', enum: ['connected', 'checkpoint'] },
          checkpoint: ref('Checkpoint'),
          account: ref('Account'),
        },
      },
      Checkpoint: {
        type: 'object',
        description: 'Present when `state` is `checkpoint`.',
        properties: {
          type: { type: 'string', enum: ['OTP', '2FA', 'PHONE_REGISTER', 'IN_APP_VALIDATION'], description: '`OTP`: a code sent to the account\'s email or phone. `2FA`: a code from an authenticator app. `PHONE_REGISTER`: LinkedIn wants a phone number added first. `IN_APP_VALIDATION`: the person approves in the LinkedIn app; poll status.' },
          expiresAt: { ...TS, description: 'When the verification expires, if LinkedIn says.' },
        },
      },
      InboxStatus: {
        type: 'object',
        properties: {
          connected: { type: 'boolean', description: 'LinkedIn is connected.' },
          chats: { type: 'integer', description: 'Conversations in the inbox (up to the newest 300).' },
          unread: { type: 'integer', description: 'Unread messages across all conversations.' },
          historyPending: { type: 'integer', description: 'Conversations whose older messages are still being imported.' },
          sync: {
            type: ['object', 'null'],
            description: 'The history sync. Null before the first one is queued.',
            properties: {
              status: { type: 'string', enum: ['queued', 'running', 'done', 'failed'] },
              phase: { type: 'string', enum: ['chats', 'messages', 'done'] },
              chatsSeen: { type: 'integer' },
              messagesImported: { type: 'integer' },
              lastRunAt: TS,
              firstCompletedAt: { ...TS, description: 'When the first full sync finished.' },
              error: { type: 'string', description: 'Why the last run failed, if it did. When status is `failed` with a LinkedIn connection message, the person has to reconnect LinkedIn.' },
            },
          },
          liveFeedSeenAt: { ...TS, description: 'When the last live message arrived. Null until the first one.' },
        },
      },
      Chat: {
        type: 'object',
        description: 'A conversation with one LinkedIn member.',
        properties: {
          id: { ...ID, description: 'The conversation id.' },
          name: { type: 'string', description: 'The other person\'s name.' },
          headline: { type: 'string', description: 'Their LinkedIn headline.' },
          profileUrl: { type: 'string', description: 'Their LinkedIn profile URL.' },
          pictureUrl: { type: 'string', description: 'Their profile photo URL. May be empty.' },
          connectionDegree: { type: ['integer', 'null'], enum: [1, 2, 3, null], description: 'LinkedIn degree of connection, when known.' },
          unreadCount: { type: 'integer' },
          lastMessageAt: TS,
          lastMessageText: { type: 'string' },
          lastMessageDirection: { type: 'string', enum: ['inbound', 'outbound'] },
          readOnly: { type: 'boolean', description: 'LinkedIn does not allow replies here (for example some InMail or sponsored threads).' },
        },
        example: exampleChat,
      },
      Message: {
        type: 'object',
        properties: {
          id: { ...ID, description: 'The message id.' },
          chatId: ID,
          direction: { type: 'string', enum: ['inbound', 'outbound'], description: '`outbound` was sent by the account\'s owner.' },
          text: { type: 'string', description: 'Empty for a deleted message or an attachment-only message.' },
          sentAt: TS,
          delivered: { type: 'boolean' },
          seen: { type: 'boolean', description: 'Outbound: true once LinkedIn reports the other person read it (a `message.updated` with `change: read` is sent at that moment). Inbound: the account\'s owner has read it on LinkedIn.' },
          seenAt: { ...TS, description: 'Outbound only: when the other person read it.' },
          edited: { type: 'boolean' },
          deleted: { type: 'boolean' },
          attachments: { type: 'array', items: ref('Attachment') },
          reactions: { type: 'array', items: ref('Reaction') },
        },
        example: exampleMessage,
      },
      Attachment: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Use with the download endpoint. Empty on a file you just sent, until LinkedIn confirms it.' },
          kind: { type: 'string', enum: ['image', 'video', 'audio', 'voice', 'file'] },
          name: { type: 'string' },
          mimeType: { type: 'string' },
          size: { type: ['integer', 'null'], description: 'Bytes, when known.' },
          durationMs: { type: ['integer', 'null'], description: 'Audio and video length, when known.' },
          downloadable: { type: 'boolean' },
        },
        example: { id: 'att_1', kind: 'image', name: 'plan.png', mimeType: 'image/png', size: 48211, durationMs: null, downloadable: true },
      },
      Reaction: {
        type: 'object',
        properties: {
          emoji: { type: 'string' },
          fromMe: { type: 'boolean', description: 'Added by the account\'s owner.' },
          at: TS,
        },
        example: { emoji: '👍', fromMe: false, at: '2026-10-24T06:10:00.000Z' },
      },
      Pagination: {
        type: 'object',
        properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer', description: 'Items across all pages.' } },
        example: examplePagination,
      },
      Event: {
        type: 'object',
        description: 'Every webhook delivery and every event in the feed.',
        required: ['id', 'type', 'createdAt', 'data'],
        properties: {
          id: { type: 'string', description: 'Stable and unique. Use it to drop duplicates and as the `after` cursor.' },
          type: { type: 'string', enum: ['message.created', 'message.updated', 'account.updated', 'webhook.test'] },
          createdAt: { type: 'string', format: 'date-time' },
          data: { type: 'object', description: 'Depends on `type`.' },
          delivery: {
            type: 'object',
            description: 'Feed only: how the webhook delivery went.',
            properties: { deliveredAt: TS, attempts: { type: 'integer' }, lastStatus: { type: ['integer', 'null'] } },
          },
        },
      },
      MessageEvent: {
        type: 'object',
        description: '`message.created` and `message.updated`.',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['message.created', 'message.updated'] },
          createdAt: { type: 'string', format: 'date-time' },
          data: {
            type: 'object',
            properties: {
              accountId: ID,
              externalId: { type: 'string' },
              origin: { type: 'string', enum: ['linkedin', 'api'], description: '`message.created` only.' },
              change: { type: 'string', enum: ['read', 'reaction', 'message_edited', 'message_deleted', 'message_delivered'], description: '`message.updated` only.' },
              chat: ref('Chat'),
              message: ref('Message'),
            },
          },
        },
      },
      AccountEvent: {
        type: 'object',
        description: '`account.updated`.',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', const: 'account.updated' },
          createdAt: { type: 'string', format: 'date-time' },
          data: {
            type: 'object',
            properties: {
              accountId: ID,
              externalId: { type: 'string' },
              previousState: { type: 'string', enum: ['not_connected', 'connecting', 'connected', 'needs_reconnect'] },
              account: ref('Account'),
            },
          },
        },
      },
      Error: {
        type: 'object',
        required: ['success', 'message', 'code', 'status'],
        properties: {
          success: { type: 'boolean', const: false },
          message: { type: 'string', description: 'Written for people. Safe to show on a 4xx.' },
          code: { type: 'string', description: 'Stable, for your code to branch on.' },
          field: { type: 'string', description: 'Sign-in errors: the input to highlight.' },
          status: { type: 'integer', description: 'The HTTP status, repeated.' },
        },
      },
    },
  },
};

// `delete: undefined` above keeps the connect block readable; drop it from the published spec.
delete OPENAPI.paths['/accounts/{accountId}/linkedin/connect'].delete;

/** Every operation, in document order, with its path and method. */
export function operations() {
  const out = [];
  for (const [path, item] of Object.entries(OPENAPI.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      if (item[method]) out.push({ path, method, ...item[method] });
    }
  }
  return out;
}

export function operationById(id) {
  return operations().find((op) => op.operationId === id) || null;
}

/** Resolve a local `$ref` ("#/components/...") to its object. */
export function resolveRef(node) {
  if (!node || typeof node !== 'object' || !node.$ref) return node;
  const parts = node.$ref.replace(/^#\//, '').split('/');
  let cur = OPENAPI;
  for (const p of parts) cur = cur?.[p];
  return cur ? { ...cur, ...(cur.$ref ? resolveRef(cur) : {}) } : null;
}

export function refName(node) {
  return node?.$ref ? node.$ref.split('/').pop() : null;
}
