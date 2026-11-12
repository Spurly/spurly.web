---
title: Migrate from v1 to v2
seoTitle: Migrate from the Spurly account API (v1) to the organisation API (v2)
navTitle: Migrate from v1
description: What changes when you move from the Spurly account API (v1) to the organisation API (v2): the new model, an endpoint map, webhook differences and a step-by-step plan.
lead: Move from one account per user to organisations, and from a stored inbox to live LinkedIn calls. This guide maps every v1 call to its v2 replacement.
path: /developers/v2/guides/migrate-from-v1
template: docs
section: v2: Guides
order: 7
date: 2026-11-11
parent: /developers/v2
---
`/v1` is not deprecated, and it is unaffected by `/v2`. Both use the same API key format. A breaking change only ever ships in a new version, with at least 90 days of overlap. Move when you want what `/v2` adds: organisations, LinkedIn search and profiles, invitations, posts and more.

`/v2` is enabled per API key. [Book a call](/book-demo) or email founders@getspurly.com to plan the switch. Moving your existing accounts is done with Spurly's help, not by calling the API, so agree the cut-over with us first.

## What changes

| | v1 | v2 |
|---|---|---|
| Model | One **account** per LinkedIn profile, created with your own `externalId` | An **organisation** per customer (their email address is its `externalId`), with LinkedIn accounts connected under it |
| Base URL | `https://api.getspurly.com/v1` | `https://api.getspurly.com/v2` |
| Inbox | Spurly imports and stores conversations and messages, and you read the copy | Spurly reads LinkedIn live on each call. Nothing is imported or stored for you |
| Paging | `page` and `limit` | `cursor` and `limit` for LinkedIn lists |
| Ids | Spurly's own chat and message ids | LinkedIn's chat, message and post ids, passed through unchanged |
| Webhook settings | You set them yourself: `PUT /webhook`, test and rotate | Spurly sets the URL and secret when your key is enabled; ask us to change them |
| Event feed | 30 days | 7 days |
| Billing | See your plan | Distinct LinkedIn members. `GET /usage` shows the count |
| Scope | Inbox and messaging | Inbox, search, profiles, invitations, connections, followers, posts, companies, InMail balance and more |

Treat every id as belonging to the version that returned it. Do not carry a v1 chat or message id into a v2 call.

## Endpoint map

| v1 | v2 |
|---|---|
| `POST /accounts` (`externalId`) | `POST /orgs` with the customer's email as `externalId` |
| `GET /accounts`, `GET /accounts/{accountId}` | `GET /orgs/{orgId}/accounts`, `GET /accounts/{accountId}` |
| `DELETE /accounts/{accountId}` | `DELETE /accounts/{accountId}` (disconnects the LinkedIn account) |
| `POST /accounts/{accountId}/linkedin/connect` | `POST /orgs/{orgId}/accounts/connect`. Add `accountId` to reconnect |
| `POST .../linkedin/checkpoint` | `POST /orgs/{orgId}/accounts/connect/checkpoint`, with `connectId` and `code` |
| `POST .../linkedin/checkpoint/status` | `GET /orgs/{orgId}/accounts/connect/status?connectId=` |
| `POST .../linkedin/checkpoint/another-way`, `.../resend` | `POST /orgs/{orgId}/accounts/connect/checkpoint/another-way`, `.../resend` |
| `DELETE /accounts/{accountId}/linkedin` | `DELETE /accounts/{accountId}` |
| `GET /accounts/{accountId}/chats` | `GET /accounts/{accountId}/chats` |
| `GET /accounts/{accountId}/chats/{chatId}` (chat and its messages) | `GET .../chats/{chatId}` for the chat, `GET .../chats/{chatId}/messages` for its messages |
| `POST .../chats/{chatId}/read` | `PATCH .../chats/{chatId}` with `{ "read": true }` |
| `POST .../chats/{chatId}/messages` | `POST .../chats/{chatId}/messages` |
| `POST /accounts/{accountId}/conversations` | `POST /accounts/{accountId}/chats` with `memberId` and `text` |
| `POST .../chats/{chatId}/media` | `POST .../chats/{chatId}/messages?kind=attachment`, `voice` or `video` |
| `POST .../messages/{messageId}/reaction` | `POST .../messages/{messageId}/reactions` |
| `GET .../messages/{messageId}/attachments/{attachmentId}` | Same path |
| `GET /events` | `GET /events` |
| `GET /accounts/{accountId}/inbox`, `POST .../inbox/sync` | No equivalent. There is no stored inbox to sync |
| `GET`, `PUT /webhook`, `POST /webhook/test`, `POST /webhook/rotate-secret` | No equivalent. Spurly manages them with you |
| `POST /accounts/{accountId}/login-link` | `POST /orgs/{orgId}/login-link`, optionally with an `accountId`. See [Open in Spurly](/developers/v2/guides/open-in-spurly) |
| `GET /linkedin/connect-options` | `GET /connect-options` |
| `DELETE /accounts/{accountId}/login` | No equivalent. Customers sign in to Spurly with their email address, so there is no separate login to remove |

New in v2, with no v1 equivalent: profiles and search, invitations and connections, followers, profile viewers, posts and comments, companies, InMail balance, follow, endorse, delete a chat or a message, and `GET /usage`. See the [API reference](/developers/v2/api/orgs).

## Webhooks

The three events keep their names: `message.created`, `message.updated` and `account.updated`. The payloads change a little.

| | v1 | v2 |
|---|---|---|
| Who it is for | `data.externalId` | `data.accountId`, `data.orgId` and `data.orgExternalId` |
| `message.updated` reasons | `read`, `reaction`, `message_edited`, `message_deleted`, `message_delivered` | `change`: `read`, `reaction`, `edited`, `deleted`, `delivered` |
| `account.updated` | `previousState` and `account.linkedin.state`, for example `needs_reconnect` | `previousStatus` and `account.status`: `OK`, `CREDENTIALS`, `CONNECTING`, `STOPPED` or `DELETED` |
| `webhook.test` | Sent by `POST /webhook/test` | Not sent |

Signing is the same: `X-Spurly-Event` and `X-Spurly-Signature`, an HMAC over `<t>.<raw body>`, with a `2xx` answer within 8 seconds. Details are in [Webhooks](/developers/v2/webhooks).

## Plan the switch

1. **Read the model.** [Concepts](/developers/v2/concepts) explains organisations, accounts, statuses and the one-member-one-organisation rule.
2. **Map your customers.** Each v1 account belongs under one organisation, whose `externalId` is the customer's email address. Several accounts of the same customer share an organisation, but an organisation holds one live LinkedIn member at a time.
3. **Build and test on `/v2`.** Create an organisation, connect an account and call LinkedIn. Ask us for a test key that is enabled for `/v2`.
4. **Replace the inbox copy.** If you read Spurly's stored inbox, switch to live reads: list chats and messages with `cursor`, and keep your own copy fed by `message.created` and `message.updated` webhooks. Catch up after downtime with `GET /events?after=`, and note the feed is 7 days.
5. **Handle both webhook shapes** while you move. Accounts still on `/v1` keep sending v1 payloads until they move, so read the fields you need defensively.
6. **Move accounts with us.** We agree an order with you, move one account first, and check that messages arrive and the status stays `OK` before moving the rest.
7. **Switch `/v1` off last.** Once no calls come in on `/v1` for a while, stop using it.

## Things that behave differently

- **No stored history.** v1 imported the newest conversations and the latest 50 messages of each. v2 reads what LinkedIn returns on each call, so a very large inbox pages through LinkedIn rather than Spurly.
- **Pacing is yours.** v2 does not slow your sends. Read [LinkedIn limits](/developers/v2/guides/linkedin-limits) before you send in volume.
- **Errors are shared.** Both versions answer `{ success, code, message, status }`. v2 adds the codes in [Errors](/developers/v2/errors), such as `ACCOUNT_NOT_CONNECTED`, `PROFILE_IN_USE` and `ORG_SUSPENDED`.
- **Unknown paths are `404`.** A path that is not in the [API reference](/developers/v2/api/orgs) never reaches LinkedIn.
