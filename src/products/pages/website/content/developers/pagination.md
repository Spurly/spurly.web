---
title: Pagination
description: How list endpoints in the Spurly LinkedIn API paginate, and how to page through the event feed with a cursor.
path: /developers/pagination
template: docs
section: Get started
order: 5
date: 2026-10-24
parent: /developers
---
List endpoints take `page` (from 1) and `limit`, and answer with a `pagination` object:

```json
{ "pagination": { "page": 2, "limit": 30, "total": 45 } }
```

There are more pages while `page * limit < total`.

| Endpoint | Default `limit` | Maximum | Order |
|---|---|---|---|
| `GET /accounts` | 30 | 100 | Newest account first |
| `GET /accounts/:id/chats` | 30 | 100 | Most recently active first |
| `GET /accounts/:id/chats/:chatId` | 50 | 200 | Page 1 is the newest messages; ascending inside a page |
| `GET /events` | 100 | 200 | Oldest first, by cursor |

## Messages

Page 1 of a conversation holds the most recent messages, ordered oldest to newest so you can render them as they are. Load older messages with page 2, 3 and so on, and put each page above the last.

## Conversations change order

New messages move a conversation to the top. Paging through all conversations while messages arrive can show one twice or skip one. To build a full copy, page through once, then keep it current with webhooks rather than re-listing.

## The event feed uses a cursor

`GET /events` takes `after` (an event id) instead of `page`, and answers `hasMore` and `next`:

```bash
curl "https://api.getspurly.com/v1/events?after=evt_6719f2c0a1b2c3d4e5f60799&limit=100" \
  -H "Authorization: Bearer $SPURLY_API_KEY"
```

Call again with `after` set to `next` while `hasMore` is true. Store the last id you processed, and resume from it.
