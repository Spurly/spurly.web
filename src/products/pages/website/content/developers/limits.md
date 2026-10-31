---
title: Limits and versioning
navTitle: Limits and versioning
description: Rate limits, LinkedIn limits, file size limits, timeouts and the versioning policy of the Spurly LinkedIn API.
path: /developers/limits
template: docs
section: Get started
order: 6
date: 2026-10-30
parent: /developers
---
## Rate limit

Each API key can make **600 requests per minute**. Every answer carries:

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | Requests allowed per minute |
| `X-RateLimit-Remaining` | Requests left in the current minute |
| `X-RateLimit-Reset` | Unix time, in seconds, when the minute resets |

Past the limit, requests answer `429 RATE_LIMITED` with a `Retry-After` header in seconds. Use webhooks rather than polling to stay well inside it.

## LinkedIn's own limits

Spurly applies **no pacing and no daily caps** to messages sent through this API: every send goes out immediately. LinkedIn, however, watches every account. To keep your users' accounts healthy:

- Pace bulk sending in your product. Space out messages to many different people rather than sending them in a burst.
- Avoid sending the same text to many people in a short time.
- Expect LinkedIn to refuse messages to people who are not 1st-degree connections (unless they have an open profile).

## Inbox sync

| What | Limit |
|---|---|
| Conversations imported per LinkedIn account | The newest 5,000 (may be raised) |
| Messages imported per conversation | The latest 50 |
| Conversations per `/chats` page | 100 |
| Catch-up check for missed messages | About every 10 minutes, in addition to live delivery |

See [the inbox guide](/developers/guides/inbox) for what that means for keeping your own copy.

## Files

| `kind` | Maximum | Types |
|---|---|---|
| `attachment` | 20 MB | PDF, Word, Excel, PowerPoint, plain text, CSV, PNG, JPEG, GIF, WebP |
| `voice` | 10 MB | M4A |
| `video` | 50 MB | MP4, MOV |

Messages are limited to 8000 characters.

## Timeouts

Most calls answer within a second. Connecting LinkedIn and messaging someone new can take up to about 30 seconds while LinkedIn responds, so set your client timeout to at least 60 seconds for those.

## Data retention

- Synced conversations and messages are kept while the account exists.
- Webhook events are kept for 30 days in the [event feed](/developers/api/webhooks).
- LinkedIn passwords and session cookies are never stored.

## Versioning

The API is versioned in the path: `/v1`.

- **Non-breaking changes ship without notice:** new endpoints, new optional parameters, new fields in responses, new event types and new error codes. Ignore fields and events you do not know.
- **Breaking changes** (removing or renaming a field, changing a type or a meaning) only ship in a new version, announced in the [changelog](/developers/changelog) with at least 90 days of overlap.
