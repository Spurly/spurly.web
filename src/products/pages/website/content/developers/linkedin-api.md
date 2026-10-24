---
title: Spurly LinkedIn API
seoTitle: Spurly LinkedIn API for Inbox and Account Sync | Spurly
shortTitle: LinkedIn API
description: Connect your users' LinkedIn accounts, sync their inbox and send and receive messages in real time with the Spurly LinkedIn API.
path: /developers/linkedin-api
template: page
date: 2026-10-24
priority: 0.5
target_query: linkedin messaging api
faq:
  - q: Who is the Spurly LinkedIn API for?
    a: Software companies that want their own users to connect LinkedIn and use their LinkedIn inbox inside their product. Spurly runs the LinkedIn connection, sync and delivery; you build the experience.
  - q: How do I get an API key?
    a: API access is set up with each partner. Book a call with us and we issue a key and a webhook signing secret.
  - q: Is it real time?
    a: Yes. New messages, read receipts, reactions, edits and LinkedIn connection changes are pushed to your webhook within seconds, and every event is also kept for 30 days so you can catch up after downtime.
  - q: Does Spurly store LinkedIn passwords?
    a: No. The password or session cookie is used once to sign in and is never stored.
  - q: Does Spurly limit how many messages I send?
    a: Not on this API. Messages are sent immediately; pacing is up to your product.
---
The Spurly LinkedIn API lets your product connect your users' LinkedIn accounts, sync their full inbox and send and receive LinkedIn messages in real time. Spurly handles the LinkedIn sign-in, verification codes, history sync and live delivery. You build the screens.

API access is set up per partner. [Book a call](/book-demo) to get a key.

## Basics

- **Base URL:** `https://api.getspurly.com/v1`
- **Auth:** send `Authorization: Bearer spk_partner_...` on every request. Keep the key on your servers, never in a browser or app.
- **Format:** JSON in and out. Success is `{ "success": true, "data": {...} }`. Failure is `{ "success": false, "message": "...", "code": "..." }` with a matching HTTP status. The `message` on a 4xx is written for people, so you can show it.
- **Ids:** all ids are Spurly's own. `externalId` is yours.
- **Real time:** webhooks for messages and LinkedIn connection state, plus a catch-up feed. See [Webhooks](#webhooks).

## Accounts

Create one Spurly account per user of yours whose LinkedIn you connect.

### Create or fetch an account

`POST /accounts`

```json
{ "externalId": "user_123", "name": "Jane Doe" }
```

Idempotent on `externalId`: the first call answers `201`, later calls answer `200` with the same account. `externalId` is 1 to 128 characters: letters, digits and `. _ : @ -`.

```json
{
  "account": {
    "id": "6719f0c2a1b2c3d4e5f60718",
    "externalId": "user_123",
    "name": "Jane Doe",
    "linkedin": {
      "state": "connected",
      "name": "Jane Doe",
      "profileUrl": "https://www.linkedin.com/in/janedoe",
      "isPremium": false,
      "connectedAt": "2026-10-24T06:00:00.000Z"
    },
    "createdAt": "2026-10-24T05:58:00.000Z"
  }
}
```

`linkedin.state` is one of:

| State | Meaning | What to do |
|---|---|---|
| `not_connected` | No LinkedIn account, or it was disconnected | Show "Connect LinkedIn" |
| `connecting` | Signed in, LinkedIn is finishing setup | Wait; an `account.updated` webhook follows |
| `connected` | Live: inbox syncing, sending works | Nothing |
| `needs_reconnect` | LinkedIn ended the session (password change, sign-out everywhere, security check) | Run the connect flow again |

Every change of state is pushed to your webhook as `account.updated` within seconds.

### List and get

- `GET /accounts?page=1&limit=30` returns `{ accounts, pagination: { page, limit, total } }`.
- `GET /accounts/:accountId` returns `{ account }`.

## Connect LinkedIn

Two sign-in methods, the same as Spurly's own "Connect your LinkedIn" dialog: **email and password**, or a **session cookie**. Build the form in your product and send what the person entered from your server.

### Sign-in options

`GET /linkedin/connect-options?endUserIp=49.36.1.1` returns `{ "detectedCountry": "IN" }`. Use it to label the "Automatic" location choice.

### Sign in with email and password

`POST /accounts/:accountId/linkedin/connect`

```json
{
  "method": "credentials",
  "username": "jane@acme.com",
  "password": "their-password",
  "endUserIp": "49.36.1.1",
  "sync": { "chats": true, "messages": true },
  "location": { "mode": "auto" }
}
```

### Sign in with a session cookie

```json
{
  "method": "cookies",
  "accessToken": "value of the li_at cookie",
  "premiumToken": "value of the li_a cookie (Sales Navigator or Recruiter only, optional)",
  "userAgent": "the user agent of the browser the cookie came from (recommended)",
  "endUserIp": "49.36.1.1"
}
```

### Options

- `endUserIp`: **send the person's own IP address.** With automatic location, LinkedIn then sees the sign-in from their country. Without it the sign-in appears to come from your servers, and LinkedIn asks for more verification.
- `location`: `{ "mode": "auto" }` (the default), `{ "mode": "country", "country": "IN" }`, or `{ "mode": "proxy", "proxy": { "protocol": "http", "host": "proxy.example.com", "port": 8080, "username": "u", "password": "p" } }`.
- `sync`: `{ "chats": true, "messages": true }` imports the full history, which is the default. Set either to `false` to skip it.
- The password or cookie is used once to sign in and is never stored.

### Responses

Every connect step answers one of two states:

```json
{ "state": "connected", "account": { "id": "...", "linkedin": { "state": "connected" } } }
```

```json
{ "state": "checkpoint", "checkpoint": { "type": "OTP", "expiresAt": null }, "account": { } }
```

### Verification checkpoints

LinkedIn often asks the person to verify a new sign-in. Keep going until the state is `connected`.

| Checkpoint type | Show the person | Then call |
|---|---|---|
| `OTP`, `2FA`, `PHONE_REGISTER` | "Enter the code LinkedIn sent you" | `POST /accounts/:accountId/linkedin/checkpoint` with `{ "code": "123456" }` |
| `IN_APP_VALIDATION` | "Approve the sign-in in your LinkedIn app" | `POST /accounts/:accountId/linkedin/checkpoint/status` every 3 to 5 seconds, or wait for `account.updated` |

Also available:

- `POST /accounts/:accountId/linkedin/checkpoint/resend` sends the code again.
- `POST /accounts/:accountId/linkedin/checkpoint/another-way` switches to another verification method.

### Errors

Errors carry a `code` and sometimes a `field` naming the input to highlight (`username`, `password`, `accessToken`, `country`, `proxyPort`). Common codes:

| Code | Meaning |
|---|---|
| `INVALID_CREDENTIALS` | Wrong email or password |
| `INVALID_COOKIE` | The session cookie is wrong or expired |
| `INVALID_CODE` | Wrong verification code |
| `EXPIRED` | The verification timed out; start again |
| `ALREADY_CONNECTED` | This account already has a live LinkedIn connection |
| `ACCOUNT_RESTRICTED` | LinkedIn has restricted this LinkedIn account |
| `RATE_LIMITED` | Too many attempts; wait and retry |

### Disconnect

`DELETE /accounts/:accountId/linkedin` signs the LinkedIn account out. Connect again at any time.

## Inbox

After LinkedIn connects, Spurly imports the conversation history in the background. A large inbox takes a few minutes on the first sync. From then on, new messages arrive live, both the ones received and the ones sent from LinkedIn itself.

### Status

`GET /accounts/:accountId/inbox`

```json
{
  "connected": true,
  "chats": 45,
  "unread": 3,
  "historyPending": 0,
  "sync": {
    "status": "done",
    "chatsSeen": 45,
    "messagesImported": 326,
    "lastRunAt": "2026-10-24T06:05:00.000Z",
    "firstCompletedAt": "2026-10-24T06:03:00.000Z",
    "error": ""
  },
  "liveFeedSeenAt": "2026-10-24T06:10:00.000Z"
}
```

`POST /accounts/:accountId/inbox/sync` queues a fresh history sync and answers `202`.

### Conversations

`GET /accounts/:accountId/chats?page=1&limit=30` returns the most recently active conversations first. Filters: `unread=true`, `q=bob` (name or last message).

```json
{
  "chats": [
    {
      "id": "6719f1aa...",
      "name": "Bob Smith",
      "headline": "CTO at Acme",
      "profileUrl": "https://www.linkedin.com/in/bob",
      "pictureUrl": "https://...",
      "connectionDegree": 1,
      "unreadCount": 2,
      "lastMessageAt": "2026-10-24T06:09:00.000Z",
      "lastMessageText": "Sounds good",
      "lastMessageDirection": "inbound",
      "readOnly": false
    }
  ],
  "pagination": { "page": 1, "limit": 30, "total": 45 }
}
```

### Messages

`GET /accounts/:accountId/chats/:chatId?page=1&limit=50`. Page 1 holds the most recent messages; inside a page they run oldest to newest.

```json
{
  "chat": { "id": "6719f1aa...", "name": "Bob Smith" },
  "messages": [
    {
      "id": "6719f2bb...",
      "chatId": "6719f1aa...",
      "direction": "inbound",
      "text": "Sounds good",
      "sentAt": "2026-10-24T06:09:00.000Z",
      "delivered": true,
      "seen": false,
      "seenAt": null,
      "edited": false,
      "deleted": false,
      "attachments": [
        { "id": "att_1", "kind": "image", "name": "plan.png", "mimeType": "image/png", "size": 48211, "durationMs": null, "downloadable": true }
      ],
      "reactions": [{ "emoji": "👍", "fromMe": true, "at": "2026-10-24T06:10:00.000Z" }]
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 12 },
  "historyPending": false
}
```

`historyPending: true` means the background sync has not reached this conversation's older messages yet. For your own outbound messages, `seen` turns true when the other person reads them.

### Reply in a conversation

`POST /accounts/:accountId/chats/:chatId/messages`

```json
{ "text": "Thanks Bob, talk Monday." }
```

Answers `201` with `{ "sent": true, "message": {...} }`. Up to 8000 characters.

### Message someone new

`POST /accounts/:accountId/conversations`

```json
{ "profile": "https://www.linkedin.com/in/bob", "text": "Hi Bob, great meeting you today." }
```

`profile` is a LinkedIn profile URL or public identifier. If a conversation with that person already exists the message goes into it, so there is never a second thread. Answers `201` with `{ "sent", "created", "chat", "message" }`. LinkedIn only lets you message your 1st-degree connections and open profiles; anyone else is refused with LinkedIn's reason.

### Send a file, voice note or video

`POST /accounts/:accountId/chats/:chatId/media?kind=attachment&filename=plan.pdf&text=Here%20it%20is`

The request body is the raw file, with its `Content-Type` header (for example `application/pdf` or `image/png`). `kind` is `attachment`, `voice` or `video`. `text` is an optional caption.

### React to a message

`POST /accounts/:accountId/messages/:messageId/reaction` with `{ "emoji": "👍" }`.

### Download an attachment

`GET /accounts/:accountId/messages/:messageId/attachments/:attachmentId` streams the file with its content type. Only attachments with `downloadable: true` can be fetched.

### Mark as read

`POST /accounts/:accountId/chats/:chatId/read` clears the unread count. It does not send a read receipt on LinkedIn.

### Sending limits

This API applies no pacing or daily limits: every send goes out immediately. LinkedIn still has its own limits, so pace bulk sending in your product.

### Errors when sending

| Code | Meaning |
|---|---|
| `CHAT_READ_ONLY` | LinkedIn does not allow replies in this conversation |
| `SEND_UNCONFIRMED` | LinkedIn did not confirm the send. It may have gone out, so check before sending again |
| `LINKEDIN_ACCOUNT_NOT_READY` | The LinkedIn connection needs attention (see `linkedin.state`) |
| `NO_LINKEDIN_ACCOUNT` | Connect LinkedIn first |
| `PROFILE_NOT_FOUND` | No LinkedIn profile at that URL or identifier |

## Webhooks

Give Spurly an HTTPS URL and every event is POSTed to it within seconds.

### Manage your webhook

- `PUT /webhook` with `{ "url": "https://your-app.com/spurly/webhook" }` sets the URL. Send `""` to turn webhooks off.
- `GET /webhook` shows the current URL.
- `POST /webhook/test` sends a signed `webhook.test` event and answers with whether your endpoint accepted it.
- `POST /webhook/rotate-secret` issues a new signing secret. The old one stops working at once.

### Events

| Event | When |
|---|---|
| `message.created` | A new message, received or sent. `origin` is `linkedin` (arrived from LinkedIn, including messages the person sent from LinkedIn itself) or `api` (sent through this API) |
| `message.updated` | A message changed. `change` is `read`, `reaction`, `message_edited`, `message_deleted` or `message_delivered` |
| `account.updated` | The LinkedIn connection state changed, with `previousState` and the full `account` |

### Payloads

Every event has a stable `id`, a `type`, `createdAt` and `data`.

```json
{
  "id": "evt_6719f2c0a1b2c3d4e5f60799",
  "type": "message.created",
  "createdAt": "2026-10-24T06:09:01.000Z",
  "data": {
    "accountId": "6719f0c2a1b2c3d4e5f60718",
    "externalId": "user_123",
    "origin": "linkedin",
    "chat": { "id": "6719f1aa...", "name": "Bob Smith", "unreadCount": 1 },
    "message": { "id": "6719f2bb...", "direction": "inbound", "text": "Sounds good" }
  }
}
```

```json
{
  "id": "evt_6719f3d1a1b2c3d4e5f60800",
  "type": "account.updated",
  "createdAt": "2026-10-24T06:20:00.000Z",
  "data": {
    "accountId": "6719f0c2a1b2c3d4e5f60718",
    "externalId": "user_123",
    "previousState": "connected",
    "account": { "id": "6719f0c2a1b2c3d4e5f60718", "linkedin": { "state": "needs_reconnect" } }
  }
}
```

### Verify the signature

Every delivery carries `X-Spurly-Event` and `X-Spurly-Signature: t=<unix seconds>,v1=<hex>`. Compute an HMAC-SHA256 of `t + "." + rawBody` with your webhook secret and compare it to `v1`. Reject it if it differs or if `t` is more than 5 minutes old. Use the raw body, before parsing the JSON.

```js
import crypto from "node:crypto";

export function verifySpurly(rawBody, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) < 300;
  return fresh && expected.length === parts.v1.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
```

### Delivery and catch-up

Answer with any `2xx` quickly and do the work afterwards. A failed delivery is retried after about 5 seconds and again after about 60 seconds. Use the event `id` to ignore duplicates.

Every event is also kept for 30 days. After downtime, read everything after the last event you processed:

`GET /events?after=evt_6719f2c0a1b2c3d4e5f60799&limit=100`

```json
{ "events": [ { "id": "evt_...", "type": "message.created", "data": {} } ], "hasMore": false, "next": "evt_..." }
```

Keep calling with `after` set to `next` while `hasMore` is true. Filter with `type=account.updated` if you only need one kind.

## A typical integration

1. Your user clicks "Connect LinkedIn" in your product, so you call `POST /accounts` with your user id as `externalId`.
2. Show your sign-in form with email and password or session cookie, and call `/linkedin/connect` with the person's IP.
3. Handle checkpoints until the state is `connected`, or wait for the `account.updated` webhook.
4. Load the inbox from `/chats` and `/chats/:chatId`, and update it live from `message.created` and `message.updated`.
5. Reply with `/chats/:chatId/messages`, start new threads with `/conversations`, send files with `/media`.
6. On `account.updated` with `needs_reconnect`, ask the person to connect again.
