---
title: Connection methods
seoTitle: LinkedIn connection methods | Spurly API v2
navTitle: Connection methods
description: Compare signing a LinkedIn account in with credentials or a session cookie, choose where LinkedIn sees the sign-in from, and plan for verification steps and reconnects.
lead: Two ways to connect a member, when to use each, and how to keep the connection healthy.
path: /developers/v2/guides/connection-methods
template: docs
section: v2: Guides
order: 6
date: 2026-11-11
parent: /developers/v2
---
There is no hosted sign-in page in `/v2`. You collect the details in your own screen and send them to `POST /orgs/{orgId}/accounts/connect`. The [Connect LinkedIn](/developers/v2/guides/connect-linkedin) guide walks through the calls. This page helps you choose how.

## Credentials or cookie?

| | `credentials` | `cookies` |
|---|---|---|
| You collect | The member's LinkedIn email or phone, and password | The `li_at` cookie, and for Sales Navigator or Recruiter the `li_a` cookie, plus the browser's user agent |
| Verification | LinkedIn may ask for a code, an in-app approval or a phone number | Usually none, because the browser session is already trusted |
| Good for | A sign-in form in your web app | A browser extension that can read the cookies in the background |
| Sales Navigator and Recruiter | Detected when possible | Preferred. Send `premiumToken` |
| Reconnect | The member signs in again | Your extension sends a fresh cookie, with no action from the member |

Spurly uses a password or cookie for that one request only and never stores or logs it.

Recruiter accounts are limited to a small number of simultaneous sessions. Signing in with credentials can start a second session and make LinkedIn show a warning, and the member may have to reconnect each time. If you serve Recruiter members, use cookies.

## Smooth reconnects with a browser extension

If your product has a browser extension, you can keep an account connected without ever asking the member to sign in again:

1. Collect the `li_at` cookie, the `li_a` cookie if there is one, the browser's user agent, and the member's own IP address.
2. Send them to your backend now and then, and keep the latest.
3. Connect once with the `cookies` method. Keep the account's `id`.
4. When you receive an `account.updated` webhook that says the account needs a new sign-in, repeat the connect call with `accountId` and the latest cookie.
5. If that fails, wait a day for the member to use their extension naturally, then email them to reconnect.

Always send the user agent of the browser the cookie came from. A cookie used with a different one is a common reason for LinkedIn to end the session.

## Where LinkedIn sees the sign-in from

LinkedIn pays attention to where a session comes from. If many accounts sign in from the same server address, LinkedIn can flag them. Spurly connects each account through a fixed proxy, so give it a good hint:

1. **`endUserIp`.** Send the member's own IPv4 address. Spurly picks a proxy near it. This is the best default.
2. **`location`**: `{ "mode": "country", "country": "US" }` to choose a country by its two-letter code.
3. **`location`**: `{ "mode": "proxy", "proxy": { "protocol": "https", "host": "...", "port": 1234, "username": "...", "password": "..." } }` to use your own proxy. `protocol` is `http`, `https` or `socks5`. If LinkedIn cannot be reached through it, you get `422 PROXY_INVALID`.

`GET /connect-options?endUserIp=...` returns the country Spurly detects for that address (`detectedCountry`, or `null`) and the supported proxy protocols: use it to pre-select a country picker.

Keep the same location for the life of the account. Moving a member across the world between sign-ins is itself a warning sign.

## Verification steps

When LinkedIn wants one more step the answer is `state: "checkpoint"` with a `connectId`.

| LinkedIn asks for | The member does | You call |
|---|---|---|
| A one-time code, by email or SMS | Types the code | `.../connect/checkpoint` |
| A code from an authenticator app | Types the code | `.../connect/checkpoint` |
| An approval in the LinkedIn app | Taps approve | Poll `.../connect/status` |
| Nothing arrived | Asks again | `.../connect/checkpoint/resend` |
| A different method | Chooses another | `.../connect/checkpoint/another-way` |

You have **5 minutes** to finish a checkpoint (`410 EXPIRED` after that, so start again). A step this API cannot complete, such as a captcha, answers `422 UNSUPPORTED_CHECKPOINT`.

## Things to plan for

- **One member, one organisation.** A member who is live elsewhere answers `409 PROFILE_IN_USE`. See [Concepts](/developers/v2/concepts#one-member-one-organisation).
- **Five connects an hour.** Each organisation can start 5 sign-ins an hour (`429 ORG_CONNECT_LIMIT`). Do not retry failed sign-ins in a loop: repeated attempts make LinkedIn suspicious.
- **Watch `account.updated`.** Status `CREDENTIALS` is the one that needs the member. Build your reconnect prompt around it.
- **Reconnect as the same member.** A different LinkedIn profile answers `409 PROFILE_MISMATCH` and is disconnected.
