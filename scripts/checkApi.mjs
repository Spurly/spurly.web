/**
 * Checks the LIVE Spurly LinkedIn API against its documentation.
 *
 * Every call made here is looked up in the OpenAPI spec the docs are built from
 * (src/products/pages/developers/openapi.js) and its response is validated
 * against the documented schema for that status code. Anything the docs
 * promise that the API does not do is a FAIL.
 *
 *   npm run api:check -- --key spk_partner_...                 safe checks only (no LinkedIn)
 *   npm run api:check -- --key ... --webhook https://...        + webhook set / test delivery
 *   npm run api:check -- --key ... --connect                    + connect a real LinkedIn account (asks for details)
 *   npm run api:check -- --key ... --connect --send             + send one real message (asks which chat and what)
 *   options: --base https://api.getspurly.com/v1 (default)  --external <id>  --disconnect
 *            --rotate (also rotates the webhook secret: only with a throwaway test partner)
 *
 * Use a TEST partner key, never a customer's. Each run creates one account
 * (externalId "doc-check-<time>" unless --external is given).
 */
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { OPENAPI, operationById, resolveRef } from '../src/products/pages/developers/openapi.js';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const BASE = opt('base', 'https://api.getspurly.com/v1').replace(/\/$/, '');
const KEY = opt('key', process.env.SPURLY_API_KEY || '');
const EXTERNAL = opt('external', `doc-check-${Date.now()}`);
const WEBHOOK = opt('webhook', '');

if (!KEY) {
  console.error('Pass --key spk_partner_... (a TEST partner key) or set SPURLY_API_KEY.');
  process.exit(2);
}

/* --------------------------- schema validation --------------------------- */

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

/** Minimal JSON Schema check for the keywords the spec uses. Returns a list of problems. */
function validate(value, schema, path = '$') {
  if (!schema) return [];
  if (schema.$ref) return validate(value, resolveRef(schema), path);
  const out = [];
  if (schema.const !== undefined && value !== schema.const) out.push(`${path}: expected ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
  if (schema.type) {
    const types = [].concat(schema.type);
    const t = typeOf(value);
    const ok = types.includes(t) || (t === 'integer' && types.includes('number'));
    if (!ok) return [...out, `${path}: expected ${types.join('|')}, got ${t}`];
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) out.push(`${path}: ${JSON.stringify(value)} is not one of ${schema.enum.join(', ')}`);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required || []) if (!(key in value)) out.push(`${path}.${key}: missing (documented as required)`);
    for (const [key, sub] of Object.entries(schema.properties || {})) {
      if (key in value) out.push(...validate(value[key], sub, `${path}.${key}`));
    }
  }
  if (Array.isArray(value) && schema.items) value.forEach((item, i) => out.push(...validate(item, schema.items, `${path}[${i}]`)));
  return out;
}

/** The documented schema for an operation's response status, or null when undocumented. */
function documentedResponse(operationId, status) {
  const op = operationById(operationId);
  if (!op) throw new Error(`No operation ${operationId} in the spec`);
  const raw = op.responses[String(status)];
  if (!raw) return { undocumented: true };
  const res = resolveRef(raw);
  return { schema: res.content?.['application/json']?.schema ?? null, binary: Boolean(res.content?.['application/octet-stream']) };
}

/* ------------------------------- reporting ------------------------------- */

const results = [];
const covered = new Set();

function report(ok, label, detail = '') {
  results.push({ ok, label, detail });
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? `\n        ${detail.split('\n').join('\n        ')}` : ''}`);
}

/* --------------------------------- calls --------------------------------- */

async function call(operationId, { path, method, body, query, key = KEY, expect, raw = false }) {
  covered.add(operationId);
  const url = `${BASE}${path}${query ? `?${new URLSearchParams(query)}` : ''}`;
  const headers = {};
  if (key) headers.Authorization = `Bearer ${key}`;
  if (body !== undefined && !raw) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : raw ? body : JSON.stringify(body) });
  } catch (error) {
    report(false, `${operationId} ${method} ${path}`, `request failed: ${error.message}`);
    return { status: 0, json: null };
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* binary or empty */ }

  const problems = [];
  if (expect && !expect.includes(res.status)) problems.push(`status ${res.status}, expected ${expect.join(' or ')}${json?.message ? ` (${json.code}: ${json.message})` : ''}`);

  const doc = documentedResponse(operationId, res.status);
  if (doc.undocumented) problems.push(`status ${res.status} is not documented for ${operationId}`);
  else if (doc.schema && json === null) problems.push('documented as JSON, body is not JSON');
  else if (doc.schema) problems.push(...validate(json, doc.schema));

  if (/unipile/i.test(text)) problems.push('response mentions the vendor ("unipile")');
  if (!res.headers.get('x-ratelimit-limit') && res.status !== 401) problems.push('missing X-RateLimit-Limit header');

  report(problems.length === 0, `${operationId}  ${method} ${path}${query ? `?${new URLSearchParams(query)}` : ''} -> ${res.status}`, problems.join('\n'));
  return { status: res.status, json, headers: res.headers };
}

const rl = readline.createInterface({ input: stdin, output: stdout });
const ask = async (q) => (await rl.question(`  ? ${q} `)).trim();

/** Ask without echoing what is typed (passwords, cookies). Falls back to plain input when not a TTY. */
async function askSecret(q) {
  if (!stdin.isTTY) return ask(q);
  const write = rl._writeToOutput?.bind(rl);
  rl._writeToOutput = (text) => { if (text.includes(q)) write?.(text); };
  const answer = await rl.question(`  ? ${q} `);
  rl._writeToOutput = write;
  stdout.write('\n');
  return answer.trim();
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* --------------------------------- flow ---------------------------------- */

async function main() {
  console.log(`\nChecking ${BASE} against the docs (OpenAPI ${OPENAPI.info.version})\n`);

  console.log('Authentication');
  await call('listAccounts', { path: '/accounts', method: 'GET', key: '', expect: [401] });
  await call('listAccounts', { path: '/accounts', method: 'GET', key: 'spk_partner_wrongwrongwrongwrongwrongwrongwrongwrongwro', expect: [401] });

  console.log('\nAccounts');
  const created = await call('createAccount', { path: '/accounts', method: 'POST', body: { externalId: EXTERNAL, name: 'Docs check' }, expect: [201, 200] });
  const accountId = created.json?.data?.account?.id;
  if (!accountId) throw new Error('Could not create an account; stopping.');
  const again = await call('createAccount', { path: '/accounts', method: 'POST', body: { externalId: EXTERNAL }, expect: [200] });
  report(again.json?.data?.account?.id === accountId, 'createAccount is idempotent on externalId (same id twice)');
  const bad = await call('createAccount', { path: '/accounts', method: 'POST', body: { externalId: 'has spaces' }, expect: [400] });
  report(bad.json?.code === 'INVALID_EXTERNAL_ID', 'invalid externalId answers INVALID_EXTERNAL_ID', bad.json?.code);
  const list = await call('listAccounts', { path: '/accounts', method: 'GET', query: { limit: 100 }, expect: [200] });
  report(Boolean(list.json?.data?.accounts?.some((a) => a.id === accountId)) || (list.json?.data?.pagination?.total ?? 0) > 100, 'listAccounts includes the new account');
  await call('getAccount', { path: `/accounts/${accountId}`, method: 'GET', expect: [200] });
  const missing = await call('getAccount', { path: '/accounts/000000000000000000000000', method: 'GET', expect: [404] });
  report(missing.json?.code === 'ACCOUNT_NOT_FOUND', 'unknown account answers ACCOUNT_NOT_FOUND', missing.json?.code);

  console.log('\nLinkedIn connection (no sign-in)');
  await call('getConnectOptions', { path: '/linkedin/connect-options', method: 'GET', query: { endUserIp: '49.36.1.1' }, expect: [200] });
  const empty = await call('connectLinkedin', { path: `/accounts/${accountId}/linkedin/connect`, method: 'POST', body: { method: 'credentials', username: '', password: '' }, expect: [400] });
  report(empty.json?.code === 'MISSING_FIELD' && Boolean(empty.json?.field), 'empty sign-in answers MISSING_FIELD with a field', `${empty.json?.code} field=${empty.json?.field}`);

  console.log('\nInbox (before LinkedIn is connected)');
  await call('getInboxStatus', { path: `/accounts/${accountId}/inbox`, method: 'GET', expect: [200] });
  await call('listChats', { path: `/accounts/${accountId}/chats`, method: 'GET', expect: [200] });
  const noChat = await call('getChat', { path: `/accounts/${accountId}/chats/000000000000000000000000`, method: 'GET', expect: [404] });
  report(noChat.json?.code === 'CHAT_NOT_FOUND', 'unknown conversation answers CHAT_NOT_FOUND', noChat.json?.code);
  await call('sendMessage', { path: `/accounts/${accountId}/chats/000000000000000000000000/messages`, method: 'POST', body: { text: 'x' }, expect: [404] });
  await call('markChatRead', { path: `/accounts/${accountId}/chats/000000000000000000000000/read`, method: 'POST', expect: [404] });
  await call('reactToMessage', { path: `/accounts/${accountId}/messages/000000000000000000000000/reaction`, method: 'POST', body: { emoji: '👍' }, expect: [404, 409] });
  if (!flag('connect')) {
    await call('syncInbox', { path: `/accounts/${accountId}/inbox/sync`, method: 'POST', expect: [202, 409] });
    await call('startConversation', { path: `/accounts/${accountId}/conversations`, method: 'POST', body: { profile: 'https://www.linkedin.com/in/williamhgates', text: 'x' }, expect: [409] });
    const bad = await call('startConversation', { path: `/accounts/${accountId}/conversations`, method: 'POST', body: { profile: 'not a profile!', text: 'x' }, expect: [400] });
    report(bad.json?.code === 'INVALID_PROFILE', 'bad profile answers INVALID_PROFILE', bad.json?.code);
    await call('sendMedia', { path: `/accounts/${accountId}/chats/000000000000000000000000/media`, method: 'POST', query: { kind: 'attachment', filename: 'a.pdf' }, raw: true, body: new Blob([new Uint8Array([37, 80, 68, 70])], { type: 'application/pdf' }), expect: [404, 409] });
    await call('disconnectLinkedin', { path: `/accounts/${accountId}/linkedin`, method: 'DELETE', expect: [200] });
  }

  console.log('\nWebhooks and events');
  const hook = await call('getWebhook', { path: '/webhook', method: 'GET', expect: [200] });
  const previousUrl = hook.json?.data?.url ?? '';
  await call('setWebhook', { path: '/webhook', method: 'PUT', body: { url: 'ftp://not-https' }, expect: [400] });
  if (WEBHOOK) {
    await call('setWebhook', { path: '/webhook', method: 'PUT', body: { url: WEBHOOK }, expect: [200] });
    const test = await call('testWebhook', { path: '/webhook/test', method: 'POST', expect: [200] });
    report(test.json?.data?.delivered === true, `test event delivered to ${WEBHOOK}`, test.json?.data?.error || `your endpoint answered ${test.json?.data?.status}`);
    if (previousUrl !== WEBHOOK) await call('setWebhook', { path: '/webhook', method: 'PUT', body: { url: previousUrl }, expect: [200] });
  } else {
    console.log('  skip  webhook delivery (pass --webhook https://... to test it)');
  }
  const events = await call('listEvents', { path: '/events', method: 'GET', query: { limit: 5 }, expect: [200] });
  if (events.json?.data?.events?.length) {
    const first = events.json.data.events[0];
    const schema = OPENAPI.webhooks[first.type]?.post?.requestBody?.content?.['application/json']?.schema;
    const problems = schema ? validate(first, schema) : [`event type ${first.type} is not documented`];
    report(problems.length === 0, `event ${first.type} matches its documented payload`, problems.join('\n'));
  }
  await call('listEvents', { path: '/events', method: 'GET', query: { after: 'not-an-id' }, expect: [400] });
  if (flag('rotate')) {
    const rot = await call('rotateWebhookSecret', { path: '/webhook/rotate-secret', method: 'POST', expect: [200] });
    report(/^whsec_/.test(rot.json?.data?.webhookSecret || ''), 'rotated secret looks like whsec_...', 'NOTE: the old secret no longer works; save the new one');
  }

  if (flag('connect')) await connectFlow(accountId);
  else console.log('\n  skip  LinkedIn sign-in, inbox and sending (pass --connect to test with a real LinkedIn account)');

  const missed = OPENAPI && [...Object.values(OPENAPI.paths)].flatMap((p) => Object.values(p)).map((o) => o.operationId).filter((id) => !covered.has(id));
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed. Account used: ${accountId} (externalId ${EXTERNAL}).`);
  if (missed.length) console.log(`Not exercised this run: ${missed.join(', ')}`);
  rl.close();
  process.exit(failed.length ? 1 : 0);
}

async function connectFlow(accountId) {
  console.log('\nLinkedIn sign-in (real account; nothing is stored but the session)');
  const method = (await ask('Sign in with [1] email and password or [2] session cookie?')) === '2' ? 'cookies' : 'credentials';
  const body = { method, endUserIp: (await ask('Your public IP (blank to skip):')) || undefined };
  if (method === 'credentials') {
    body.username = await ask('LinkedIn email or phone:');
    body.password = await askSecret('LinkedIn password (hidden):');
  } else {
    body.accessToken = await askSecret('li_at cookie value (hidden):');
  }
  let res = await call('connectLinkedin', { path: `/accounts/${accountId}/linkedin/connect`, method: 'POST', body, expect: [200] });
  let guard = 0;
  while (res.json?.data?.state === 'checkpoint' && guard < 40) {
    guard += 1;
    const type = res.json.data.checkpoint?.type;
    if (type === 'IN_APP_VALIDATION') {
      console.log('  ...  approve the sign-in in the LinkedIn app; polling every 4 seconds');
      await sleep(4000);
      res = await call('pollCheckpoint', { path: `/accounts/${accountId}/linkedin/checkpoint/status`, method: 'POST', expect: [200] });
    } else {
      const code = await ask(type === 'PHONE_REGISTER' ? 'LinkedIn wants a phone number, as (+91)9876543210:' : `${type} code (or "resend"):`);
      if (code === 'resend') {
        await call('resendCheckpoint', { path: `/accounts/${accountId}/linkedin/checkpoint/resend`, method: 'POST', expect: [200] });
        continue;
      }
      res = await call('solveCheckpoint', { path: `/accounts/${accountId}/linkedin/checkpoint`, method: 'POST', body: { code }, expect: [200] });
    }
  }
  if (res.json?.data?.state !== 'connected') return report(false, 'LinkedIn connected', JSON.stringify(res.json));

  const acc = await call('getAccount', { path: `/accounts/${accountId}`, method: 'GET', expect: [200] });
  report(['connected', 'connecting'].includes(acc.json?.data?.account?.linkedin?.state), 'account shows the LinkedIn connection', acc.json?.data?.account?.linkedin?.state);

  console.log('  ...  waiting up to 3 minutes for the first conversations to import');
  let chats = [];
  for (let i = 0; i < 18 && !chats.length; i += 1) {
    await sleep(10_000);
    await call('getInboxStatus', { path: `/accounts/${accountId}/inbox`, method: 'GET', expect: [200] });
    const page = await call('listChats', { path: `/accounts/${accountId}/chats`, method: 'GET', query: { limit: 5 }, expect: [200] });
    chats = page.json?.data?.chats || [];
  }
  report(chats.length > 0, 'conversations imported', chats.length ? '' : 'none yet; the import may still be running, re-run later');
  if (!chats.length) return;
  const thread = await call('getChat', { path: `/accounts/${accountId}/chats/${chats[0].id}`, method: 'GET', expect: [200] });
  const withFile = (thread.json?.data?.messages || []).flatMap((m) => m.attachments.filter((a) => a.downloadable).map((a) => ({ m, a })))[0];
  if (withFile) await call('downloadAttachment', { path: `/accounts/${accountId}/messages/${withFile.m.id}/attachments/${encodeURIComponent(withFile.a.id)}`, method: 'GET', expect: [200] });
  await call('markChatRead', { path: `/accounts/${accountId}/chats/${chats[0].id}/read`, method: 'POST', expect: [200] });

  if (flag('send')) {
    chats.forEach((c, i) => console.log(`        [${i + 1}] ${c.name}: ${c.lastMessageText.slice(0, 60)}`));
    const pick = Number(await ask('Send a test message to which conversation? (number, blank to skip)'));
    if (pick >= 1 && pick <= chats.length) {
      const text = (await ask('Message text:')) || 'Test from the Spurly API';
      const sent = await call('sendMessage', { path: `/accounts/${accountId}/chats/${chats[pick - 1].id}/messages`, method: 'POST', body: { text }, expect: [201] });
      const messageId = sent.json?.data?.message?.id;
      console.log('  ...  looking for its message.created event');
      let seen = false;
      for (let i = 0; i < 6 && !seen && messageId; i += 1) {
        await sleep(3000);
        const feed = await call('listEvents', { path: '/events', method: 'GET', query: { type: 'message.created', limit: 200 }, expect: [200] });
        seen = (feed.json?.data?.events || []).some((e) => e.data?.message?.id === messageId);
      }
      report(seen, 'message.created event recorded for the sent message');
    }
  }

  if (flag('disconnect')) await call('disconnectLinkedin', { path: `/accounts/${accountId}/linkedin`, method: 'DELETE', expect: [200] });
}

main().catch((error) => {
  console.error(`\nStopped: ${error.message}`);
  rl.close();
  process.exit(1);
});
