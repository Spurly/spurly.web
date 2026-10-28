---
title: Quickstart
description: Go from an API key to a connected LinkedIn account, a synced inbox and your first message sent through the Spurly LinkedIn API.
lead: From API key to your first LinkedIn message in five steps.
path: /developers/quickstart
template: docs
section: Get started
order: 2
date: 2026-10-24
parent: /developers
---
You need your API key (`spk_partner_...`) and a LinkedIn account to test with. The examples use curl; every endpoint page also has Node.js and Python.

```bash
export SPURLY_API_KEY="spk_partner_..."
```

## 1. Create an account

One account per LinkedIn profile. `externalId` is your own id for that profile: a user with two LinkedIn accounts needs two, such as `user_123:1` and `user_123:2`. Reuse it when the same profile reconnects.

```bash
curl -X POST "https://api.getspurly.com/v1/accounts" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"externalId":"user_123:1","name":"Jane Doe"}'
```

Keep the `id` from the answer; the next calls use it as `accountId`.

## 2. Connect LinkedIn

Send the LinkedIn email and password your user typed into your form, with their IP address.

```bash
curl -X POST "https://api.getspurly.com/v1/accounts/ACCOUNT_ID/linkedin/connect" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"method":"credentials","username":"jane@acme.com","password":"their-password","endUserIp":"49.36.1.1"}'
```

The answer is either `"state": "connected"`, or `"state": "checkpoint"` when LinkedIn wants a verification code:

```bash
curl -X POST "https://api.getspurly.com/v1/accounts/ACCOUNT_ID/linkedin/checkpoint" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

Repeat until the state is `connected`. [Connect LinkedIn](/developers/guides/connect-linkedin) covers every checkpoint type.

## 3. Set your webhook

```bash
curl -X PUT "https://api.getspurly.com/v1/webhook" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-app.com/spurly/webhook"}'
```

Then send yourself a test event with `POST /webhook/test`. New messages now arrive as `message.created`. See [Webhooks](/developers/guides/webhooks) to verify signatures.

## 4. Read the inbox

The history import starts on its own and takes a few minutes for a large inbox.

```bash
curl "https://api.getspurly.com/v1/accounts/ACCOUNT_ID/chats" \
  -H "Authorization: Bearer $SPURLY_API_KEY"
```

Open one conversation with `GET /accounts/ACCOUNT_ID/chats/CHAT_ID`.

## 5. Send a message

```bash
curl -X POST "https://api.getspurly.com/v1/accounts/ACCOUNT_ID/chats/CHAT_ID/messages" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hi from the Spurly API"}'
```

It appears in the person's LinkedIn messages straight away. To message someone you have no conversation with yet, use [Message someone new](/developers/api/messages).

## Next

- [Authentication](/developers/authentication) and [Errors](/developers/errors)
- [The inbox guide](/developers/guides/inbox): sync, pagination and keeping your copy in step
- [API reference](/developers/api/accounts)
