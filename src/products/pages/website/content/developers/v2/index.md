---
title: Spurly organisation API
navTitle: Overview
description: Group LinkedIn accounts under organisations, connect members, message, search and post through Spurly, and read usage with one REST API.
lead: Partners, organisations and their LinkedIn accounts: connect a member, call LinkedIn on their behalf, and see what you are billed on.
path: /developers/v2
template: docs
section: Get started
order: 1
date: 2026-11-04
seoTitle: Spurly Organisation API (v2) for LinkedIn Accounts
---
The organisation API (`/v2`) is for products that serve companies. Each of your customers is an **organisation**. An organisation connects one LinkedIn member, and you work with that member's LinkedIn through Spurly: inbox, messages, search, profiles, invitations, posts and more. Spurly runs the sign-in, verification, session health and delivery.

## How it fits together

1. You create an **organisation** for each customer with `POST /orgs`.
2. You **connect** a LinkedIn account under it, with credentials or a session cookie, and handle any verification step.
3. You call LinkedIn through `/accounts/{accountId}/...`: chats, messages, search, profiles, invitations, posts.
4. Spurly sends **webhooks** when messages arrive or a connection changes, and keeps a 7-day event feed for catch-up.
5. `GET /usage` tells you what you are billed on: distinct LinkedIn members.

| | |
|---|---|
| Base URL | `https://api.getspurly.com/v2` |
| Auth | `Authorization: Bearer spk_partner_...` |
| Format | JSON over HTTPS |
| Real time | Signed webhooks, plus a 7-day event feed |
| Spec | OpenAPI 3.1, `https://www.getspurly.com/developers/openapi.v2.json` |

## Start here

- [Quickstart](/developers/v2/quickstart): from API key to your first LinkedIn call.
- [Concepts](/developers/v2/concepts): organisations, accounts, one member one organisation, statuses.
- [Connect LinkedIn](/developers/v2/guides/connect-linkedin): the sign-in and verification flow.
- [Open in Spurly](/developers/v2/guides/open-in-spurly): send a customer into the full Spurly app with a one-time link.
- [API reference](/developers/v2/api/orgs): every endpoint, parameter and response.
- [LinkedIn limits](/developers/v2/guides/linkedin-limits): a safe pace for each action, and what to do when an account hits a limit.
- [What each account can do](/developers/v2/guides/linkedin-features): which features work on every account, depend on the plan, or are not offered.
- [Connection methods](/developers/v2/guides/connection-methods): credentials or cookie, where LinkedIn sees the sign-in from, and reconnects.

## Getting access

`/v2` is enabled per partner. [Book a call](/book-demo) or email founders@getspurly.com and we enable it on your API key.
