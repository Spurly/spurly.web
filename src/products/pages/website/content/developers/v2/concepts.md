---
title: Concepts
seoTitle: Concepts | Spurly API v2
description: How organisations, LinkedIn accounts, the one-member-one-organisation rule, account statuses and billing counts work in the Spurly organisation API.
lead: The few ideas the rest of the API rests on.
path: /developers/v2/concepts
template: docs
section: v2: Get started
order: 3
date: 2026-11-04
parent: /developers/v2
---
## Organisations

An organisation is one of your customers. You create it with your own `externalId`. It has a `status` of `active` or `suspended`. A suspended organisation cannot connect accounts or make LinkedIn calls (`403 ORG_SUSPENDED`); you can still read it and disconnect its accounts.

## Accounts

An account is one connected LinkedIn member under an organisation. Its id is a Spurly id: you use it in every LinkedIn call. The account `status` says how the connection is:

| Status | Meaning |
|---|---|
| `OK` | Healthy. LinkedIn calls work. |
| `CONNECTING` | A sign-in is in progress. |
| `CREDENTIALS` | LinkedIn needs the member to sign in again. Reconnect with the account's `id` as `accountId`. |
| `STOPPED` | Paused by LinkedIn. |
| `DELETED` | Disconnected. |

LinkedIn calls on an account that is not `OK` answer `409 ACCOUNT_NOT_CONNECTED` with the state in `details.state`. Watch `account.updated` webhooks to know when to reconnect.

## One member, one organisation

A LinkedIn member can be live in one organisation at a time. Connecting a member who is live elsewhere answers `409 PROFILE_IN_USE`, and the sign-in is released: nothing is left connected. Disconnect the member first, then connect them where you want them. Reconnecting the same member in the same organisation reuses the same account.

## What you are billed on

Billing counts **distinct LinkedIn members**, not accounts or connects. A member who disconnects and reconnects, or moves between organisations, counts once. `GET /usage` returns the numbers: `connected` now, `distinct` in the window and the `peak`. See the [usage guide](/developers/v2/guides/usage).

## Ids

Organisation and account ids are Spurly ids. Chat, message, attachment, post and invitation ids, and pagination cursors, come from LinkedIn calls and are passed back to you unchanged: use them as given. LinkedIn links in responses always point to LinkedIn.
