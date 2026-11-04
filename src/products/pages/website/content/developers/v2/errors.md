---
title: Errors
seoTitle: Errors | Spurly API v2
description: The Spurly organisation API error format, HTTP status codes and every error code with what to do about it.
lead: One error shape, stable codes.
path: /developers/v2/errors
template: docs
section: v2: Get started
order: 4
date: 2026-11-04
parent: /developers/v2
---
Every failure has the same shape and a matching HTTP status:

```json
{
  "success": false,
  "code": "ACCOUNT_NOT_CONNECTED",
  "message": "This LinkedIn account is not connected right now. Reconnect it first.",
  "status": 409,
  "details": { "state": "CREDENTIALS" }
}
```

`code` is stable: branch on it, never on `message`. `message` is written for people and never names an outside service. `field` names the input on validation errors; `details` carries extra context.

## Status codes

| Status | Meaning | Retry? |
|---|---|---|
| 400 | The request is invalid | No, fix the request |
| 401 | API key missing or invalid | No |
| 403 | Not enabled for your key, organisation suspended, or the account lacks that LinkedIn feature | No |
| 404 | Not found, or not yours | No |
| 409 | Conflicts with the current state | After the state changes |
| 410 | A sign-in expired | Start the sign-in again |
| 411, 413, 415 | A file has no length, is too big, or is not an allowed type | No, fix the file |
| 422 | LinkedIn refused the sign-in, or the text is too long | After correcting it |
| 429 | Rate limited, by Spurly or by LinkedIn | Yes, after `Retry-After` |
| 500, 502, 503, 504 | Our side or LinkedIn failed | Reads yes; writes only after checking (below) |

## Error codes

| Code | Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing, invalid or revoked API key |
| `NOT_ENABLED` | 403 | `/v2` is not enabled for your key |
| `RATE_LIMITED` | 429 | Too many requests, too many connects, or LinkedIn is limiting the account |
| `NOT_FOUND` | 404 | No such organisation, account or LinkedIn object under your key. Also any path that is not in this reference. |
| `INVALID_FIELD`, `MISSING_FIELD`, `INVALID_REQUEST` | 400 | An input is missing or wrong; `field` names it |
| `INVALID_CURSOR` | 400 | `after` is not an event id |
| `ORG_SUSPENDED` | 403 | The organisation is suspended |
| `FEATURE_UNAVAILABLE` | 403 | This LinkedIn account does not have access to that feature |
| `ACCOUNT_NOT_CONNECTED` | 409 | The account is not `OK`; `details.state` says what it is |
| `ACCOUNT_NEEDS_RECONNECT` | 409 | LinkedIn needs the member to sign in again |
| `ALREADY_CONNECTED` | 409 | That account is already connected |
| `IN_PROGRESS` | 409 | A sign-in is already running for this account |
| `NO_ALTERNATIVE` | 409 | LinkedIn offers no other way to verify |
| `PROFILE_IN_USE` | 409 | The member is live in another organisation |
| `PROFILE_MISMATCH` | 409 | A reconnect signed in as a different member; it was disconnected |
| `LENGTH_REQUIRED`, `FILE_TOO_LARGE`, `UNSUPPORTED_MEDIA` | 411, 413, 415 | An upload has no size, is too large, or is not an allowed type. See [Limits](/developers/v2/limits#input-limits) |
| `EXPIRED` | 410 | The sign-in expired; start again |
| `INVALID_CREDENTIALS`, `INVALID_COOKIE`, `INVALID_CODE` | 422 | LinkedIn did not accept it; `field` names the input |
| `ACCOUNT_RESTRICTED` | 422 | LinkedIn restricted the account; the member must resolve it on linkedin.com |
| `UNSUPPORTED_CHECKPOINT` | 422 | LinkedIn asked for a step this API cannot complete |
| `PROXY_INVALID` | 422 | LinkedIn could not be reached through the proxy you gave |
| `TOO_LONG`, `BAD_REQUEST`, `UNRESOLVED_TOKEN` | 422 | LinkedIn or Spurly did not accept the text or details |
| `INTERNAL`, `INTERNAL_ERROR` | 500 | Something went wrong on our side |
| `PROVIDER_ERROR` | 502 | LinkedIn could not be reached. Retry later. |
| `NOT_AVAILABLE`, `UNAVAILABLE` | 503 | Temporarily unavailable |
| `TIMEOUT` | 504 | LinkedIn did not answer in time |

## Retrying writes

A `504 TIMEOUT` on a send, post, comment or invitation means it may or may not have gone through. Read first (the chat's messages, the sent invitations) and only then repeat it. Spurly never retries a write for you.
