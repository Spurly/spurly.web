/**
 * OpenAPI 3.1 description of the Spurly organisation API (/v2).
 *
 * Partner -> organisation -> LinkedIn accounts. Like openapi.js this is the single
 * source of truth for its docs: every endpoint, table, object and code sample on
 * /developers/v2 is rendered from this object.
 *
 * Keep it in step with spurly.backend src/products/hub/gateway (route/routes.js,
 * service/passthrough.js, service/sanitise.js). A /v2 route is not documented until
 * it is added here.
 *
 * All component names start with "V2" so one `$ref` can never mean two things next to
 * the /v1 spec (see resolveRef in openapi.js). The docs strip the prefix on screen.
 * No third-party vendor is named anywhere in this file, and a test keeps it so.
 */

const ID = { type: 'string', pattern: '^[a-f0-9]{24}$' };
const TS = { type: ['string', 'null'], format: 'date-time' };

const ex = {
  orgId: '6720a1b2c3d4e5f607182930',
  accountId: '6720a2c3d4e5f60718293041',
  chatId: 'chat_8f2k1',
  messageId: 'msg_91ac3',
  attachmentId: 'att_1',
  postId: 'urn:li:activity:7123456789012345678',
  invitationId: 'inv_42',
  identifier: 'janedoe',
};

const exampleOrg = {
  id: ex.orgId,
  externalId: 'jane@acme.com',
  name: 'Acme Inc.',
  status: 'active',
  createdAt: '2026-11-01T09:00:00.000Z',
  accounts: { connected: 1, total: 1 },
};
const exampleAccount = {
  id: ex.accountId,
  orgId: ex.orgId,
  status: 'OK',
  name: 'Jane Doe',
  publicIdentifier: 'janedoe',
  connectedAt: '2026-11-01T09:05:00.000Z',
  disconnectedAt: null,
};
const exampleStats = { connected: 1, distinct: 2, peak: { count: 2, at: '2026-11-02T10:00:00.000Z' } };

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
const COMMON = errors('401:V2Unauthorized', '429:V2RateLimited', '500:V2ServerError');
const param = (name) => ({ $ref: `#/components/parameters/V2${name}` });
const stringList = { type: 'array', items: { type: 'string' } };
const pageOf = (item) => ({ type: 'object', properties: { items: { type: 'array', items: item }, cursor: { type: ['string', 'null'], description: 'Pass as `cursor` for the next page. `null` on the last page.' } } });

/** An operation, compactly. Everything the docs need, nothing the backend does not do. */
function op({ id, tag, summary, description, params = [], query = [], body, bodyExample, bodyKind, success, extra = [], status = 200 }) {
  const out = { operationId: id, tags: [tag], summary, description, parameters: [...params.map(param), ...query] };
  if (body) {
    out.requestBody = { required: true, content: { 'application/json': { schema: body, example: bodyExample } } };
  }
  if (bodyKind === 'upload') {
    out.requestBody = {
      required: false,
      description: 'Either a JSON body, or the raw file as the request body with `kind`, `fileName` and optional `text` in the query string. Send the file\'s own `Content-Type`.',
      content: {
        ...(body ? out.requestBody.content : {}),
        'application/octet-stream': { schema: { type: 'string', format: 'binary' } },
      },
    };
  }
  out.responses = { [status]: success, ...errors(...extra), ...COMMON };
  return out;
}

const q = (name, description, example, schema = { type: 'string' }, omit = false) => ({ name, in: 'query', required: false, description, schema, example, ...(omit ? { 'x-omit-sample': true } : {}) });
const CURSOR = q('cursor', 'The `cursor` from the previous page.', 'c3RhcnQ9MjU', { type: 'string' }, true);
const LIMIT = q('limit', 'Items per page, 1 to 100. Default 25.', 25, { type: 'integer', minimum: 1, maximum: 100 });
const ACCOUNT_ERRORS = ['400:V2ValidationError', '403:V2Forbidden', '404:V2NotFound', '409:V2Conflict', '502:V2Upstream'];
const ACCOUNT_ERRORS_W = [...ACCOUNT_ERRORS, '422:V2Unprocessable', '504:V2Timeout'];

const connectResult = {
  description: 'The next state of the sign-in.',
  content: {
    'application/json': {
      schema: envelope(ref('V2ConnectState')),
      examples: {
        connected: { summary: 'Connected', value: { success: true, data: { state: 'connected', account: exampleAccount } } },
        checkpoint: { summary: 'LinkedIn asks for a code', value: { success: true, data: { state: 'checkpoint', connectId: 'cn_5d3f', checkpoint: { type: 'OTP', expiresAt: '2026-11-01T09:20:00.000Z' } } } },
      },
    },
  },
};
const connectErrors = ['400:V2ValidationError', '403:V2Forbidden', '404:V2NotFound', '409:V2Conflict', '410:V2Gone', '422:V2Unprocessable'];

const T = {
  orgs: 'V2 Orgs',
  connect: 'V2 Connect LinkedIn',
  accounts: 'V2 Accounts',
  usage: 'V2 Usage and events',
  messaging: 'V2 Messaging',
  profiles: 'V2 Profiles and search',
  network: 'V2 Network',
  posts: 'V2 Posts',
  insights: 'V2 Companies and insights',
};

const connectBody = {
  type: 'object',
  properties: {
    method: { type: 'string', enum: ['credentials', 'cookies'], description: 'Default `credentials`.' },
    username: { type: 'string', description: '`credentials`: the LinkedIn email or phone.' },
    password: { type: 'string', description: '`credentials`: the LinkedIn password. Used for this request only; Spurly never stores it.' },
    accessToken: { type: 'string', description: '`cookies`: the value of the `li_at` cookie.' },
    premiumToken: { type: 'string', description: '`cookies`: the value of the `li_a` cookie, for Sales Navigator or Recruiter.' },
    userAgent: { type: 'string', description: '`cookies`: the browser user agent the cookie was issued to.' },
    accountId: { ...ID, description: 'Reconnect this account. The member who signs in must be the same one.' },
    sync: { type: 'object', properties: { chats: { type: 'boolean' }, messages: { type: 'boolean' } }, description: 'Both default to `true`.' },
    location: { type: 'object', description: 'Where LinkedIn sees the sign-in from: `{ mode: "country", country: "US" }` or `{ mode: "proxy", proxy: { protocol, host, port, username?, password? } }`.' },
    endUserIp: { type: 'string', description: 'The end user\'s own IPv4 address, so LinkedIn sees the sign-in from where the person is.' },
  },
};
const connectIdBody = { type: 'object', required: ['connectId'], properties: { connectId: { type: 'string', description: 'From the `checkpoint` response.' } } };

const ORG_OPS = {
  '/orgs': {
    post: op({
      id: 'v2CreateOrg', tag: T.orgs, summary: 'Create or fetch an organisation',
      description: 'Creates the organisation for `externalId` (the customer\'s email address), or returns the existing one. Idempotent: a retry is safe. The first call answers `201`, later calls `200`. An organisation holds at most one live LinkedIn member.',
      body: { type: 'object', required: ['externalId'], properties: { externalId: { type: 'string', format: 'email', minLength: 3, maxLength: 200, description: "The customer's email address. They sign in to Spurly with it. Lowercased by Spurly. Reusing it returns the same organisation." }, name: { type: 'string', maxLength: 100, description: 'A display name.' } } },
      bodyExample: { externalId: 'jane@acme.com', name: 'Acme Inc.' },
      success: ok('Created.', ref('V2Org'), exampleOrg), status: 201, extra: ['400:V2ValidationError'],
    }),
    get: op({
      id: 'v2ListOrgs', tag: T.orgs, summary: 'List organisations',
      description: 'Your organisations, newest first.',
      query: [q('page', 'Page number, from 1.', 1, { type: 'integer', minimum: 1 }), q('limit', 'Items per page, 1 to 200. Default 50.', 50, { type: 'integer', minimum: 1, maximum: 200 }), q('externalId', 'Only the organisation with this `externalId`.', 'jane@acme.com')],
      success: ok('A page of organisations.', { type: 'object', properties: { items: { type: 'array', items: ref('V2Org') }, total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' } } }, { items: [exampleOrg], total: 1, page: 1, limit: 50 }),
    }),
  },
  '/orgs/{orgId}': {
    get: op({
      id: 'v2GetOrg', tag: T.orgs, summary: 'Get an organisation',
      description: 'The organisation and how many LinkedIn accounts it has connected.',
      params: ['orgId'], success: ok('The organisation.', ref('V2Org'), exampleOrg), extra: ['404:V2NotFound'],
    }),
  },
};

const CONNECT_OPS = {
  '/orgs/{orgId}/accounts/connect': {
    post: op({
      id: 'v2ConnectAccount', tag: T.connect, summary: 'Connect a LinkedIn account',
      description: 'Signs a LinkedIn account in under the organisation with credentials or a session cookie. Answers `connected`, or `checkpoint` when LinkedIn wants a verification step: finish it with the checkpoint calls using the `connectId`. A LinkedIn member can be live in one organisation at a time (`409 PROFILE_IN_USE`). Limited to 5 connects per hour per organisation (`429 ORG_CONNECT_LIMIT`); if LinkedIn itself asks for a pause you get `429 LINKEDIN_RATE_LIMITED`. Spurly does not host a sign-in page for `/v2`.',
      params: ['orgId'], body: connectBody, bodyExample: { method: 'credentials', username: 'jane@example.com', password: '••••••••', endUserIp: '203.0.113.7' },
      success: connectResult, extra: connectErrors,
    }),
  },
  '/orgs/{orgId}/accounts/connect/checkpoint': {
    post: op({
      id: 'v2SolveCheckpoint', tag: T.connect, summary: 'Submit a verification code',
      description: 'Answers the code LinkedIn sent (email, SMS or authenticator app).',
      params: ['orgId'], body: { type: 'object', required: ['connectId', 'code'], properties: { connectId: { type: 'string' }, code: { type: 'string', maxLength: 64 } } }, bodyExample: { connectId: 'cn_5d3f', code: '123456' },
      success: connectResult, extra: connectErrors,
    }),
  },
  '/orgs/{orgId}/accounts/connect/checkpoint/another-way': {
    post: op({
      id: 'v2CheckpointAnotherWay', tag: T.connect, summary: 'Verify another way',
      description: 'When LinkedIn offers another method (for example the app instead of a code), switches to it. Returns the new checkpoint.',
      params: ['orgId'], body: connectIdBody, bodyExample: { connectId: 'cn_5d3f' }, success: connectResult, extra: connectErrors,
    }),
  },
  '/orgs/{orgId}/accounts/connect/checkpoint/resend': {
    post: op({
      id: 'v2ResendCheckpoint', tag: T.connect, summary: 'Resend the code',
      description: 'Asks LinkedIn to send the verification code again.',
      params: ['orgId'], body: connectIdBody, bodyExample: { connectId: 'cn_5d3f' },
      success: ok('Sent.', { type: 'object', properties: { sent: { type: 'boolean' } } }, { sent: true }), extra: connectErrors,
    }),
  },
  '/orgs/{orgId}/accounts/connect/status': {
    get: op({
      id: 'v2ConnectStatus', tag: T.connect, summary: 'Check an in-app approval',
      description: 'For a checkpoint the member approves in the LinkedIn app: poll this every few seconds until `state` is `connected`.',
      params: ['orgId'], query: [{ name: 'connectId', in: 'query', required: true, description: 'From the `checkpoint` response.', schema: { type: 'string' }, example: 'cn_5d3f' }],
      success: connectResult, extra: connectErrors,
    }),
  },
};

const ACCOUNT_OPS = {
  '/orgs/{orgId}/accounts': {
    get: op({
      id: 'v2ListOrgAccounts', tag: T.accounts, summary: 'List an organisation\'s accounts',
      description: 'The LinkedIn accounts under the organisation, newest first. Disconnected accounts are left out unless you ask for them.',
      params: ['orgId'],
      query: [q('page', 'Page number, from 1.', 1, { type: 'integer', minimum: 1 }), q('limit', 'Items per page, 1 to 200. Default 50.', 50, { type: 'integer', minimum: 1, maximum: 200 }), q('includeDisconnected', '`true` to include disconnected accounts.', 'true', { type: 'string', enum: ['true', 'false'] })],
      success: ok('A page of accounts.', { type: 'object', properties: { items: { type: 'array', items: ref('V2Account') }, total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' } } }, { items: [exampleAccount], total: 1, page: 1, limit: 50 }),
      extra: ['404:V2NotFound'],
    }),
  },
  '/accounts/{accountId}': {
    get: op({
      id: 'v2GetAccount', tag: T.accounts, summary: 'Get an account',
      description: 'The account and its current connection `status`.',
      params: ['accountId'], success: ok('The account.', ref('V2Account'), exampleAccount), extra: ['404:V2NotFound'],
    }),
    delete: op({
      id: 'v2DisconnectAccount', tag: T.accounts, summary: 'Disconnect an account',
      description: 'Disconnects the LinkedIn account and frees its member to connect elsewhere. Idempotent: disconnecting a disconnected account is fine.',
      params: ['accountId'], success: ok('Disconnected.', ref('V2Account'), { ...exampleAccount, status: 'DELETED', disconnectedAt: '2026-11-03T09:00:00.000Z' }), extra: ['404:V2NotFound', '502:V2Upstream'],
    }),
  },
};

const USAGE_OPS = {
  '/usage': {
    get: op({
      id: 'v2GetUsage', tag: T.usage, summary: 'Usage',
      description: 'What you are billed on: distinct LinkedIn members connected now, over the window, and at peak. Counts only. A member counts once however many times they connect or move between organisations.',
      query: [q('orgId', 'Only this organisation.', ex.orgId), q('days', 'Window length in days, ending now. Default 30.', 30, { type: 'integer', minimum: 1 }), q('from', 'Window start (ISO 8601). Use with `to`.', '2026-10-01T00:00:00.000Z'), q('to', 'Window end (ISO 8601). Default now.', '2026-11-01T00:00:00.000Z')],
      success: ok('Usage.', ref('V2Usage'), { window: { from: '2026-10-05T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z' }, total: exampleStats, orgs: [{ id: ex.orgId, externalId: 'jane@acme.com', name: 'Acme Inc.', ...exampleStats, refusedConnects: 0 }] }),
      extra: ['400:V2ValidationError', '404:V2NotFound'],
    }),
  },
  '/events': {
    get: op({
      id: 'v2ListEvents', tag: T.usage, summary: 'Event feed',
      description: 'Everything your webhook was sent in the last 7 days, oldest first, so you can catch up after downtime. Pass the last `id` you processed as `after`.',
      query: [q('after', 'An event id. Only later events are returned.', 'evt_6720a2c3d4e5f60718293099'), q('limit', 'Events per page, 1 to 200. Default 100.', 100, { type: 'integer', minimum: 1, maximum: 200 }), q('type', 'Only this event type.', 'message.created', { type: 'string', enum: ['account.updated', 'message.created', 'message.updated'] }), q('orgId', 'Only this organisation.', ex.orgId)],
      success: ok('Events.', { type: 'object', properties: { events: { type: 'array', items: ref('V2Event') }, hasMore: { type: 'boolean' }, next: { type: ['string', 'null'], description: 'Pass as `after` for the next page.' } } }, { events: [{ id: 'evt_6720a2c3d4e5f60718293099', type: 'account.updated', createdAt: '2026-11-01T09:05:00.000Z', data: { accountId: ex.accountId, orgId: ex.orgId, orgExternalId: 'jane@acme.com', previousStatus: 'CREDENTIALS', account: exampleAccount }, delivery: { deliveredAt: '2026-11-01T09:05:01.000Z', attempts: 1, lastStatus: 200 } }], hasMore: false, next: 'evt_6720a2c3d4e5f60718293099' }),
      extra: ['400:V2ValidationError', '404:V2NotFound'],
    }),
  },
};

const A = ['accountId'];
const chatEx = { id: ex.chatId, attendeeId: 'ACoAAB1x2y3', name: 'Bob Smith', folders: ['INBOX'], unreadCount: 2, archived: false, readOnly: false, muted: false, lastMessageAt: '2026-11-03T06:09:00.000Z' };
const msgEx = { id: ex.messageId, chatId: ex.chatId, senderId: 'ACoAAB1x2y3', isSender: false, text: 'Sounds good, talk Monday.', subject: '', attachments: [], reactions: [], seen: false, delivered: true, edited: false, deleted: false, sentAt: '2026-11-03T06:09:00.000Z' };
const leadEx = { id: 'ACoAAB1x2y3', publicIdentifier: 'bobsmith', profileUrl: 'https://www.linkedin.com/in/bobsmith', name: 'Bob Smith', headline: 'CTO at Acme', location: 'Berlin, Germany' };
const done = (key, text) => ok(text, { type: 'object', properties: { [key]: { type: 'boolean', const: true } } }, { [key]: true });
const reactionBody = (list) => ({ type: 'object', required: ['reaction'], properties: { reaction: list ? { type: 'string', enum: ['like', 'celebrate', 'support', 'love', 'insightful', 'funny'] } : { type: 'string', description: 'An emoji.' } } });

const MESSAGING_OPS = {
  '/accounts/{accountId}/chats': {
    get: op({
      id: 'v2ListChats', tag: T.messaging, summary: 'List chats',
      description: 'The member\'s conversations, most recent first.',
      params: A, query: [CURSOR, LIMIT], success: ok('A page of chats.', pageOf(ref('V2Chat')), { items: [chatEx], cursor: null }), extra: ACCOUNT_ERRORS,
    }),
    post: op({
      id: 'v2StartChat', tag: T.messaging, summary: 'Start a chat',
      description: 'Sends the first message to a LinkedIn member. Give a `subject` to send an InMail.',
      params: A, body: { type: 'object', required: ['memberId', 'text'], properties: { memberId: { type: 'string', description: 'The member\'s `id`, from a profile, search or relations call.' }, text: { type: 'string', maxLength: 8000 }, subject: { type: 'string', description: 'Makes the message an InMail.' } } },
      bodyExample: { memberId: 'ACoAAB1x2y3', text: 'Hi Bob, loved your talk.' },
      success: ok('Sent.', { type: 'object', properties: { chatId: { type: ['string', 'null'] }, messageId: { type: ['string', 'null'] } } }, { chatId: ex.chatId, messageId: ex.messageId }), status: 201, extra: ACCOUNT_ERRORS_W,
    }),
  },
  '/accounts/{accountId}/chats/{chatId}': {
    get: op({ id: 'v2GetChat', tag: T.messaging, summary: 'Get a chat', description: 'One conversation.', params: [...A, 'chatId'], success: ok('The chat.', ref('V2Chat'), chatEx), extra: ACCOUNT_ERRORS }),
    patch: op({
      id: 'v2UpdateChat', tag: T.messaging, summary: 'Mark a chat read or unread',
      description: 'Sets the chat\'s read state on LinkedIn.',
      params: [...A, 'chatId'], body: { type: 'object', required: ['read'], properties: { read: { type: 'boolean' } } }, bodyExample: { read: true },
      success: done('updated', 'Updated.'), extra: ACCOUNT_ERRORS,
    }),
    delete: op({ id: 'v2DeleteChat', tag: T.messaging, summary: 'Delete a chat', description: 'Deletes the conversation from the member\'s LinkedIn inbox.', params: [...A, 'chatId'], success: done('deleted', 'Deleted.'), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/chats/{chatId}/attendees': {
    get: op({ id: 'v2ListChatAttendees', tag: T.messaging, summary: 'List chat participants', description: 'Who is in the conversation.', params: [...A, 'chatId'], success: ok('Participants.', { type: 'object', properties: { items: { type: 'array', items: ref('V2Attendee') } } }, { items: [{ id: 'ACoAAB1x2y3', name: 'Bob Smith', isSelf: false, hidden: false, pictureUrl: 'https://media.licdn.com/dms/image/example.jpg', profileUrl: 'https://www.linkedin.com/in/bobsmith', headline: 'CTO at Acme', location: 'Berlin', connectionDegree: 1, pendingInvitation: false }] }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/chats/{chatId}/messages': {
    get: op({ id: 'v2ListMessages', tag: T.messaging, summary: 'List messages', description: 'Messages in a chat, newest first.', params: [...A, 'chatId'], query: [CURSOR, LIMIT], success: ok('A page of messages.', pageOf(ref('V2Message')), { items: [msgEx], cursor: null }), extra: ACCOUNT_ERRORS }),
    post: op({
      id: 'v2SendMessage', tag: T.messaging, summary: 'Send a message',
      description: 'Sends text, or a file. For a file, send it as the raw request body with `?kind=attachment|voice|video&fileName=report.pdf` and the file\'s own `Content-Type`; add `&text=` for a caption.',
      params: [...A, 'chatId'], body: { type: 'object', properties: { text: { type: 'string', maxLength: 8000 } } }, bodyExample: { text: 'Thanks Bob, talk Monday.' }, bodyKind: 'upload',
      query: [q('kind', 'Upload only: `attachment`, `voice` or `video`.', 'attachment', { type: 'string', enum: ['attachment', 'voice', 'video'] }, true), q('fileName', 'Upload only: the file name.', 'report.pdf', { type: 'string' }, true), q('text', 'Upload only: a caption.', 'Here it is', { type: 'string' }, true)],
      success: ok('Sent.', { type: 'object', properties: { id: { type: ['string', 'null'] }, chatId: { type: ['string', 'null'] } } }, { id: ex.messageId, chatId: ex.chatId }), status: 201, extra: ACCOUNT_ERRORS_W,
    }),
  },
  '/accounts/{accountId}/messages/{messageId}': {
    delete: op({ id: 'v2DeleteMessage', tag: T.messaging, summary: 'Delete a message', description: 'Deletes one of the member\'s own messages.', params: [...A, 'messageId'], success: done('deleted', 'Deleted.'), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/messages/{messageId}/reactions': {
    post: op({ id: 'v2ReactToMessage', tag: T.messaging, summary: 'React to a message', description: 'Adds an emoji reaction.', params: [...A, 'messageId'], body: reactionBody(false), bodyExample: { reaction: '👍' }, success: done('reacted', 'Reacted.'), status: 201, extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/messages/{messageId}/attachments/{attachmentId}': {
    get: {
      ...op({ id: 'v2DownloadAttachment', tag: T.messaging, summary: 'Download an attachment', description: 'The attachment\'s bytes, streamed through Spurly. Get the `attachmentId` from a message\'s `attachments`.', params: [...A, 'messageId', 'attachmentId'], success: { description: 'The file.' }, extra: ACCOUNT_ERRORS }),
      responses: {
        200: { description: 'The file, with its own `Content-Type` and `Content-Length`.', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
        ...errors(...ACCOUNT_ERRORS), ...COMMON,
      },
    },
  },
};

const PROFILE_OPS = {
  '/accounts/{accountId}/profile': {
    get: op({ id: 'v2GetOwnProfile', tag: T.profiles, summary: 'The connected member\'s profile', description: 'The member who signed in.', params: A, success: ok('The profile.', ref('V2OwnProfile'), { id: 'ACoAAA9z8y7', publicIdentifier: 'janedoe', name: 'Jane Doe', headline: 'Founder at Acme', location: 'London', pictureUrl: 'https://media.licdn.com/dms/image/jane.jpg', openProfile: false }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/profiles/{identifier}': {
    get: op({
      id: 'v2GetProfile', tag: T.profiles, summary: 'Get a profile',
      description: 'Any LinkedIn profile, by public identifier (the part after `/in/`) or member `id`. Add `sections` for more.',
      params: [...A, 'identifier'], query: [q('sections', 'Comma separated: `experience`, `education`, `skills`, `languages`, `certifications`, `volunteering_experience`, `projects`.', 'experience,skills')],
      success: ok('The profile.', ref('V2Profile'), { ...leadEx, firstName: 'Bob', lastName: 'Smith', summary: '', connectionDegree: 1, followerCount: 1200, connectionCount: 500 }), extra: ACCOUNT_ERRORS,
    }),
  },
  '/accounts/{accountId}/search': {
    post: op({
      id: 'v2Search', tag: T.profiles, summary: 'Search LinkedIn',
      description: 'Searches people, companies or posts. Job search is not available. People results are `{ items, cursor }` of profiles; companies and posts return their own list key with a `cursor`. Look up filter ids with `GET /search/parameters`.',
      params: A,
      body: { type: 'object', required: ['category'], properties: { category: { type: 'string', enum: ['people', 'companies', 'posts'] }, keywords: { type: 'string' }, url: { type: 'string', description: 'A LinkedIn search URL, instead of keywords and filters.' }, filters: { type: 'object', description: 'People: `location[]`, `industry[]`, `company[]`, `pastCompany[]`, `school[]` (ids from search/parameters), `networkDistance[]` (1, 2, 3), `advancedKeywords` `{ title, company, school, firstName, lastName, keywords }`.' }, cursor: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 100 } } },
      bodyExample: { category: 'people', keywords: 'head of sales', filters: { networkDistance: [2, 3] }, limit: 25 },
      success: ok('Results.', pageOf(ref('V2Lead')), { items: [leadEx], cursor: 'c3RhcnQ9MjU' }), extra: ACCOUNT_ERRORS_W,
    }),
  },
  '/accounts/{accountId}/search/parameters': {
    get: op({
      id: 'v2SearchParameters', tag: T.profiles, summary: 'Look up search filter ids',
      description: 'Turns a name into the id a search filter needs.',
      params: A, query: [{ name: 'type', in: 'query', required: true, description: 'What to look up.', schema: { type: 'string', enum: ['LOCATION', 'INDUSTRY', 'COMPANY', 'SCHOOL', 'PEOPLE'] }, example: 'LOCATION' }, q('keywords', 'Text to match.', 'berlin'), q('limit', 'Up to 100.', 10, { type: 'integer' })],
      success: ok('Matches.', { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } } } } }, { items: [{ id: '106967730', title: 'Berlin, Germany' }] }), extra: ACCOUNT_ERRORS,
    }),
  },
};

const NETWORK_OPS = {
  '/accounts/{accountId}/invitations': {
    post: op({ id: 'v2SendInvitation', tag: T.network, summary: 'Send a connection request', description: 'Invites a member to connect, with an optional note.', params: A, body: { type: 'object', required: ['memberId'], properties: { memberId: { type: 'string' }, note: { type: 'string', maxLength: 300 } } }, bodyExample: { memberId: 'ACoAAB1x2y3', note: 'Great talk yesterday.' }, success: ok('Sent.', { type: 'object', properties: { sent: { type: 'boolean' }, id: { type: ['string', 'null'] } } }, { sent: true, id: ex.invitationId }), status: 201, extra: ACCOUNT_ERRORS_W }),
  },
  '/accounts/{accountId}/invitations/sent': {
    get: op({ id: 'v2ListSentInvitations', tag: T.network, summary: 'List sent invitations', description: 'Connection requests still waiting.', params: A, query: [CURSOR, LIMIT], success: ok('A page.', pageOf({ type: 'object', properties: { id: { type: 'string' }, memberId: { type: 'string' }, publicIdentifier: { type: 'string' }, name: { type: 'string' }, headline: { type: 'string' }, note: { type: 'string' }, sentAt: TS } }), { items: [{ id: ex.invitationId, memberId: 'ACoAAB1x2y3', publicIdentifier: 'bobsmith', name: 'Bob Smith', headline: 'CTO at Acme', note: '', sentAt: '2026-11-02T08:00:00.000Z' }], cursor: null }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/invitations/received': {
    get: op({ id: 'v2ListReceivedInvitations', tag: T.network, summary: 'List received invitations', description: 'Requests waiting for the member. Keep each `token`: you hand it back to accept or decline.', params: A, query: [CURSOR, LIMIT], success: ok('A page.', pageOf({ type: 'object', properties: { id: { type: 'string' }, token: { type: ['string', 'null'], description: 'Opaque. Send it back to accept or decline.' }, actionable: { type: 'boolean' }, from: { type: 'object' }, message: { type: 'string' }, receivedAt: TS } }), { items: [{ id: ex.invitationId, token: 'tok_9aa1', actionable: true, from: { id: 'ACoAAB1x2y3', name: 'Bob Smith', headline: 'CTO at Acme', publicIdentifier: 'bobsmith', profileUrl: 'https://www.linkedin.com/in/bobsmith', pictureUrl: '' }, message: '', receivedAt: '2026-11-03T07:00:00.000Z' }], cursor: null }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/invitations/sent/{invitationId}': {
    delete: op({ id: 'v2CancelInvitation', tag: T.network, summary: 'Cancel a sent invitation', description: 'Withdraws a connection request.', params: [...A, 'invitationId'], success: done('cancelled', 'Cancelled.'), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/invitations/received/{invitationId}': {
    post: op({ id: 'v2RespondToInvitation', tag: T.network, summary: 'Accept or decline an invitation', description: 'Answers a received request. `token` is the value from the received list.', params: [...A, 'invitationId'], body: { type: 'object', required: ['action', 'token'], properties: { action: { type: 'string', enum: ['accept', 'decline'] }, token: { type: 'string' } } }, bodyExample: { action: 'accept', token: 'tok_9aa1' }, success: ok('Answered.', { type: 'object', properties: { responded: { type: 'boolean' }, action: { type: ['string', 'null'] } } }, { responded: true, action: 'accept' }), extra: ACCOUNT_ERRORS_W }),
  },
  '/accounts/{accountId}/relations': {
    get: op({ id: 'v2ListRelations', tag: T.network, summary: 'List connections', description: 'The member\'s first-degree connections.', params: A, query: [CURSOR, LIMIT], success: ok('A page of connections.', { type: 'object', properties: { relations: { type: 'array', items: ref('V2Lead') }, cursor: { type: ['string', 'null'] } } }, { relations: [{ providerId: 'ACoAAB1x2y3', connectionDegree: 1, profileUrl: 'https://www.linkedin.com/in/bobsmith', publicIdentifier: 'bobsmith', name: 'Bob Smith', headline: 'CTO at Acme' }], cursor: null }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/followers': {
    get: op({ id: 'v2ListFollowers', tag: T.network, summary: 'List followers', description: 'Followers of the member, or of a company page with `companyId`.', params: A, query: [q('companyId', 'A company page the member administers.', '1035'), CURSOR, LIMIT], success: ok('A page of followers.', { type: 'object', properties: { followers: { type: 'array', items: { type: 'object' } }, cursor: { type: ['string', 'null'] } } }, { followers: [{ providerId: 'ACoAAC4d5e6', name: 'Cara Diaz', profileUrl: 'https://www.linkedin.com/in/cara-diaz' }], cursor: null }), extra: ACCOUNT_ERRORS }),
  },
};

const POST_OPS = {
  '/accounts/{accountId}/profiles/{identifier}/posts': {
    get: op({ id: 'v2ListProfilePosts', tag: T.posts, summary: 'List a member\'s posts', description: 'Posts by a member, or by a company when `company=true`.', params: [...A, 'identifier'], query: [CURSOR, LIMIT, q('company', '`true` when `identifier` is a company.', 'false', { type: 'string', enum: ['true', 'false'] })], success: ok('A page of posts.', pageOf(ref('V2Post')), { items: [{ id: '7123456789012345678', socialId: ex.postId, text: 'Excited to share…', createdAt: '2026-11-01T08:00:00.000Z', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678', reactionCount: 40, commentCount: 5, repostCount: 1, isRepost: false }], cursor: null }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/posts': {
    post: op({
      id: 'v2CreatePost', tag: T.posts, summary: 'Create a post',
      description: 'Publishes a post as the member. For an image or video, send the file as the raw request body with `?kind=image|video&fileName=&text=`.',
      params: A, body: { type: 'object', properties: { text: { type: 'string', maxLength: 3000 } } }, bodyExample: { text: 'Excited to share what we shipped this week.' }, bodyKind: 'upload',
      query: [q('kind', 'Upload only: `image` or `video`.', 'image', { type: 'string', enum: ['image', 'video'] }, true), q('fileName', 'Upload only: the file name.', 'launch.png', { type: 'string' }, true), q('text', 'Upload only: the post text.', 'We shipped', { type: 'string' }, true)],
      success: ok('Published.', { type: 'object', properties: { id: { type: ['string', 'null'] }, socialId: { type: ['string', 'null'] } } }, { id: '7123456789012345678', socialId: ex.postId }), status: 201, extra: ACCOUNT_ERRORS_W,
    }),
  },
  '/accounts/{accountId}/posts/{postId}': {
    get: op({ id: 'v2GetPost', tag: T.posts, summary: 'Get a post', description: 'One post. `postId` is the post\'s `socialId`.', params: [...A, 'postId'], success: ok('The post.', ref('V2Post'), { id: '7123456789012345678', socialId: ex.postId, text: 'Excited to share…', createdAt: '2026-11-01T08:00:00.000Z', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678', reactionCount: 40, commentCount: 5, repostCount: 1, isRepost: false }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/posts/{postId}/comments': {
    get: op({ id: 'v2ListPostComments', tag: T.posts, summary: 'List comments', description: 'Comments on a post.', params: [...A, 'postId'], query: [CURSOR, LIMIT], success: ok('A page of comments.', pageOf({ type: 'object' }), { items: [{ id: 'cmt_1', text: 'Congrats!', author: { providerId: 'ACoAAB1x2y3', name: 'Bob Smith', headline: 'CTO at Acme', profileUrl: 'https://www.linkedin.com/in/bobsmith', pictureUrl: '', isCompany: false }, createdAt: '2026-11-01T09:00:00.000Z', reactionCount: 1, replyCount: 0 }], cursor: null }), extra: ACCOUNT_ERRORS }),
    post: op({ id: 'v2CommentOnPost', tag: T.posts, summary: 'Comment on a post', description: 'Adds a comment as the member.', params: [...A, 'postId'], body: { type: 'object', required: ['text'], properties: { text: { type: 'string', maxLength: 1250 } } }, bodyExample: { text: 'Congrats!' }, success: ok('Commented.', { type: 'object', properties: { commented: { type: 'boolean' }, id: { type: ['string', 'null'] } } }, { commented: true, id: 'cmt_2' }), status: 201, extra: ACCOUNT_ERRORS_W }),
  },
  '/accounts/{accountId}/posts/{postId}/reactions': {
    get: op({ id: 'v2ListPostReactions', tag: T.posts, summary: 'List reactions', description: 'Who reacted to a post, and how.', params: [...A, 'postId'], query: [CURSOR, LIMIT], success: ok('A page of reactions.', pageOf({ type: 'object' }), { items: [{ type: 'like', author: { providerId: 'ACoAAB1x2y3', name: 'Bob Smith', headline: 'CTO at Acme', profileUrl: 'https://www.linkedin.com/in/bobsmith', pictureUrl: '', isCompany: false } }], cursor: null }), extra: ACCOUNT_ERRORS }),
    post: op({ id: 'v2ReactToPost', tag: T.posts, summary: 'React to a post', description: 'Adds a reaction as the member.', params: [...A, 'postId'], body: reactionBody(true), bodyExample: { reaction: 'celebrate' }, success: done('reacted', 'Reacted.'), status: 201, extra: ACCOUNT_ERRORS_W }),
  },
};

const INSIGHT_OPS = {
  '/accounts/{accountId}/companies/{identifier}': {
    get: op({ id: 'v2GetCompany', tag: T.insights, summary: 'Get a company', description: 'A company page, by public identifier or id. `website` is the company\'s own site; every other link points to LinkedIn.', params: [...A, 'identifier'], success: ok('The company.', { type: 'object' }, { companyId: '1035', name: 'Acme Inc.', publicIdentifier: 'acme-inc', profileUrl: 'https://www.linkedin.com/company/acme-inc', tagline: 'Everything, delivered', website: 'https://acme.example', industry: ['Software'], employeeCount: 250, followersCount: 8400 }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/profile-viewers': {
    get: op({ id: 'v2ListProfileViewers', tag: T.insights, summary: 'Who viewed the profile', description: 'Recent viewers. LinkedIn hides some on free accounts: those rows have `kind: "locked"` and `limited` is `true`.', params: A, query: [q('start', 'Offset to start from.', 0, { type: 'integer', minimum: 0 })], success: ok('Viewers.', { type: 'object', properties: { viewers: { type: 'array', items: { type: 'object' } }, limited: { type: 'boolean' } } }, { viewers: [{ kind: 'member', name: 'Cara Diaz', headline: 'VP Sales', viewedAgo: '2 days ago' }], limited: false }), extra: ACCOUNT_ERRORS }),
  },
  '/accounts/{accountId}/inmail-balance': {
    get: op({ id: 'v2GetInmailBalance', tag: T.insights, summary: 'InMail balance', description: 'Remaining InMail credits. `null` means LinkedIn did not report it, not zero.', params: A, success: ok('Balance.', { type: 'object', properties: { premium: { type: ['integer', 'null'] }, recruiter: { type: ['integer', 'null'] }, salesNavigator: { type: ['integer', 'null'] } } }, { premium: 5, recruiter: null, salesNavigator: null }), extra: ACCOUNT_ERRORS }),
  },
};

const merge = (...parts) => {
  const out = {};
  for (const part of parts) {
    for (const [path, item] of Object.entries(part)) out[path] = { ...(out[path] || {}), ...item };
  }
  return out;
};

const errorResponse = (description, code, message, status) => ({
  description,
  content: { 'application/json': { schema: ref('V2Error'), example: { success: false, code, message, status } } },
});

const person = { type: 'object', properties: { providerId: { type: 'string' }, name: { type: 'string' }, profileUrl: { type: 'string' } } };
const eventBase = { accountId: ID, orgId: ID, orgExternalId: { type: 'string', description: "The organisation's `externalId` (the customer's email address)." } };

export const OPENAPI_V2 = {
  openapi: '3.1.0',
  info: {
    title: 'Spurly organisation API',
    version: '2.0.0',
    summary: 'Partners, organisations and their LinkedIn accounts: connect, message, search, post, and meter.',
    description:
      'The Spurly organisation API (/v2) groups LinkedIn accounts under organisations that belong to your partner account. Connect a member, call LinkedIn on their behalf through Spurly, and read usage and events.',
    contact: { name: 'Spurly', email: 'founders@getspurly.com', url: 'https://www.getspurly.com/developers' },
  },
  servers: [{ url: 'https://api.getspurly.com/v2', description: 'Production' }],
  security: [{ apiKey: [] }],
  tags: [
    { name: T.orgs, description: 'One organisation per customer of yours.' },
    { name: T.connect, description: 'Sign a LinkedIn account in under an organisation, and handle verification.' },
    { name: T.accounts, description: 'Read and disconnect an organisation\'s LinkedIn accounts.' },
    { name: T.usage, description: 'What you are billed on, and the event feed.' },
    { name: T.messaging, description: 'Chats, messages, files and reactions.' },
    { name: T.profiles, description: 'Profiles and search.' },
    { name: T.network, description: 'Invitations, connections and followers.' },
    { name: T.posts, description: 'Posts, comments and reactions.' },
    { name: T.insights, description: 'Companies, profile viewers and InMail credits.' },
  ],
  paths: merge(ORG_OPS, CONNECT_OPS, ACCOUNT_OPS, USAGE_OPS, MESSAGING_OPS, PROFILE_OPS, NETWORK_OPS, POST_OPS, INSIGHT_OPS),
  components: {
    securitySchemes: {
      apiKey: { type: 'http', scheme: 'bearer', description: 'Your partner API key: `Authorization: Bearer <key>`. Your key must be enabled for /v2.' },
    },
    parameters: {
      V2orgId: { name: 'orgId', in: 'path', required: true, description: 'The organisation\'s id.', schema: ID, example: ex.orgId },
      V2accountId: { name: 'accountId', in: 'path', required: true, description: 'The LinkedIn account\'s Spurly id, from the connect response or an account list.', schema: ID, example: ex.accountId },
      V2chatId: { name: 'chatId', in: 'path', required: true, description: 'A chat id from the chat list.', schema: { type: 'string' }, example: ex.chatId },
      V2messageId: { name: 'messageId', in: 'path', required: true, description: 'A message id.', schema: { type: 'string' }, example: ex.messageId },
      V2attachmentId: { name: 'attachmentId', in: 'path', required: true, description: 'An attachment id from a message.', schema: { type: 'string' }, example: ex.attachmentId },
      V2postId: { name: 'postId', in: 'path', required: true, description: 'A post\'s `socialId`.', schema: { type: 'string' }, example: ex.postId },
      V2invitationId: { name: 'invitationId', in: 'path', required: true, description: 'An invitation id.', schema: { type: 'string' }, example: ex.invitationId },
      V2identifier: { name: 'identifier', in: 'path', required: true, description: 'A public identifier (the part after `/in/` or `/company/`) or a LinkedIn id.', schema: { type: 'string' }, example: ex.identifier },
    },
    responses: {
      V2ValidationError: errorResponse('The request is invalid. `field` names the input.', 'INVALID_FIELD', "externalId is required: the customer's email address (up to 200 characters)", 400),
      V2Unauthorized: errorResponse('Missing, invalid or revoked API key.', 'UNAUTHORIZED', 'Invalid or revoked API key.', 401),
      V2Forbidden: errorResponse('`ORG_SUSPENDED`, `FEATURE_UNAVAILABLE` or `NOT_ENABLED` (your key is not enabled for /v2).', 'ORG_SUSPENDED', 'This organization is suspended', 403),
      V2NotFound: errorResponse('Not found, or not yours.', 'NOT_FOUND', 'Not found', 404),
      V2Conflict: errorResponse('`ACCOUNT_NOT_CONNECTED` (`details.state` says why), `ACCOUNT_NEEDS_RECONNECT`, `ALREADY_CONNECTED`, `IN_PROGRESS`, `NO_ALTERNATIVE`, `PROFILE_IN_USE` (`details.heldBy` names your own organisation when it is yours) or `PROFILE_MISMATCH`.', 'ACCOUNT_NOT_CONNECTED', 'This account is not connected.', 409),
      V2Gone: errorResponse('The sign-in expired. Start the connection again.', 'EXPIRED', 'This sign-in expired. Start the connection again.', 410),
      V2Unprocessable: errorResponse('LinkedIn refused the sign-in, or the text is too long (`TOO_LONG`).', 'TOO_LONG', 'The text is too long.', 422),
      V2RateLimited: {
        ...errorResponse('Too many requests (`RATE_LIMITED`). The connect calls answer `ORG_CONNECT_LIMIT` when your organisation used its 5 sign-in attempts for the hour, and `LINKEDIN_RATE_LIMITED` when LinkedIn asks for a pause on sign-ins. Wait `Retry-After` seconds.', 'RATE_LIMITED', 'Too many requests.', 429),
        headers: { 'Retry-After': { description: 'Seconds to wait.', schema: { type: 'integer' } } },
      },
      V2ServerError: errorResponse('Something went wrong on our side. Safe to retry a read.', 'INTERNAL', 'Something went wrong', 500),
      V2Upstream: errorResponse('LinkedIn could not be reached, or refused. Retry later.', 'PROVIDER_ERROR', 'LinkedIn could not complete that request.', 502),
      V2Timeout: errorResponse('LinkedIn did not answer in time. A write may or may not have gone through: read before you retry.', 'TIMEOUT', 'LinkedIn did not answer in time.', 504),
    },
    schemas: {
      V2Org: {
        type: 'object',
        properties: {
          id: ID,
          externalId: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['active', 'suspended'] },
          createdAt: { type: 'string', format: 'date-time' },
          accounts: { type: 'object', properties: { connected: { type: 'integer' }, total: { type: 'integer' } } },
        },
        example: exampleOrg,
      },
      V2Account: {
        type: 'object',
        properties: {
          id: ID,
          orgId: ID,
          status: { type: 'string', enum: ['OK', 'CONNECTING', 'CREDENTIALS', 'STOPPED', 'DELETED'], description: '`OK` is healthy. `CONNECTING` is a sign-in still in progress. `CREDENTIALS` needs the member to sign in again (reconnect with `accountId`). `STOPPED` is paused by LinkedIn. `DELETED` is disconnected.' },
          name: { type: 'string' },
          publicIdentifier: { type: 'string' },
          connectedAt: TS,
          disconnectedAt: TS,
        },
        example: exampleAccount,
      },
      V2ConnectState: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['connected', 'checkpoint'] },
          account: ref('V2Account'),
          connectId: { type: 'string', description: '`checkpoint` only.' },
          checkpoint: { type: 'object', properties: { type: { type: 'string', description: 'For example `OTP` (a code) or `IN_APP_VALIDATION` (approve in the LinkedIn app).' }, expiresAt: TS } },
        },
      },
      V2Usage: {
        type: 'object',
        properties: {
          window: { type: 'object', properties: { from: { type: 'string', format: 'date-time' }, to: { type: 'string', format: 'date-time' } } },
          total: ref('V2UsageStats'),
          orgs: { type: 'array', items: { allOf: [{ type: 'object', properties: { id: ID, externalId: { type: 'string' }, name: { type: 'string' } } }, ref('V2UsageStats'), { type: 'object', properties: { refusedConnects: { type: 'integer', description: 'Connects refused because the member was live elsewhere.' } } }] } },
        },
      },
      V2UsageStats: {
        type: 'object',
        properties: {
          connected: { type: 'integer', description: 'Distinct members connected at the end of the window.' },
          distinct: { type: 'integer', description: 'Distinct members connected at any time in the window.' },
          peak: { type: 'object', properties: { count: { type: 'integer' }, at: TS }, description: 'The most members connected at once.' },
        },
        example: exampleStats,
      },
      V2Chat: {
        type: 'object',
        properties: { id: { type: 'string' }, attendeeId: { type: ['string', 'null'] }, name: { type: 'string' }, folders: stringList, unreadCount: { type: 'integer' }, archived: { type: 'boolean' }, readOnly: { type: 'boolean' }, muted: { type: 'boolean' }, lastMessageAt: TS },
        example: chatEx,
      },
      V2Attendee: {
        type: 'object',
        properties: { id: { type: 'string' }, name: { type: 'string' }, isSelf: { type: 'boolean' }, hidden: { type: 'boolean' }, pictureUrl: { type: 'string' }, profileUrl: { type: 'string' }, headline: { type: 'string' }, location: { type: 'string' }, connectionDegree: { type: ['integer', 'null'] }, pendingInvitation: { type: 'boolean' } },
      },
      V2Message: {
        type: 'object',
        properties: {
          id: { type: 'string' }, chatId: { type: ['string', 'null'] }, senderId: { type: ['string', 'null'] }, isSender: { type: 'boolean', description: '`true` when the connected member sent it.' }, text: { type: 'string' }, subject: { type: 'string' },
          attachments: { type: 'array', items: ref('V2Attachment') }, reactions: { type: 'array', items: { type: 'object', properties: { emoji: { type: 'string' }, senderId: { type: ['string', 'null'] }, isMe: { type: 'boolean' } } } },
          seen: { type: 'boolean' }, delivered: { type: 'boolean' }, edited: { type: 'boolean' }, deleted: { type: 'boolean' }, sentAt: TS,
        },
        example: msgEx,
      },
      V2Attachment: {
        type: 'object',
        properties: { id: { type: 'string' }, kind: { type: 'string', enum: ['image', 'video', 'audio', 'voice', 'file'] }, name: { type: 'string' }, mimeType: { type: 'string' }, size: { type: ['integer', 'null'] }, durationMs: { type: ['integer', 'null'] }, downloadable: { type: 'boolean' } },
        example: { id: ex.attachmentId, kind: 'image', name: 'plan.png', mimeType: 'image/png', size: 48211, durationMs: null, downloadable: true },
      },
      V2Lead: {
        type: 'object',
        description: 'A LinkedIn member in a list.',
        properties: { id: { type: 'string' }, publicIdentifier: { type: 'string' }, profileUrl: { type: 'string' }, name: { type: 'string' }, headline: { type: 'string' }, location: { type: 'string' } },
        example: leadEx,
      },
      V2OwnProfile: {
        type: 'object',
        properties: { id: { type: ['string', 'null'] }, publicIdentifier: { type: 'string' }, name: { type: 'string' }, headline: { type: 'string' }, location: { type: 'string' }, pictureUrl: { type: 'string' }, openProfile: { type: 'boolean' } },
      },
      V2Profile: {
        type: 'object',
        description: 'A profile. With `sections`, adds `experience`, `education`, `skills`, `languages`, `certifications`, `volunteeringExperience` and `projects`.',
        properties: { id: { type: ['string', 'null'] }, publicIdentifier: { type: 'string' }, profileUrl: { type: 'string' }, name: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, headline: { type: 'string' }, location: { type: 'string' }, pictureUrl: { type: 'string' }, summary: { type: 'string' }, connectionDegree: { type: ['integer', 'null'] }, followerCount: { type: ['integer', 'null'] }, connectionCount: { type: ['integer', 'null'] } },
      },
      V2Post: {
        type: 'object',
        properties: { id: { type: ['string', 'null'] }, socialId: { type: ['string', 'null'], description: 'Use as `postId` in the other post calls.' }, text: { type: 'string' }, createdAt: TS, dateLabel: { type: 'string' }, url: { type: 'string' }, reactionCount: { type: ['integer', 'null'] }, commentCount: { type: ['integer', 'null'] }, repostCount: { type: ['integer', 'null'] }, isRepost: { type: 'boolean' } },
      },
      V2Error: {
        type: 'object',
        required: ['success', 'code', 'message', 'status'],
        properties: {
          success: { type: 'boolean', const: false },
          code: { type: 'string', description: 'Stable, for your code to branch on.' },
          message: { type: 'string', description: 'Written for people.' },
          field: { type: 'string', description: 'Validation errors: the input to fix.' },
          details: { type: 'object', description: 'Extra context, for example `{ state }` on `ACCOUNT_NOT_CONNECTED`.' },
          status: { type: 'integer', description: 'The HTTP status, repeated.' },
        },
      },
      V2Event: {
        type: 'object',
        description: 'Every webhook delivery and every event in the feed. `data` depends on `type`.',
        required: ['id', 'type', 'createdAt', 'data'],
        properties: {
          id: { type: 'string', description: 'Stable and unique. Use it to drop duplicates and as the `after` cursor.' },
          type: { type: 'string', enum: ['account.updated', 'message.created', 'message.updated'] },
          createdAt: { type: 'string', format: 'date-time' },
          data: { type: 'object' },
          delivery: { type: 'object', description: 'Feed only: how the webhook delivery went.', properties: { deliveredAt: TS, attempts: { type: 'integer' }, lastStatus: { type: ['integer', 'null'] } } },
        },
      },
      V2AccountEvent: {
        type: 'object',
        description: '`account.updated`: a LinkedIn account connected, needs a new sign-in, or disconnected.',
        properties: { id: { type: 'string' }, type: { type: 'string', const: 'account.updated' }, createdAt: { type: 'string', format: 'date-time' }, data: { type: 'object', properties: { ...eventBase, previousStatus: { type: 'string' }, account: ref('V2Account') } } },
      },
      V2MessageCreatedEvent: {
        type: 'object',
        description: '`message.created`: a new message, sent or received.',
        properties: {
          id: { type: 'string' }, type: { type: 'string', const: 'message.created' }, createdAt: { type: 'string', format: 'date-time' },
          data: { type: 'object', properties: { ...eventBase, chatId: { type: 'string' }, message: { type: 'object', properties: { id: { type: 'string' }, chatId: { type: 'string' }, direction: { type: 'string', enum: ['inbound', 'outbound'] }, text: { type: 'string' }, sentAt: TS, delivered: { type: 'boolean' }, edited: { type: 'boolean' }, deleted: { type: 'boolean' }, attachments: { type: 'array', items: ref('V2Attachment') }, sender: person } }, attendees: { type: 'array', items: person } } },
        },
      },
      V2MessageUpdatedEvent: {
        type: 'object',
        description: '`message.updated`: a message was edited, deleted, delivered, read or reacted to.',
        properties: {
          id: { type: 'string' }, type: { type: 'string', const: 'message.updated' }, createdAt: { type: 'string', format: 'date-time' },
          data: { type: 'object', properties: { ...eventBase, change: { type: 'string', enum: ['edited', 'deleted', 'delivered', 'read', 'reaction'] }, chatId: { type: 'string' }, messageId: { type: 'string' }, message: { type: 'object', description: 'Present for `edited`, `deleted` and `delivered`.' }, reaction: { type: 'object', description: '`reaction` only.', properties: { emoji: { type: 'string' }, fromMe: { type: 'boolean' }, senderProviderId: { type: 'string' } } }, at: TS } },
        },
      },
    },
  },
};
