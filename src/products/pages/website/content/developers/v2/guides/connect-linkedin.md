---
title: Connect LinkedIn
seoTitle: Connect LinkedIn | Spurly API v2
description: Sign a LinkedIn account in under an organisation with credentials or a session cookie, handle verification codes and in-app approvals, and reconnect an account.
lead: Credentials or a cookie in, a connected account out, with every LinkedIn verification step handled.
path: /developers/v2/guides/connect-linkedin
template: docs
section: v2: Guides
order: 1
date: 2026-11-04
parent: /developers/v2
---
There is no hosted sign-in page in `/v2`: you collect the details in your own UI and pass them to Spurly. The password or cookie is used for that one request and is never stored or logged.

## Sign in

`POST /orgs/{orgId}/accounts/connect` takes one of:

- `{ "method": "credentials", "username": "...", "password": "..." }`
- `{ "method": "cookies", "accessToken": "<li_at value>", "premiumToken": "<li_a value, optional>", "userAgent": "<optional>" }`

Send `endUserIp` (your end user's own IPv4 address) so LinkedIn sees the sign-in from where the person is. You can also choose a `location` (a country, or your own proxy). To show a country picker with the right default, call `GET /connect-options` first: it returns `detectedCountry` (from the `endUserIp` you pass, or `null`) and the supported `proxyProtocols`. To reconnect an account that needs it, add its id as `accountId`.

The answer is one of two states:

```json
{ "success": true, "data": { "state": "connected", "account": { "id": "6720a2c3d4e5f60718293041", "status": "OK" } } }
```

```json
{ "success": true, "data": { "state": "checkpoint", "connectId": "cn_5d3f", "checkpoint": { "type": "OTP", "expiresAt": "2026-11-01T09:20:00.000Z" } } }
```

## Verification

On `checkpoint`, LinkedIn wants one more step. Keep the `connectId` and match `checkpoint.type`:

| What the member does | You call |
|---|---|
| Types a code LinkedIn sent (email, SMS or authenticator) | `POST .../connect/checkpoint` with `{ connectId, code }` |
| Has not received a code | `POST .../connect/checkpoint/resend` with `{ connectId }` |
| Wants another method | `POST .../connect/checkpoint/another-way` with `{ connectId }` |
| Approves in the LinkedIn app | Poll `GET .../connect/status?connectId=` every few seconds |

Each of these answers with the next state, so you loop until `connected`. A checkpoint lasts 5 minutes (`410 EXPIRED` after that: start again). Steps this API cannot complete answer `422 UNSUPPORTED_CHECKPOINT`.

## One member, one organisation

If the member who signs in is live in another organisation, you get `409 PROFILE_IN_USE` and nothing stays connected. If the member is already connected in this organisation, the existing account is reused. See [Concepts](/developers/v2/concepts#one-member-one-organisation).

## Reconnect

When an account's `status` is `CREDENTIALS` (or you receive an `account.updated` for it), repeat the sign-in with `accountId`. The member must sign in as the same LinkedIn profile, or the attempt is refused with `409 PROFILE_MISMATCH` and disconnected.

## Limits

An organisation can start 5 connects per hour. Wrong credentials answer `422 INVALID_CREDENTIALS` with `field`; an expired cookie answers `422 INVALID_COOKIE`. See [Errors](/developers/v2/errors).
