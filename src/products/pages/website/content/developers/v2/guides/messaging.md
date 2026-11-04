---
title: Messaging and LinkedIn calls
seoTitle: Messaging and LinkedIn calls | Spurly API v2
navTitle: LinkedIn calls
description: How LinkedIn calls work in the Spurly organisation API: chats and messages, sending files, search filters, profiles, invitations and posts through one account.
lead: Everything on a connected account lives under /accounts/{accountId}.
path: /developers/v2/guides/messaging
template: docs
section: v2: Guides
order: 3
date: 2026-11-04
parent: /developers/v2
---
Spurly checks every call before it reaches LinkedIn: the account must be yours and `OK`, the organisation not suspended, and chat and message ids must belong to that account. A path that is not in the [API reference](/developers/v2/api/messaging) is a plain `404`.

## Chats and messages

List chats with `GET /chats`, then a chat's messages with `GET /chats/{chatId}/messages`. Both page with `cursor`. `isSender` tells you whether the connected member wrote a message. Reply with `POST /chats/{chatId}/messages`; start a conversation with `POST /chats` (add a `subject` to send an InMail).

Mark read with `PATCH /chats/{chatId}` and `{ "read": true }`.

## Files

Send a file as the raw request body:

```bash
curl -X POST "https://api.getspurly.com/v2/accounts/$ACCOUNT_ID/chats/$CHAT_ID/messages?kind=attachment&fileName=report.pdf" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/pdf" \
  --data-binary @report.pdf
```

`kind` is `attachment`, `voice` (.m4a) or `video`. Add `&text=` for a caption. Download a received file from `GET /messages/{messageId}/attachments/{attachmentId}`: Spurly streams the bytes and you never see a storage link. Limits are on the [Limits](/developers/v2/limits#input-limits) page.

## Search

`POST /search` takes a `category` of `people`, `companies` or `posts`. Job search is not available. People filters use ids; look them up with `GET /search/parameters?type=LOCATION&keywords=berlin`:

```json
{
  "category": "people",
  "keywords": "head of sales",
  "filters": {
    "location": ["106967730"],
    "networkDistance": [2, 3],
    "advancedKeywords": { "title": "sales" }
  },
  "limit": 25
}
```

## Profiles, invitations and posts

- `GET /profiles/{identifier}` takes a public identifier or member id; add `?sections=experience,skills` for more.
- Invitations: send with `POST /invitations`. Received invitations carry an opaque `token`; hand it back with `{ action, token }` to accept or decline.
- Posts: create with `POST /posts` (text, or an image or video upload). Use a post's `socialId` as `postId` for comments and reactions.

## Be gentle with LinkedIn

Every account is limited to 60 requests a minute, and LinkedIn limits what a member can do per day. Spread bulk work out and honour `Retry-After`.
