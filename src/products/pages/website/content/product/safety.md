---
title: How Spurly keeps your LinkedIn account safe
seoTitle: Is LinkedIn Automation Safe? How Spurly Paces It
shortTitle: Safety
description: How Spurly paces LinkedIn automation: per-action limits, random gaps, reply-pause and an honest account of the risk that no tool can remove.
path: /product/safety
template: product
date: 2026-10-03
priority: 0.8
target_query: is linkedin automation safe
related: [/product/campaigns, /product/inbox]
faq:
  - q: Is LinkedIn automation safe?
    a: No tool can promise that. LinkedIn's User Agreement restricts automation, and LinkedIn can restrict an account at its discretion. Spurly is designed to stay within the limits LinkedIn applies to normal use, and it paces every action to look like a person, but the risk is never zero.
  - q: Will Spurly get my account banned?
    a: Spurly cannot promise that it will not. It limits every automated action, spaces sends out with random gaps and stops when someone replies, which lowers the risk without removing it.
  - q: Can I change the limits?
    a: The limits are set by Spurly and are deliberately conservative. They are adjusted as LinkedIn's behaviour changes.
  - q: What if LinkedIn disconnects my account?
    a: Campaigns pause instead of continuing with a broken connection, and you reconnect your account to carry on.
todo:
  - Confirm the published default limits against actionTypes.js (caps were approved 2026-09-30 and are meant to be tuned after two weeks of live data); update the table whenever they change
  - Check the live limits: the app screenshots show 40/hour and an 80-a-day cap for connection requests, but the published defaults are 8/hour and 40/day (campaign pacing defaults, env-overridable). Make prod env match the table or update the table
---
Spurly is designed to stay within LinkedIn's limits, and it paces every automated action like a person would. But LinkedIn's User Agreement restricts automation, and no tool can promise an account will never be restricted. This page explains what Spurly does to lower the risk and what it cannot remove.


![A Spurly campaign showing the sending window, hourly limit and the weekly invitation allowance. Names are blurred.](/assets/app-campaign-detail.webp)

## The honest risk statement

LinkedIn does not allow automation of the kind Spurly performs, and it can restrict or close an account at its own discretion. Spurly does not claim to be undetectable or 100% safe, and you should not trust any tool that does. What Spurly can do is keep your activity modest, regular and human-shaped. That is what the rest of this page describes.

## Every action has a limit

Spurly records every automated action against a limit for that kind of action. There are hourly and daily limits per type, counted over a rolling window rather than a calendar day, plus a minimum gap between two actions of the same type. These are the current default limits, which Spurly may tighten at any time:

| Action | Daily limit | Hourly limit | Minimum gap |
|---|---|---|---|
| Connection requests | 40 | 8 | 2 minutes |
| Messages | 80 | 15 | 1 minute |
| Profile visits | 80 | 20 | 30 seconds |
| Follows | 25 | 6 | 2 minutes |
| Post likes | 40 | 10 | 1 minute |
| Post comments | 10 | 3 | 10 minutes |
| Skill endorsements | 20 | 5 | 2 minutes |

On top of those, there is a ceiling across all of these actions combined in any 24 hours. If Spurly has done a lot on your account, it pauses automated actions to keep the account safe. Connection requests also count against LinkedIn's weekly invitation allowance, which Spurly tracks across Spurly and the Chrome extension together.

## Random gaps between actions

Automated actions are spread out rather than sent in bursts. Between actions Spurly leaves a gap that varies from one send to the next instead of a fixed interval, so activity does not look like a timer. A person clicking a button themselves is not paced like this, since that is you, not automation.

## It stops when someone replies

If a person replies, the sequence stops for them. Spurly does not send scripted follow-ups into a live conversation.

## It never repeats a send

Spurly records a send before it moves on. If an action may already have gone through, it is never retried, and Spurly skips anyone you have already invited, from Spurly or the Chrome extension.

## Problems pause the campaign

If LinkedIn disconnects your account, or several actions fail in a row, the campaign pauses instead of working through your audience. You can see why, fix it and restart.

## Optional clean-up of old invitations

You can withdraw sent invitations that were never accepted. Automatic withdrawal rules are optional and off by default.

## What Spurly cannot do

Spurly cannot control how LinkedIn decides to treat an account. A new or rarely used account, a sudden jump in activity, or LinkedIn changing its own rules can all lead to restrictions regardless of the tool. If you are cautious, start with a small audience and build up.
