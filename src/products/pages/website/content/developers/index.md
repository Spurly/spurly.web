---
title: Spurly LinkedIn API
seoTitle: Spurly LinkedIn API: Inbox, Messaging and Account Sync
navTitle: Overview
shortTitle: Developers
description: Connect your users' LinkedIn accounts, sync their inbox and send and receive LinkedIn messages in real time with one REST API and webhooks.
lead: Give your product a LinkedIn inbox. Your users connect their LinkedIn account, and you read, send and receive their messages in real time.
path: /developers
template: docs
section: Get started
order: 1
date: 2026-10-24
priority: 0.6
target_query: linkedin messaging api
---
The Spurly LinkedIn API is a REST API with webhooks. Spurly runs the hard parts of LinkedIn: the sign-in and its verification codes, keeping the session alive, importing recent message history and delivering every new message the moment it arrives. You build the experience in your own product.

## What you can build

- **Connect LinkedIn.** Your users sign in with email and password or a session cookie, inside your own UI. Spurly handles every LinkedIn verification step.
- **A full LinkedIn inbox.** Conversations with names, headlines and photos; complete message history; attachments; reactions; read receipts.
- **Send and receive in real time.** Reply, start new conversations, send files, voice notes and video. New messages, reads, reactions and edits reach your webhook within seconds.
- **Live connection health.** Know the moment a LinkedIn session needs reconnecting.

## How it works

1. You create an **account** for each of your users with `POST /accounts`.
2. The user connects LinkedIn through your form; you pass the details to `/linkedin/connect`.
3. Spurly imports their conversation history in the background.
4. You list conversations and messages, and send messages, through the API.
5. Spurly POSTs every new event to your **webhook**: new messages, read receipts, reactions, and connection changes.

| | |
|---|---|
| Base URL | `https://api.getspurly.com/v1` |
| Auth | `Authorization: Bearer spk_partner_...` |
| Format | JSON over HTTPS |
| Real time | Signed webhooks, plus a 30-day event feed |
| Spec | [OpenAPI 3.1](/developers/openapi) |

## Start here

- [Quickstart](/developers/quickstart): from API key to first message in a few minutes.
- [Connect LinkedIn](/developers/guides/connect-linkedin): the sign-in and verification flow.
- [Webhooks](/developers/guides/webhooks): receive messages and status changes in real time.
- [API reference](/developers/api/accounts): every endpoint, parameter and response.

## Getting access

API access is set up per partner. [Book a call](/book-demo) or email founders@getspurly.com and we issue your API key and webhook signing secret.
