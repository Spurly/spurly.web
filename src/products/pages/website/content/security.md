---
title: Security and data handling at Spurly
seoTitle: Spurly Security: How We Handle Your LinkedIn Data
shortTitle: Security
description: What Spurly stores, how your LinkedIn account is connected, where AI is used and what you control. Plain answers, no certifications we do not hold.
path: /security
template: page
date: 2026-10-03
priority: 0.7
target_query: is spurly safe
related: [/product/safety, /about]
faq:
  - q: Does Spurly sell my data?
    a: No. We do not sell or rent your data and we do not use it for advertising.
  - q: How does Spurly connect to my LinkedIn account?
    a: Through a secure hosted login that Spurly provides. You connect once and can disconnect at any time.
  - q: Does Spurly use AI on my data?
    a: Yes, for drafting. When you ask for a draft, your brief and the details needed for the draft are sent to an AI model provider. AI drafts are never sent or posted without your approval.
  - q: Can I delete my data?
    a: Yes. Email founders@getspurly.com to delete your account and the data tied to it.
  - q: Is Spurly SOC 2 certified?
    a: No. Spurly does not hold SOC 2 or ISO 27001 certification, and this page only describes what we actually do.
todo:
  - Confirm and add the data retention period after an account is deleted
  - Confirm whether data at rest is encrypted at the database and storage layer, then add it
  - Confirm the hosting region (backend is moving from us-east-1 to Mumbai) and add it once decided
  - List the exact third-party processors (hosting, database, email, payments, analytics, AI providers) with Sarthak
  - Confirm payments wording once Razorpay is live (we should not store full card details)
---
This page describes what Spurly stores, how it connects to LinkedIn, where AI is used and what you control. It only says what we do today. For how Spurly keeps your LinkedIn account out of trouble, see [how Spurly keeps your account safe](/product/safety).

## How Spurly connects to LinkedIn

You connect your LinkedIn account once through a secure hosted login that Spurly provides. Spurly then runs your campaigns, reads your conversations and finds people through that connection. You can disconnect LinkedIn from Spurly at any time, and Spurly pauses campaigns if LinkedIn disconnects the account.

## What Spurly stores

- **Your account:** your name, your email address and a bcrypt hash of your password, never the password itself.
- **Your work in Spurly:** the leads, audiences, campaigns, sequences, templates, notes and conversations you build or sync.
- **Activity records:** a log of sends and outreach events, which is how Spurly paces sends and never repeats one.
- **Billing records:** your plan and payment history. Payments are handled by our payment provider.
- **Product analytics:** which pages and features are used, to improve the product.

## What Spurly does not do

- It does not sell or rent your data.
- It does not use your data for advertising.
- It does not send or post anything written by AI without your approval.

## Where AI is used

Spurly uses AI to draft connection notes, messages and comments on posts. When you ask for a draft, the brief you wrote and the details needed to write it are sent to an AI model provider, and the draft comes back for you to read and edit. AI drafts are reviewed by you before a campaign launches or a comment is posted.

## Data in transit

Spurly's website and API are served over HTTPS, so data moving between your browser and Spurly is encrypted in transit.

## What you control

You choose which LinkedIn account is connected and can disconnect it. You can remove leads, campaigns and templates inside Spurly. To delete your account and the data tied to it, email [founders@getspurly.com](mailto:founders@getspurly.com).

## Reporting a security problem

If you think you have found a security issue, email [founders@getspurly.com](mailto:founders@getspurly.com) with the details. A person reads it. See also the [privacy policy](/privacy).

## What we do not claim

Spurly does not hold SOC 2 or ISO 27001 certification, and we do not claim our service is free of risk. LinkedIn restricts automation and no tool can promise an account will never be restricted.
