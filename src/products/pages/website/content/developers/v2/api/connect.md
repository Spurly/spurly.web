---
title: Connect LinkedIn
seoTitle: Connect LinkedIn Endpoints | Spurly API v2
description: Spurly organisation API reference for connecting LinkedIn: sign in, submit codes, verify another way, resend and poll in-app approvals.
lead: Sign a LinkedIn account in under an organisation and finish verification.
path: /developers/v2/api/connect
template: docs
section: v2: API reference
order: 2
date: 2026-11-04
parent: /developers/v2
---
Sign a LinkedIn account in under an organisation and finish verification. Every call needs `Authorization: Bearer <key>`; see [Quickstart](/developers/v2/quickstart). Base URL `https://api.getspurly.com/v2`.

::endpoints v2-connect-linkedin

Before showing your connect screen you can call `GET /connect-options` with the customer's IP as `endUserIp` to pre-select the country. Pass the same IP as `endUserIp` on the connect call.
