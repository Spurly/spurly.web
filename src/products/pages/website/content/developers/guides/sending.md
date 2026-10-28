---
title: Sending messages
description: Reply in conversations, message someone new, send files, voice notes and video, and react to messages through the Spurly LinkedIn API.
lead: Replies, new conversations, files and reactions, all sent immediately from the user's own LinkedIn account.
path: /developers/guides/sending
template: docs
section: Guides
order: 4
date: 2026-10-24
parent: /developers
---
Every message is sent from the connected user's own LinkedIn account, straight away, and appears in their LinkedIn messages like one they typed.

## Reply in a conversation

`POST /accounts/:accountId/chats/:chatId/messages` with `{ "text" }`. The answer carries the stored message, so you can show it at once.

## Message someone new

`POST /accounts/:accountId/conversations` with `{ "profile", "text" }`, where `profile` is a LinkedIn profile URL (`https://www.linkedin.com/in/bobsmith`) or public identifier (`bobsmith`).

- If a conversation with that person already exists, the message goes into it and `created` is false. There is never a second thread with the same person.
- LinkedIn allows messaging **1st-degree connections** and **open profiles**. For anyone else LinkedIn refuses the message (`SEND_FAILED`).

## Files, voice notes and video

`POST /accounts/:accountId/chats/:chatId/media?kind=attachment&filename=proposal.pdf` with the raw file as the request body and its `Content-Type`. Add `text=` for a caption. Limits are on [Limits](/developers/limits).

```bash
curl -X POST "https://api.getspurly.com/v1/accounts/ACCOUNT_ID/chats/CHAT_ID/media?kind=attachment&filename=proposal.pdf" \
  -H "Authorization: Bearer $SPURLY_API_KEY" \
  -H "Content-Type: application/pdf" \
  --data-binary @proposal.pdf
```

## Reactions

`POST /accounts/:accountId/messages/:messageId/reaction` with `{ "emoji": "👍" }`. A new reaction replaces the owner's previous one on that message.

## Real-time echo

A message sent through the API is also announced as `message.created` with `origin: "api"`, so every screen of your product updates the same way it does for a message that arrived from LinkedIn.

## Avoid duplicate sends

Sends are not idempotent. If a send times out or answers `SEND_UNCONFIRMED`, the message may already have gone out:

1. Do not retry straight away.
2. Wait a few seconds for its `message.created` webhook, or re-read the conversation.
3. Send again only if it is not there.

## Pacing

Spurly does not pace or cap messages sent through this API. Pace bulk sending in your own product to keep your users' LinkedIn accounts healthy; see [Limits](/developers/limits).

## Reference

- [Messages endpoints](/developers/api/messages)
