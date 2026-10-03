---
title: "Safe LinkedIn automation limits per day: requests, messages and visits"
seoTitle: "LinkedIn Automation Limits Per Day (2026 Guide)"
shortTitle: Daily limits per action
description: "Daily limits for LinkedIn connection requests, messages, profile visits and likes: what vendors suggest and the defaults Spurly enforces."
excerpt: "What vendors suggest per day for each LinkedIn action, and the real per-action limits Spurly enforces on every account."
path: /blog/linkedin-automation-limits-per-day
template: article
date: 2026-10-03
readTime: 6 min read
cluster: automation-safety
parent: /blog/is-linkedin-automation-safe
author: sarthak
target_query: linkedin connection request limit per day
related: [/blog/is-linkedin-automation-safe, /blog/linkedin-weekly-invitation-limit, /product/safety]
faq:
  - q: How many LinkedIn connection requests can I send per day?
    a: LinkedIn publishes no daily number. Vendor guidance is roughly 20 to 40 a day for connection requests, spread across the working week. Spurly's default is a maximum of 40 a day and 8 an hour.
  - q: How many LinkedIn messages per day is safe?
    a: There is no published figure. Zeliq's 2026 guide suggests 30 to 60 direct messages a day. Spurly's default is 80 a day and 15 an hour.
  - q: Are the limits per tool or per account?
    a: Per account. LinkedIn sees one member, so activity from several tools and your own use add up.
  - q: Why limit actions per hour as well as per day?
    a: Without an hourly limit a daily allowance can be used in minutes, which looks nothing like a person.
todo:
  - Re-check the table against prod env before publishing
---
**Short answer:** LinkedIn publishes no daily limits, so every number you see is a vendor's planning figure. The common guidance is about 20 to 40 connection requests a day and a few dozen messages. Spurly enforces fixed limits for each kind of action, counted over a rolling 24 hours and 60 minutes, and refuses a send that would break them.

## What vendors suggest

Zeliq's 2026 guide (9 June 2026) gives these ranges for a typical account. It says older accounts with a high acceptance rate can use the upper end and newer ones should stay lower.

| Action | Zeliq suggested daily range | Spurly default daily limit | Spurly default hourly limit |
|---|---|---|---|
| Connection requests | 20 to 40 | 40 | 8 |
| Messages | 30 to 60 | 80 | 15 |
| Profile visits | 80 to 150 | 80 | 20 |
| Likes and comments | 20 to 50 | 40 likes, 10 comments | 10 likes, 3 comments |

Expandi (28 September 2026) takes a more cautious line for new accounts, ramping from 5 actions a day to 21 over two weeks. None of these figures comes from LinkedIn, and each source says so in some form.

## Spurly's limits for every action

| Action | Daily limit | Hourly limit | Minimum gap |
|---|---|---|---|
| Connection requests | 40 | 8 | 2 minutes |
| Messages | 80 | 15 | 1 minute |
| Profile visits | 80 | 20 | 30 seconds |
| Follows | 25 | 6 | 2 minutes |
| Post likes | 40 | 10 | 1 minute |
| Post comments | 10 | 3 | 10 minutes |
| Skill endorsements | 20 | 5 | 2 minutes |

How they work:

- **Rolling windows.** A limit looks back over the last 24 hours or 60 minutes, so there is no midnight reset that lets you do a day's work in the first minute.
- **Random gaps.** The minimum gap is varied by about 40% either way for each send.
- **A shared ceiling.** In any 24 hours, Spurly stops automated actions once it has done 150 across these types, so many small limits cannot add up to a large total.
- **Manual actions still count.** The limits and gaps apply even when you click a button yourself.

These are defaults and may be tightened as LinkedIn's behaviour changes. The current table is also on the [safety page](/product/safety).

## Why different actions have different limits

Actions are not equally visible. Connection requests and comments reach other people and can be reported, so they have lower limits and longer gaps. Profile visits are passive and cheaper, so they allow more. That is why Spurly's comment limit is 10 a day with a ten-minute gap while profile visits allow 80 a day with a 30-second gap. Treat any single table as a starting point and give the most visible actions the most room.

## Example: a modest day

A cautious day on a mature account might be 20 connection requests, 25 profile visits, 15 messages to accepted connections and a handful of likes. That is well under Spurly's ceilings and sits at the lower end of the vendor ranges above. It is an illustration of pace, not advice for your account.

## Choosing your own pace

A limit is a ceiling, not a target. A sensible pace is well under it:

1. Start at roughly a quarter to a half of the daily limit for the first week or two; see [warming up an account](/blog/linkedin-account-warm-up).
2. Raise it gradually while your acceptance rate stays healthy.
3. Run connection requests across several days; the weekly total matters more than any one day ([weekly limit](/blog/linkedin-weekly-invitation-limit)).
4. If you see a warning from LinkedIn, drop back and stop sending until it clears.

The full picture is in the guide: [is LinkedIn automation safe?](/blog/is-linkedin-automation-safe).

## Sources

Checked on 3 October 2026.

- [Zeliq: LinkedIn automation 2026](https://www.zeliq.com/blog/linkedin-automation-2026), 9 June 2026
- [Expandi: safest LinkedIn automation tools](https://expandi.io/blog/safest-linkedin-automation-tools/), dated 28 September 2026
- Spurly's limits are the defaults in our own product, checked on 3 October 2026.
