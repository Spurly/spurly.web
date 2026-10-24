---
title: Errors
description: The Spurly LinkedIn API error format, HTTP status codes and every error code with what to do about it.
path: /developers/errors
template: docs
section: Get started
order: 4
date: 2026-10-24
parent: /developers
---
Every failure has the same shape and a matching HTTP status:

```json
{
  "success": false,
  "message": "That email and password didn’t work on LinkedIn. Check them and try again.",
  "code": "INVALID_CREDENTIALS",
  "field": "password",
  "status": 422
}
```

- `message` is written for people. On a 4xx it is safe to show to your user as it is.
- `code` is stable. Branch on it in your code, never on `message`.
- `field` appears on sign-in errors and names the input to highlight.

## Status codes

| Status | Meaning | Retry? |
|---|---|---|
| 400 | The request is invalid | No, fix the request |
| 401 | API key missing or invalid | No |
| 404 | No such account, conversation, message or attachment | No |
| 409 | Conflicts with the current state, for example LinkedIn is not connected | After the state changes |
| 410 | A sign-in verification expired | Start the sign-in again |
| 413 | File too large | No |
| 422 | LinkedIn refused the sign-in, cookie or code | After the user corrects it |
| 429 | Rate limited, by Spurly or by LinkedIn | Yes, after `Retry-After` |
| 500, 502, 503, 504 | Our side or LinkedIn failed | Reads yes; sends only after checking (below) |

## Error codes

### Requests

| Code | Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `RATE_LIMITED` | 429 | Too many requests; see [Limits](/developers/limits) |
| `INVALID_EXTERNAL_ID` | 400 | `externalId` is missing or has characters that are not allowed |
| `ACCOUNT_NOT_FOUND` | 404 | No such account under your key |
| `NOT_FOUND` | 404 | No such endpoint |
| `INTERNAL` | 500 | Something failed on our side |

### Connecting LinkedIn

| Code | Status | Meaning |
|---|---|---|
| `MISSING_FIELD` | 400 | A required input is empty; see `field` |
| `INVALID_FIELD` | 400 | An input is malformed; see `field` |
| `INVALID_CREDENTIALS` | 422 | Wrong email or password |
| `INVALID_COOKIE` | 422 | The session cookie is wrong or expired |
| `INVALID_CODE` | 422 | Wrong verification code |
| `PROXY_INVALID` | 422 | LinkedIn could not be reached through the proxy given |
| `ACCOUNT_RESTRICTED` | 422 | LinkedIn has restricted this LinkedIn account |
| `UNSUPPORTED_CHECKPOINT` | 422 | LinkedIn asked for a verification that cannot be completed through the API. Ask the user to sign in with a session cookie instead |
| `BAD_REQUEST` | 422 | LinkedIn did not accept the details |
| `EXPIRED` | 410 | The verification expired; start the sign-in again |
| `ALREADY_CONNECTED` | 409 | This account already has a live LinkedIn connection |
| `ALREADY_BOUND` | 409 | This LinkedIn account is already connected to another account |
| `IN_PROGRESS` | 409 | A sign-in is already running for this account |
| `NO_ALTERNATIVE` | 409 | LinkedIn has no other verification method |
| `RATE_LIMITED` | 429 | LinkedIn is limiting sign-in attempts; wait before retrying |
| `TIMEOUT` | 504 | LinkedIn did not answer in time; retry |
| `PROVIDER_ERROR` | 502 | LinkedIn failed; retry shortly |
| `NOT_CONFIGURED` | 503 | Connecting is temporarily unavailable |

### Inbox and sending

| Code | Status | Meaning |
|---|---|---|
| `NO_LINKEDIN_ACCOUNT` | 409 | Connect LinkedIn first |
| `LINKEDIN_ACCOUNT_NOT_READY` | 409 | The LinkedIn connection needs attention; check `linkedin.state` |
| `CHAT_NOT_FOUND` | 404 | No such conversation |
| `MESSAGE_NOT_FOUND` | 404 | No such message |
| `ATTACHMENT_NOT_FOUND` | 404 | No such attachment, or it cannot be downloaded |
| `CHAT_READ_ONLY` | 409 | LinkedIn does not allow replies in this conversation |
| `CHAT_STALE_ACCOUNT` | 409 | The conversation came from a previous LinkedIn connection; sync the inbox |
| `MESSAGE_NOT_SYNCED` | 409 | The message has not synced from LinkedIn yet; retry in a moment |
| `EMPTY_MESSAGE` | 400 | The message text is empty |
| `MESSAGE_TOO_LONG` | 400 | Over 8000 characters |
| `INVALID_PROFILE` | 400 | `profile` is not a LinkedIn profile URL or identifier |
| `PROFILE_NOT_FOUND` | 404 | No LinkedIn member at that profile |
| `SELF_MESSAGE` | 400 | The profile is the account's own |
| `FILE_TOO_LARGE` | 413 | Over the size limit for its kind |
| `SEND_FAILED` | 502 | LinkedIn refused the message, for example the person is not a connection |
| `SEND_UNCONFIRMED` | 502 | LinkedIn did not confirm the send; it may have gone out |

## Retrying safely

- **Reads** (`GET`) are always safe to retry.
- **Creating an account** is safe to retry: it is idempotent on `externalId`.
- **Sends are not idempotent.** Do not blindly retry a send after a timeout or `SEND_UNCONFIRMED`: check the conversation first (or wait for its `message.created` webhook), then send again only if it is not there.
- Back off on `429` and `5xx`: wait `Retry-After` when present, otherwise retry after 1, 2, 4 and 8 seconds.
