---
title: What each LinkedIn account can do
seoTitle: LinkedIn features by account type | Spurly API v2
navTitle: Features by account
description: Which LinkedIn features the Spurly organisation API offers, which depend on the member's LinkedIn plan, and which are not offered.
lead: Most of the API works on any LinkedIn account. A few features depend on the member's plan. A few are not offered at all.
path: /developers/guides/linkedin-features
template: docs
section: Guides
order: 5
date: 2026-11-11
parent: /developers
---
Spurly calls LinkedIn as the connected member, so what you can do is what that member can do in LinkedIn itself. When an account's plan does not include a feature, you get `403 FEATURE_UNAVAILABLE`. For the endpoints themselves see the [API reference](/developers/api/orgs).

## Works on every account

| Area | What you can do | Calls |
|---|---|---|
| Sign in | Credentials or session cookie, with every verification step | [Connect](/developers/api/connect) |
| Chats | List, read, start, delete, mark read or unread, list participants | `/chats` |
| Messages | List, get one, send text, send a file, voice note or video, delete your own, react, download attachments | `/chats/{chatId}/messages`, `/messages/{messageId}` |
| Profiles | Your own profile, any profile with optional sections | `/profile`, `/profiles/{identifier}` |
| Search | People, companies and posts, with filter lookups | `/search`, `/search/parameters` |
| Connections | Send, list, cancel and accept or decline requests; list connections | `/invitations`, `/relations` |
| Network actions | Follow a member, endorse a skill of a 1st-degree connection | `/follows`, `/endorsements` |
| Posts | List a member's or company's posts, create, get, comment, react, list comments and reactions | `/posts`, `/profiles/{identifier}/posts` |
| Companies | A company page, by public identifier or id | `/companies/{identifier}` |
| Real time | New and changed messages and connection changes, as webhooks and a 7-day feed | [Webhooks](/developers/webhooks) |

## Depends on the account

| Feature | What decides it |
|---|---|
| Connection request notes | A paid account can add a note of up to 300 characters. A free account gets 200 and far fewer notes a month. |
| InMail | Needs InMail credits from Premium, Sales Navigator or Recruiter. `GET /inmail-balance` returns one balance for each: `premium`, `recruiter` and `salesNavigator`. A `null` means LinkedIn did not report it, not zero. Free InMail to open profiles is capped by LinkedIn each month and may still need a credit. |
| Profile viewers | A free account is not refused: it gets the first few viewers by name and the rest come back locked. A Premium account sees the full list. |
| Followers | The member's own followers, and the followers of a company page the member administers. Anyone else's page returns an empty list, so an empty page does not mean zero followers. |
| Sales Navigator and Recruiter | Connect with the `cookies` method and send `premiumToken` (the `li_a` cookie) so LinkedIn recognises the seat. See [Connection methods](/developers/guides/connection-methods). |

## Not offered in `/v2`

- **Job posting, job search and applicants.** Search covers people, companies and posts only.
- **LinkedIn Recruiter and Sales Navigator search and inboxes.** Search runs as standard LinkedIn search.
- **A "following" list.** Followers only.
- **Raw access to LinkedIn.** Every call is one of the documented endpoints. Anything else is `404 NOT_FOUND`.
- **A hosted sign-in page.** You collect the sign-in in your own screen. See [Connect LinkedIn](/developers/guides/connect-linkedin).
- **Email, calendar and other messengers.** `/v2` is LinkedIn only.

If you need something that is not offered, [email us](mailto:founders@getspurly.com). The [changelog](/developers/changelog) lists what has been added.
