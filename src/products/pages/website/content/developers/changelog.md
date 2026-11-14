---
title: Changelog
description: Every change to the Spurly LinkedIn API, newest first, with the date it shipped and what it means for your integration.
path: /developers/changelog
template: docs
section: Resources
order: 2
date: 2026-11-14
parent: /developers
---
Non-breaking additions ship without notice and are listed here. Breaking changes only ship in a new API version, with at least 90 days of overlap. See [Limits](/developers/limits).

## 14 November 2026

The account API (`/v1`) is retired. The organisation API (`/v2`) is the Spurly LinkedIn API, and its pages are now the whole of these docs.

- Requests to `/v1` are no longer served. Move to `/v2`: create an organisation per customer, connect a LinkedIn account under it, and call LinkedIn through `/accounts/{accountId}/...`.
- The `/v1` pages, guides and `openapi.json` are removed. `openapi.v2.json` is unchanged.

## 12 November 2026

Two organisation API (`/v2`) additions. Nothing existing changed.

- New: `POST /orgs/{orgId}/login-link` returns a one-time "Open in Spurly" URL that signs your customer in to their organisation, optionally with one LinkedIn account already chosen (`accountId`). It works once and expires after 2 minutes. See the [Open in Spurly](/developers/guides/open-in-spurly) guide.
- New: `GET /connect-options` returns the country LinkedIn will most likely see a sign-in from (pass the end user's IP as `endUserIp`) and the accepted proxy protocols, for your connect screen.

## 11 November 2026

Three new organisation API endpoints and three new guides.

- New: `GET /accounts/{accountId}/messages/{messageId}` returns one message.
- New: `POST /accounts/{accountId}/follows` follows a member.
- New: `POST /accounts/{accountId}/endorsements` endorses a skill of a 1st-degree connection. You name the skill; Spurly looks it up on the profile just before endorsing.
- New guides: [LinkedIn limits](/developers/guides/linkedin-limits), [What each account can do](/developers/guides/linkedin-features) and [Connection methods](/developers/guides/connection-methods).

## 4 November 2026

The organisation API (`/v2`) is documented.

- New: [Spurly organisation API](/developers). Create organisations, connect a LinkedIn member under each, call LinkedIn through `/accounts/{accountId}/...`, and read usage with `GET /usage`. `/v2` is enabled per partner.
- The OpenAPI description is published as `openapi.v2.json`.
