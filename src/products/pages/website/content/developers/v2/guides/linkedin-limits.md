---
title: LinkedIn limits and safe sending
seoTitle: LinkedIn limits and safe sending | Spurly API v2
navTitle: LinkedIn limits
description: What LinkedIn tolerates per account, a safe pace for each kind of action, and how to handle the errors LinkedIn and Spurly return when an account goes too fast.
lead: LinkedIn limits belong to the member's account, not to an endpoint. Here is a safe pace for each action, and what to do when an account hits a limit.
path: /developers/v2/guides/linkedin-limits
template: docs
section: v2: Guides
order: 4
date: 2026-11-11
parent: /developers/v2
---
Every limit on this page belongs to **one LinkedIn account**. It does not matter which endpoint made the call, and the limits do not add up across accounts: ten connected members each have their own. Spurly does not slow your calls down (see [Limits and pagination](/developers/v2/limits)), so the pace is yours to keep. Going too fast does not break the API; it puts the member's LinkedIn account at risk of warnings and restrictions.

## Rules that matter more than any number

- **Spread calls out at random.** Do not chain calls at a fixed interval or run a job at the same minute every day. Pick random gaps and spread them across the member's working hours.
- **Start low, then grow.** An account that is new, rarely used, or has fewer than about 150 connections can have connection requests delayed or held for a check by LinkedIn before they show up. Ramp up over weeks, not days.
- **Use real accounts.** LinkedIn detects fake accounts even when nothing is automated.
- **Stop when LinkedIn says stop.** A `429` or a refused request means that kind of action is done for the day on that account. Do not retry in a loop.
- **Anything not listed below:** keep it small, space it out, and stay under about 100 a day per account.

## A safe pace for each action

These are the numbers Spurly itself uses to pace its own workspace. They are conservative starting points, not guarantees: you may go higher at your own risk, and LinkedIn can change what it tolerates at any time.

| Action | Calls | Per hour | Per day | Per week |
|---|---|---|---|---|
| Connection requests | `POST /invitations` | 10 | 80 | 200 |
| Messages | `POST /chats/{chatId}/messages`, `POST /chats` | 20 | 100 | 500 |
| InMail | `POST /chats` with `subject` | 3 | 10 | 40 |
| Message files | `POST /chats/{chatId}/messages` with `kind` | 6 | 20 | 80 |
| Profile visits | `GET /profiles/{identifier}` | 25 | about 100 | 600 |
| Follows | `POST /follows` | 6 | 30 | 150 |
| Post likes | `POST /posts/{postId}/reactions` | 12 | 60 | 300 |
| Comments | `POST /posts/{postId}/comments` | 3 | 15 | 60 |
| Skill endorsements | `POST /endorsements` | 5 | 20 | 80 |
| Posts | `POST /posts` | 1 | 2 | 7 |

Leave at least a minute or two between two sends of the same kind, and add a random pause now and then. Overnight, in the member's time zone, slow down further.

## Connection requests

- A paid, active account can send roughly 80 to 100 requests a day and about 200 a week. A free account is far tighter: a handful of requests with a note each month, and a few hundred a week without one.
- The note is at most 300 characters on a paid account and 200 on a free one. A note that is too long answers `422 TOO_LONG`.
- When LinkedIn refuses a request because the account has used its allowance, you get an error instead of a `201`. Treat it as "no more requests today" and try again tomorrow. LinkedIn shows the same refusal in its own app.
- Do not check for accepted requests by polling on a schedule. See [Checking for new connections](#checking-for-new-connections).

## Search

LinkedIn returns at most **1,000 results for a single search**, however many the page claims to match. To go deeper, split the search with filters (location, company, industry) and run several. Across a day, fetch no more than about 1,000 results in total. That counts results read, not requests.

## Profile reads

Reading profiles is how most accounts get flagged. Stay near 100 a day per account, space the reads out, and do not ask for `sections` you do not need: each section is more work for LinkedIn.

## Checking for new connections

Do not poll `GET /relations` or `GET /invitations/sent` every hour or at a fixed time such as 8:00 each morning. That pattern is easy for LinkedIn to see. Do one full read when you first import an account, then fetch only the first page a few times a day, at random gaps of several hours. Connections are listed newest first, so the first page is enough to see who is new.

## InMail

How many InMails an account can send depends on its LinkedIn plan: a Premium subscription includes a small monthly number, and Sales Navigator or Recruiter seats include more. Read the balance with `GET /inmail-balance`. A value of `null` means LinkedIn did not report that balance. It does not mean zero.

LinkedIn lets accounts message members with an open profile for free, up to a monthly cap that LinkedIn sets and can lower per account. Even then, LinkedIn may still insist on an available credit. If you send InMails in volume, keep to a few a day so the month's allowance lasts.

## Messages and chats

Spurly reads chats from LinkedIn live in `/v2`, so do not poll them. Listen for `message.created` and `message.updated` webhooks instead, and read a chat only when you need to. Each LinkedIn account is also held to 60 requests a minute by Spurly (`429 RATE_LIMITED`).

## What Spurly does for you

- **Per-account throttle.** 60 requests a minute per LinkedIn account and 600 a minute per API key, with `Retry-After` on `429`.
- **Safety limit.** If an organisation also uses the Spurly workspace, the same account may be driven from both places, so Spurly counts connection requests and messages from both and answers `429 ACCOUNT_LIMIT` at the limits in [Limits and pagination](/developers/v2/limits#safety-limit-for-accounts-that-also-use-the-spurly-workspace). Organisations that use only the API are not counted.
- **Never retrying a write.** A send that times out may or may not have gone through. Spurly never repeats it for you. See [Errors](/developers/v2/errors#retrying-writes).

## Handling the errors

| You get | It means | Do this |
|---|---|---|
| `429 RATE_LIMITED` with `Retry-After` | You are over Spurly's throttle, or LinkedIn is limiting the account | Wait the time given, then retry reads. For sends, slow the whole account down |
| `429 ACCOUNT_LIMIT` | The account reached its safety limit for that action. Nothing was sent | Wait for `Retry-After`; do not queue more for that account today |
| `422 TOO_LONG` | The text is longer than LinkedIn allows for that account | Shorten the note or message |
| `403 FEATURE_UNAVAILABLE` | The account's LinkedIn plan does not include that feature | See [What each account can do](/developers/v2/guides/linkedin-features) |
| `409 ACCOUNT_NEEDS_RECONNECT` | LinkedIn wants the member to sign in again | Reconnect; see [Connect LinkedIn](/developers/v2/guides/connect-linkedin) |
| `504 TIMEOUT` on a send | It may have gone through | Read first, then repeat only if it did not |

LinkedIn's own limits are set by LinkedIn and can change without notice. If an account is restricted, the member has to sort it out on linkedin.com; the API reports `422 ACCOUNT_RESTRICTED`.
