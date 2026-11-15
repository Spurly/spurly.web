---
title: LinkedIn limits and restrictions
seoTitle: LinkedIn limits and restrictions | Spurly API
navTitle: LinkedIn limits
description: The limits and restrictions LinkedIn applies to a connected account: connection requests, profile reads, search, new connections, InMail and LinkedIn Recruiter.
lead: Every limit here belongs to the member's LinkedIn account, not to an endpoint. Keep to them and handle the errors LinkedIn returns when you go over.
path: /developers/guides/linkedin-limits
template: docs
section: Guides
order: 4
date: 2026-11-15
parent: /developers
---
These limits are conservative recommendations. You may raise the values at your own risk. Going over LinkedIn's limits makes the call fail (see [Errors](/developers/errors), for example `429 RATE_LIMITED` or `502 PROVIDER_ERROR`), so make sure your system handles it, to avoid automation warnings on the member's account.

To look like a person, space all calls out instead of chaining them at regular intervals. Use random gaps and spread the calls across several runs during working hours.

For new or inactive accounts, start with low quantities and increase gradually. An account with fewer than about 150 connections, or one created recently, can have invitations delayed or held for a manual check by LinkedIn before they appear in the app. LinkedIn detects fake accounts well, even without automation, so use only real accounts.

*These limits are defined per LinkedIn account. They are independent of the route and do not add up.*

Spurly's own request limits and the safety limit are described in [Limits and pagination](/developers/limits).

## Connection requests

- **Paid and active account:** between 80 and 100 invitations a day, and about 200 a week, with a message of up to 300 characters.
- **Free account:** about 5 invitations a month with a message of up to 200 characters, and about 150 invitations a week without a note.

When you hit the invitation limit, LinkedIn refuses the invitation and the call fails with an error instead of succeeding. LinkedIn enforces this limit itself, so it is the same limit the member sees in the LinkedIn app. You can try the same action in the app with the same invitation type (with or without a note). The app only shows LinkedIn's error at the last step, so you can start the process and think the invitation will be sent, but it fails at the end.

## Retrieve a profile

About 100 profiles per account per day (profile visits and id conversion). This is a recommendation, not a hard limit.

An account with Sales Navigator or Recruiter has more room per day. Recruiter Lite has an [official limit of 2,000](https://www.linkedin.com/help/recruiter/answer/a497998?hcppcid=search).

## Search results

There are two separate limits to keep in mind.

1. **Per-search cap (LinkedIn limit).**
   - Standard LinkedIn: at most 1,000 profiles returned for a single search.
   - Sales Navigator and Recruiter: at most 2,500 profiles for a single search. Company search on Sales Navigator is still 1,000.
   - Even when the LinkedIn app shows more total results, LinkedIn only returns the first 1,000 (or 2,500) for that search. To get everything, narrow the search with filters and run several searches.
2. **Daily usage (recommendation, not enforced).** Retrieve no more than 1,000 profiles a day (standard) or 2,500 (Sales Navigator and Recruiter). This is the number of result lines actually fetched in a day, not the number of requests.

## Relations and the invitation list

You may want to poll relations or the invitation list to find accepted invitations. Do not poll every hour or at fixed times such as 8:00 every morning: that pattern is easy to flag as automation.

Do one initial sync, during which you can call the endpoint several times. After that, retrieve only the first page, a few times a day, at random intervals of several hours.

## Retrieving chats

LinkedIn's chats and messages are read from the member's inbox for you, so you can list chats and fetch messages through the chat routes without pacing them like invitations. Spurly's request limits still apply: see [Limits and pagination](/developers/limits).

## InMail

How many InMails a member can send depends on their LinkedIn subscription. For example, Career subscriptions start with 5 InMails a month, while some Recruiter contracts include thousands of shared InMails. Read the available credit with `GET /accounts/{accountId}/inmail-balance`.

**Free InMail to open profiles.** You can send free InMails to open profiles. An open profile shows as `openProfile` when you retrieve it (the value is for the given account and can differ on another account). LinkedIn caps free InMails at a maximum of 800 a month per account. It lowers that number for some account types and depends on other factors such as history, acceptance and the LinkedIn product you send from (classic, Sales Navigator or Recruiter can give different results). You get the same result as in LinkedIn's own app. There is more on the Recruiter limit [in LinkedIn's help](https://www.linkedin.com/help/recruiter/answer/a745199).

In some cases LinkedIn still requires an available InMail credit, even for a free InMail to an open profile. If the account has no credit left, the send can fail depending on the product and LinkedIn's rules.

Space InMails out at random and limit sends to 30 to 50 a day, to make the monthly allowance go further.

## Other routes

For every route not listed above, follow the same principles:

- Use as little as possible.
- Space calls out at random intervals.
- By default, limit each action to 100 a day per account, for example retrieving company profiles, retrieving posts, sending messages to connections, commenting or adding reactions.

## LinkedIn Recruiter

LinkedIn Recruiter limits the number of simultaneous sessions. Signing a member in with their LinkedIn credentials can trigger a LinkedIn warning that reminds them not to share their credentials, and the member has to acknowledge it. If LinkedIn then sees a new session, it lists the current sessions and asks the member to choose which one to end before they can keep using LinkedIn in their browser.

This is not a long-term risk to the account, but it is a poor experience: the member has to reconnect the account each time the pop-up appears.

If you need Recruiter, connect the account with cookies (`method: cookies`, with the `li_at` value as `accessToken` and the `li_a` value as `premiumToken`). Spurly does not host a sign-in page, so you collect these in your own product. Asking a member to open their browser's developer tools to find cookies needs a clear explanation for non-technical members. The best way to handle it is a Chrome extension that collects the cookies in the background after the member installs it. See [Connection methods](/developers/guides/connection-methods#smooth-reconnects-with-a-browser-extension).
