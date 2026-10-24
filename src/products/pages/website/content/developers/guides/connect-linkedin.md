---
title: Connect LinkedIn
description: Build the LinkedIn sign-in in your own product with the Spurly API, including email and password, session cookies and every verification checkpoint.
lead: Your users sign in to LinkedIn inside your product. Spurly handles LinkedIn's verification steps and keeps the session alive.
path: /developers/guides/connect-linkedin
template: docs
section: Guides
order: 1
date: 2026-10-24
parent: /developers
---
## The flow

1. Create (or fetch) the account: `POST /accounts` with your user's id as `externalId`.
2. Show your sign-in form. Offer **Email and password**, and optionally **Session cookie**.
3. Send what the user entered to `POST /accounts/:accountId/linkedin/connect`, with their IP address.
4. If the answer is a **checkpoint**, show the matching step and continue until the state is `connected`.
5. From then on, the `account.updated` webhook tells you whenever the connection changes.

## Your sign-in form

Spurly's own dialog is a good model: two tabs, then a collapsed "Sync and location" section.

| Input | Sent as | Notes |
|---|---|---|
| Email or phone | `username` | Email and password tab |
| LinkedIn password | `password` | Email and password tab. Used once, never stored |
| `li_at` cookie | `accessToken` | Session cookie tab. Required there |
| `li_a` cookie | `premiumToken` | Session cookie tab. Only for Sales Navigator and Recruiter |
| Browser user agent | `userAgent` | Session cookie tab. Recommended |
| Sync history | `sync.chats`, `sync.messages` | Both default to true |
| Location | `location` | Automatic, a chosen country, or the user's own proxy |

Tell users that two-step verification is expected: LinkedIn often sends a code on a new sign-in.

## Send the user's IP

Always pass `endUserIp`, the IP address of the person signing in (from your own request to your server). With automatic location, LinkedIn then sees the sign-in from that person's country. Without it, the sign-in looks like it comes from a data centre, and LinkedIn asks for more verification or blocks it.

`GET /linkedin/connect-options?endUserIp=...` answers the detected country, so your form can say "Automatic (India)".

## Start the sign-in

::endpoint connectLinkedin

## Checkpoints

LinkedIn often asks the person to verify a new sign-in. The answer then carries `state: "checkpoint"` and a `checkpoint.type`:

| Type | Show | Then |
|---|---|---|
| `OTP` | "LinkedIn sent a code to the email or phone on your account" | `POST .../linkedin/checkpoint` with `{ "code": "123456" }` |
| `2FA` | "Enter the 6-digit code from your authenticator app" | `POST .../linkedin/checkpoint` with `{ "code": "123456" }` |
| `PHONE_REGISTER` | "LinkedIn wants a phone number on this account first" with a country code and number field | `POST .../linkedin/checkpoint` with the number as `code`, written `(+91)9876543210`. LinkedIn then texts a code, which comes back as an `OTP` checkpoint |
| `IN_APP_VALIDATION` | "Open the LinkedIn app and tap Yes, it's me" (approving from LinkedIn's email works too) | Poll `POST .../linkedin/checkpoint/status` every 3 to 5 seconds, or wait for `account.updated` |

Every checkpoint step answers the same two states, so one loop handles all of them. Offer:

- **Resend code** (or resend the app notification): `POST .../linkedin/checkpoint/resend`
- **Try another way**: `POST .../linkedin/checkpoint/another-way`, which answers the new checkpoint (or `NO_ALTERNATIVE`)

A checkpoint expires after a few minutes (`EXPIRED`, 410). Start again from the sign-in.

If LinkedIn asks for something the API cannot complete (`UNSUPPORTED_CHECKPOINT`), ask the user to sign in with a session cookie instead.

## Connection states

| `linkedin.state` | Meaning | Your UI |
|---|---|---|
| `not_connected` | Never connected, or disconnected | "Connect LinkedIn" |
| `connecting` | Signed in; LinkedIn is finishing setup | "Connecting..." |
| `connected` | Live | Inbox |
| `needs_reconnect` | LinkedIn ended the session: password changed, signed out everywhere, or a security check | "Reconnect LinkedIn", which runs this same flow |

Sessions end on LinkedIn's side from time to time, roughly monthly for many accounts. That is normal; the `account.updated` webhook tells you the moment it happens, so you can prompt the user straight away.

## Disconnecting

`DELETE /accounts/:accountId/linkedin` signs the account out of Spurly. Conversations already synced stay readable.

## A minimal loop (Node.js)

```js
async function connect(accountId, form, endUserIp) {
  let res = await spurly(`/accounts/${accountId}/linkedin/connect`, { ...form, endUserIp });
  while (res.state === "checkpoint") {
    if (res.checkpoint.type === "IN_APP_VALIDATION") {
      await sleep(4000);
      res = await spurly(`/accounts/${accountId}/linkedin/checkpoint/status`, {});
    } else {
      const code = await askUserForCode(res.checkpoint.type);
      res = await spurly(`/accounts/${accountId}/linkedin/checkpoint`, { code });
    }
  }
  return res.account;
}

async function spurly(path, body) {
  const r = await fetch(`https://api.getspurly.com/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SPURLY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (!json.success) throw Object.assign(new Error(json.message), { code: json.code, field: json.field });
  return json.data;
}
```

In a real product each step is a separate request from your UI; the loop shows the order.
