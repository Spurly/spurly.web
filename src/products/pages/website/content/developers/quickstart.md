---
title: Quickstart
seoTitle: Quickstart | Spurly API v2
description: Create an organisation, connect a LinkedIn account and make your first LinkedIn call through the Spurly organisation API in a few minutes.
lead: From API key to your first LinkedIn call in four steps.
path: /developers/quickstart
template: docs
section: Get started
order: 2
date: 2026-11-04
parent: /developers
---
You need your API key (`spk_partner_...`), enabled for `/v2`, and a LinkedIn account to test with.

```bash
export SPURLY_API_KEY="spk_partner_..."
```

## 1. Create an organisation

`externalId` is your customer's **email address**. It is also the address they use to sign in to Spurly (a one-time code is emailed to it), so it must be a real, valid email. Spurly lowercases it. Reusing it returns the same organisation, so a retry is safe. Anything that is not an email is refused with `400 INVALID_FIELD`.

```bash
curl -X POST "https://api.getspurly.com/v2/orgs" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"externalId":"jane@acme.com","name":"Acme Inc."}'
```

Keep the `id` from the answer.

## 2. Connect a LinkedIn account

```bash
curl -X POST "https://api.getspurly.com/v2/orgs/$ORG_ID/accounts/connect" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"method":"credentials","username":"jane@example.com","password":"..."}'
```

The answer is either `{"state":"connected","account":{...}}` or `{"state":"checkpoint","connectId":"..."}`. A checkpoint means LinkedIn wants a code or an in-app approval: see [Connect LinkedIn](/developers/guides/connect-linkedin). Keep the account `id`.

## 3. Call LinkedIn

Everything on the account lives under `/accounts/{accountId}`. List the member's chats:

```bash
curl "https://api.getspurly.com/v2/accounts/$ACCOUNT_ID/chats" \
  -H "Authorization: Bearer $SPURLY_API_KEY"
```

Send a message:

```bash
curl -X POST "https://api.getspurly.com/v2/accounts/$ACCOUNT_ID/chats/$CHAT_ID/messages" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Thanks, talk Monday."}'
```

## 4. Listen for events

Spurly sends `message.created`, `message.updated` and `account.updated` to your webhook. See [Webhooks](/developers/webhooks). Check what you are billed on with `GET /usage`.

Want to send a customer into the full Spurly app? `POST /orgs/{orgId}/login-link` returns a one-time link: see [Open in Spurly](/developers/guides/open-in-spurly).
