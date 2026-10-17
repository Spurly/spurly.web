---
title: "24/7 outreach that stays inside LinkedIn limits"
seoTitle: Is LinkedIn Automation Safe? How Spurly Paces It
shortTitle: Safety
description: "How Spurly paces LinkedIn automation 24/7: uneven gaps, quiet hours, a backstop at LinkedIn's limit, reply-pause and an honest account of the risk."
path: /product/safety
template: product
date: 2026-10-03
updated: 2026-10-17
priority: 0.8
target_query: is linkedin automation safe
related: [/product/campaigns, /product/inbox]
faq:
  - q: Does Spurly run 24/7, and is that safe?
    a: Spurly sends around the clock, weekends included, but spaces actions with uneven gaps like a person's and slows right down during your quiet hours. That lowers the risk. No tool can promise zero risk, and LinkedIn can restrict an account at its discretion.
  - q: Will Spurly message the same person twice?
    a: No. Spurly skips anyone you contacted in the last 30 days across your campaigns, skips anyone you have already invited, and stops a person's sequence the moment they reply.
  - q: How many connection requests can Spurly send?
    a: Behind the pacing sits a backstop of 80 connection requests a day and 200 a week, and 100 messages a day and 500 a week. These numbers may be tightened at any time, and the backstop is a ceiling, not a target.
  - q: Is LinkedIn automation safe?
    a: No tool can promise that. LinkedIn's User Agreement restricts automation, and LinkedIn can restrict an account at its discretion. Spurly is designed to stay within the limits LinkedIn applies to normal use, and it paces its sends to look like a person, but the risk is never zero.
  - q: Will Spurly get my account banned?
    a: Spurly cannot promise that it will not. It spaces sends out with random gaps that follow no fixed pattern, slows down overnight, stays under LinkedIn's own weekly invitation limit and stops when someone replies, which lowers the risk without removing it.
  - q: Can I change how Spurly spaces my sends?
    a: You can turn the overnight slowdown on or off and choose its hours under Settings, Sending hours. The spacing itself and the safety backstop are set by Spurly and adjusted as LinkedIn's behaviour changes.
  - q: What if LinkedIn disconnects my account?
    a: Campaigns pause instead of continuing with a broken connection, and you reconnect your account to carry on.
todo:
  - Re-check the backstop numbers (connect 80 a day and 200 a week, message 100 a day and 500 a week) against backend src/platform/limits/constants/registry.js whenever they change
---
Spurly runs 24/7 but is designed to stay within LinkedIn's limits, pacing its sends with uneven gaps like a person's. LinkedIn's User Agreement restricts automation, and no tool can promise zero risk or that an account will never be restricted. This page explains what Spurly does to lower the risk and what it cannot remove.


![A Spurly campaign showing its sending progress. Names are blurred.](/assets/app-campaign-detail.webp)

## The honest risk statement

LinkedIn does not allow automation of the kind Spurly performs, and it can restrict or close an account at its own discretion. Spurly does not claim to be undetectable or 100% safe, and you should not trust any tool that does. What Spurly can do is keep your activity modest, regular and human-shaped. That is what the rest of this page describes.

## A backstop on connection requests and messages

Spurly does not hand you an allowance to count down. Sends are spread out on their own, and behind that sits a quiet safety backstop for connection requests and messages only. These are the current numbers, which Spurly may tighten at any time:

| Backstop | Current value |
|---|---|
| Connection requests | 80 a day, 200 a week |
| Messages | 100 a day, 500 a week |

200 a week is LinkedIn's own weekly invitation limit, so Spurly never goes past it. Connection requests also count against that weekly total across Spurly and the Chrome extension together. If a backstop is reached, sending simply waits and carries on as the day or week rolls over. Other actions, such as follows and likes, are spaced out the same way but have no fixed count. Start with a small audience: the backstop is a ceiling, not a target.

## Random gaps between actions

Automated actions are spread out rather than sent in bursts. Between actions Spurly leaves a gap that varies from one send to the next instead of a fixed interval, so activity does not look like a timer. Each day's volume also differs, and Spurly works around the clock, weekends included. Overnight, by default from 11pm to 6am in your timezone, sends spread out about four times further apart rather than stopping, and you can switch that off or change the quiet hours. A person clicking a button themselves is not paced like this, since that is you, not automation.

## It stops when someone replies

If a person replies, the sequence stops for them. Spurly does not send scripted follow-ups into a live conversation.

## It never repeats a send

Spurly records a send before it moves on. If an action may already have gone through, it is never retried. Spurly skips anyone you have already invited, from Spurly or the Chrome extension, and anyone you contacted in the last 30 days across your campaigns.

## Problems pause the campaign

If LinkedIn disconnects your account, or several actions fail in a row, the campaign pauses instead of working through your audience. You can see why, fix it and restart. If LinkedIn pushes back with a rate-limit error, Spurly backs off for a while before trying again, in campaigns and sequences alike.

## Optional clean-up of old invitations

You can withdraw sent invitations that were never accepted. Automatic withdrawal rules are optional and off by default.

## What Spurly cannot do

Spurly cannot control how LinkedIn decides to treat an account. A new or rarely used account, a sudden jump in activity, or LinkedIn changing its own rules can all lead to restrictions regardless of the tool. If you are cautious, start with a small audience and build up.
