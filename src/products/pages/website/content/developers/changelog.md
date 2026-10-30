---
title: Changelog
description: Every change to the Spurly LinkedIn API, newest first, with the date it shipped and what it means for your integration.
path: /developers/changelog
template: docs
section: Resources
order: 2
date: 2026-10-30
parent: /developers
---
Non-breaking additions ship without notice and are listed here. Breaking changes only ship in a new API version, with at least 90 days of overlap. See [Limits and versioning](/developers/limits).

## 30 October 2026

Inbox fixes and documentation. No request or response shapes changed.

- `GET /accounts/{accountId}/chats` returns one row per person and only conversations from the account's current LinkedIn connection. Reconnecting LinkedIn no longer leaves repeated people in the list.
- `pagination.total` counts those people, and every page is full.
- Inbox sync now covers the newest 300 conversations per account (it was 100) and starts again on its own after a reconnect. See [Limits](/developers/limits#inbox-sync).
- The [inbox guide](/developers/guides/inbox) now explains what is included in the sync, and what a `failed` sync means: the person must reconnect LinkedIn.

## 29 October 2026

Additions, not breaking changes.

- A person who opens an account with an Open in Spurly link can set up their own Spurly sign-in (email and password). Accounts carry `directLogin`.
- `DELETE /accounts/{accountId}/login` removes it. Your Open in Spurly links keep working either way.
- On an account with a direct login, connecting a different LinkedIn profile answers `409 DIFFERENT_PROFILE` and is disconnected. Reconnecting the same profile works as before, from your product or from Spurly.

## 28 October 2026

Additions, not breaking changes.

- **Open in Spurly.** `POST /accounts/{accountId}/login-link` (optional `actor`) returns a one-time link that signs the person into that account in the Spurly web app for 12 hours. Create it from your server when they click, and open it straight away: it works once and expires after 120 seconds. See the [Open in Spurly guide](/developers/guides/open-in-spurly).
- `externalId` identifies **one LinkedIn profile**, not one of your users: a user with three LinkedIn accounts has three (for example `user_123:1`, `user_123:2`). Reuse the same value when that profile reconnects.
- `DELETE /accounts/{accountId}` closes an account and disconnects its LinkedIn connection. Creating the same `externalId` again reopens it.
- Accounts carry `status` (`open` or `closed`) and `closedAt`.
- Calls on a closed account answer `409 ACCOUNT_CLOSED`.

## 24 October 2026: v1

The first release of the Spurly LinkedIn API.

- Accounts, keyed by your own `externalId`.
- Connect LinkedIn with email and password or a session cookie, with every verification checkpoint.
- Full inbox sync: conversations, messages, attachments, reactions and read receipts.
- Reply, message someone new, send files, voice notes and video, react, download attachments.
- Webhooks: `message.created`, `message.updated` and `account.updated`, HMAC-signed, with a 30-day event feed.
- Rate limit of 600 requests per minute per key.
- OpenAPI 3.1 description.
