---
title: Changelog
description: Changes to the Spurly LinkedIn API, newest first.
path: /developers/changelog
template: docs
section: Resources
order: 2
date: 2026-10-28
parent: /developers
---
Non-breaking additions ship without notice and are listed here. Breaking changes only ship in a new API version, with at least 90 days of overlap. See [Limits and versioning](/developers/limits).

## 28 October 2026

Additions, not breaking changes.

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
