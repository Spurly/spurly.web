---
title: Webhooks
seoTitle: Webhooks | Spurly API v2
description: Receive LinkedIn messages and account changes in real time from the Spurly organisation API, verify signatures and catch up with the 7-day event feed.
lead: Real-time events for new messages, message changes and LinkedIn connection changes.
path: /developers/v2/webhooks
template: docs
section: Webhooks
order: 1
date: 2026-11-04
parent: /developers/v2
---
## Your endpoint

Events go to the webhook URL and signing secret on your partner account. Spurly sets them when your key is issued; ask us to change them.

## Events

| Event | Sent when |
|---|---|
| `message.created` | A new message, received or sent |
| `message.updated` | A message was `edited`, `deleted`, `delivered`, `read` or got a `reaction` |
| `account.updated` | A LinkedIn account connected, needs a new sign-in, or disconnected |

Every payload is `{ id, type, createdAt, data }`, and `data` always carries `accountId`, `orgId` and your `orgExternalId`.

## Delivery

- A `POST` with a JSON body and `Content-Type: application/json`.
- Headers: `X-Spurly-Event` (the type) and `X-Spurly-Signature`.
- Answer any `2xx` within 8 seconds, then do the work.
- A failed delivery is retried after about 5 seconds and again after about 60 seconds.
- Events may arrive more than once and, rarely, out of order. Use the event `id` to drop duplicates.

## Verify the signature

`X-Spurly-Signature` is `t=<unix seconds>,v1=<hex>`, where `v1` is the HMAC-SHA256 of `"<t>.<raw body>"` with your signing secret. Compute it over the raw body, compare in constant time, and reject a `t` more than a few minutes old.

```js
import crypto from "node:crypto";

export function verify(rawBody, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) < 300;
  return fresh && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || ""));
}
```

## Catch up after downtime

`GET /events?after=<last id>` replays the last 7 days, oldest first. Process events in order and keep the last `id`. See [Usage and events](/developers/v2/api/usage-events).

## Payloads

::schema V2MessageCreatedEvent
::schema V2MessageUpdatedEvent
::schema V2AccountEvent
