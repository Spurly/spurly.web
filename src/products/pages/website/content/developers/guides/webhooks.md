---
title: Webhooks
description: Receive LinkedIn messages, read receipts, reactions and connection changes in real time, verify Spurly webhook signatures and catch up after downtime.
lead: Real-time events for new messages, read receipts, reactions, edits and LinkedIn connection changes.
path: /developers/guides/webhooks
template: docs
section: Guides
order: 4
date: 2026-10-24
parent: /developers
---
## Set your endpoint

```bash
curl -X PUT "https://api.getspurly.com/v1/webhook" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-app.com/spurly/webhook"}'
```

Then `POST /webhook/test` sends a signed `webhook.test` event and tells you what your endpoint answered.

## Events

| Event | Sent when |
|---|---|
| `message.created` | A new message: received, sent from LinkedIn itself (`origin: "linkedin"`) or sent through the API (`origin: "api"`) |
| `message.updated` | A message changed: `read`, `reaction`, `message_edited`, `message_deleted`, `message_delivered` |
| `account.updated` | The LinkedIn connection state changed, for example to `needs_reconnect` |

Full payloads are on [Webhook events](/developers/webhook-events). New event types may be added; ignore types you do not handle.

## Delivery

- A `POST` with a JSON body, `Content-Type: application/json`.
- Headers: `X-Spurly-Event` (the type) and `X-Spurly-Signature`.
- Answer any `2xx` within 8 seconds. Do the work after answering, for example on a queue.
- A failed delivery (non-2xx, timeout or no answer) is retried after about 5 seconds and again after about 60 seconds.
- Events may arrive more than once and, rarely, out of order. Use the event `id` to drop duplicates, and the message's `sentAt` to order messages.

## Verify the signature

`X-Spurly-Signature` looks like `t=1729750141,v1=5257a869e7...`. Compute an HMAC-SHA256 of the string `t + "." + rawBody` with your webhook secret, as hex, and compare it to `v1`. Reject the delivery if it differs, or if `t` is more than 5 minutes from now. Always use the **raw** request body, before any JSON parsing.

### Node.js (Express)

```js
import crypto from "node:crypto";
import express from "express";

const app = express();

app.post("/spurly/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const header = req.get("X-Spurly-Signature") || "";
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const expected = crypto
    .createHmac("sha256", process.env.SPURLY_WEBHOOK_SECRET)
    .update(`${parts.t}.${req.body}`)
    .digest("hex");
  const valid =
    parts.v1 &&
    expected.length === parts.v1.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)) &&
    Math.abs(Date.now() / 1000 - Number(parts.t)) < 300;
  if (!valid) return res.status(400).send("bad signature");

  const event = JSON.parse(req.body);
  res.sendStatus(200);
  queue.add(event); // handle it after answering
});
```

### Python (Flask)

```python
import hashlib, hmac, json, os, time
from flask import Flask, request, abort

app = Flask(__name__)

@app.post("/spurly/webhook")
def spurly_webhook():
    raw = request.get_data()
    parts = dict(p.split("=", 1) for p in request.headers.get("X-Spurly-Signature", "").split(","))
    expected = hmac.new(os.environ["SPURLY_WEBHOOK_SECRET"].encode(), f"{parts.get('t')}.".encode() + raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, parts.get("v1", "")) or abs(time.time() - int(parts.get("t", 0))) > 300:
        abort(400)
    event = json.loads(raw)
    queue.put(event)  # handle it after answering
    return "", 200
```

## Catch up after downtime

Every event is stored for 30 days, delivered or not. After an outage, read everything after the last event you processed:

```bash
curl "https://api.getspurly.com/v1/events?after=evt_6719f2c0a1b2c3d4e5f60799" \
  -H "Authorization: Bearer $SPURLY_API_KEY"
```

Page with `next` while `hasMore` is true. Each event in the feed also shows how its delivery went (`delivery.deliveredAt`, `attempts`, `lastStatus`), which helps when debugging your endpoint.

## Rotate the secret

`POST /webhook/rotate-secret` returns a new secret, shown once. The old one stops working immediately, so deploy the new secret right away.
