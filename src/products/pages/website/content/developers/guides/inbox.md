---
title: The inbox
description: How the Spurly LinkedIn inbox syncs, how to read conversations and messages, and how to keep your own copy current with webhooks.
lead: Every conversation and message, imported once and kept current in real time.
path: /developers/guides/inbox
template: docs
section: Guides
order: 2
date: 2026-10-24
parent: /developers
---
## How sync works

When LinkedIn connects, Spurly imports the account's history in the background: first the conversations, then the messages in each. A large inbox takes a few minutes. From then on, new messages arrive **live** through LinkedIn's own push, usually within seconds.

`GET /accounts/:accountId/inbox` explains what is happening, so an empty inbox never looks broken:

| Field | Use it to show |
|---|---|
| `sync.status` `queued` or `running` | "Importing your LinkedIn messages..." |
| `sync.phase` | `chats` then `messages` then `done` |
| `sync.chatsSeen`, `sync.messagesImported` | Progress |
| `sync.firstCompletedAt` | The first full import finished |
| `historyPending` | Conversations whose older messages are still coming |
| `liveFeedSeenAt` | When the last live message arrived |

## Reading

- `GET /accounts/:accountId/chats` lists conversations, most recently active first, with the other person's name, headline, photo and the last message.
- `GET /accounts/:accountId/chats/:chatId` returns a conversation and its messages. Page 1 is the newest; see [Pagination](/developers/pagination).
- A conversation whose `historyPending` is true has older messages still importing; they appear on their own.

## Keeping your copy current

You can read the inbox live from the API every time, or keep your own copy. To keep a copy:

1. After LinkedIn connects, page through `/chats` and each conversation once.
2. Apply every `message.created` webhook: add the message, and update the conversation (it is included in full).
3. Apply every `message.updated` webhook: replace the message (read receipts, reactions, edits, deletes).
4. If your endpoint was down, catch up from `GET /events` with the last event id you processed.

Every message and conversation id is stable, so applying an event twice is harmless.

## Read state

- `unreadCount` on a conversation counts the messages the account's owner has not read in Spurly. `POST .../chats/:chatId/read` clears it. It does **not** send a read receipt on LinkedIn.
- `seen` on an outbound message turns true when the other person reads it on LinkedIn, and a `message.updated` webhook with `change: "read"` is sent.

## Message content

- `direction` is `inbound` (from the other person) or `outbound` (from the account's owner, sent from your product or from LinkedIn itself).
- `attachments` lists files, images, voice notes and videos. Download any with `downloadable: true` from `GET /accounts/:accountId/messages/:messageId/attachments/:attachmentId`.
- `reactions` lists emoji reactions; `fromMe` marks the owner's own.
- `edited` and `deleted` reflect changes made on LinkedIn. A deleted message keeps its place with empty text.

## Reference

- [Inbox endpoints](/developers/api/inbox)
- [Chat](/developers/objects#chat) and [Message](/developers/objects#message) objects
