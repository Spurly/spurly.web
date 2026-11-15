---
title: Limits and pagination
seoTitle: Limits and pagination | Spurly API v2
navTitle: Limits and pagination
description: Request limits, connect limits, upload and text limits, pagination cursors and the event window of the Spurly organisation API.
lead: What is limited, and how to page through lists.
path: /developers/limits
template: docs
section: Get started
order: 5
date: 2026-11-04
parent: /developers
---
## Rate limits

| Limit | Value | When exceeded |
|---|---|---|
| Per API key | 600 requests per minute | `429 RATE_LIMITED` with `Retry-After` |
| Per LinkedIn account | 60 requests per minute | `429 RATE_LIMITED` with `Retry-After` |
| Connects per organisation | No limit | Only LinkedIn's own `429 LINKEDIN_RATE_LIMITED` |

LinkedIn also limits what an account can do. When it does, you get `429 RATE_LIMITED` and `Retry-After: 60`; if it asks for a pause on sign-in attempts, the connect calls answer `429 LINKEDIN_RATE_LIMITED`. Back off and retry reads; for writes see [Errors](/developers/errors#retrying-writes).

### Safety limit for accounts that also use the Spurly workspace

Pacing is yours: Spurly does not slow your sends. One exception protects the LinkedIn member. When an organisation also uses the Spurly workspace, the same account may be driven from both places, so Spurly keeps one rolling count of connection requests and messages sent from the account, from both. If an account reaches its safety limit (connection requests: 10 an hour, 80 a day, 200 a week; messages: 20 an hour, 100 a day, 500 a week) a further send answers `429 ACCOUNT_LIMIT` with `Retry-After`, and nothing is sent. Organisations that use only the API are not counted and never see this error.

## Input limits

| Input | Limit |
|---|---|
| Message text | 8,000 characters |
| Post text | 3,000 characters |
| Organisation `externalId` | A valid email address, up to 200 characters |
| Verification `code` | 64 characters |

Files are sent as the raw request body with their own `Content-Type`, and a `Content-Length`. Spurly checks size and type before anything is sent to LinkedIn.

| `kind` | Used for | Types | Size |
|---|---|---|---|
| `attachment` | Message files | PDF, text, CSV, Office files, PNG, JPEG, GIF, WebP | 20 MB |
| `voice` | Voice notes | `.m4a` | 10 MB |
| `video` | Message video | MP4, QuickTime | 50 MB |
| `image` | Post image | PNG, JPEG, GIF | 8 MB |
| `video` (posts) | Post video | MP4 | 100 MB |

A missing length answers `411 LENGTH_REQUIRED`, a file that is too big `413 FILE_TOO_LARGE`, and a type that is not allowed `415 UNSUPPORTED_MEDIA`.

## Pagination

LinkedIn lists use a **cursor**: pass `cursor` and `limit` (1 to 100, default 25). A page is `{ "items": [...], "cursor": "..." }`; `cursor` is `null` on the last page. Connections, followers and viewers keep their own list key (`relations`, `followers`, `viewers`) with the same `cursor`. Cursors are opaque: use them as given and do not store them for long.

Organisation and account lists use `page` and `limit` (default 50, up to 200) and return `total`.

## The event feed

`GET /events` returns the last 7 days of events, oldest first, 100 per page (up to 200). Pass the last `id` you processed as `after`.

## Versioning

Additions ship without notice and are listed in the [changelog](/developers/changelog). A breaking change only ships in a new API version, with at least 90 days of overlap.
