---
title: Authentication
description: How to authenticate to the Spurly LinkedIn API with your partner API key, and how to keep the key safe.
path: /developers/authentication
template: docs
section: Get started
order: 3
date: 2026-10-24
parent: /developers
---
Every request carries your API key as a bearer token:

```bash
curl "https://api.getspurly.com/v1/accounts" \
  -H "Authorization: Bearer spk_partner_..."
```

## Your API key

- Keys start with `spk_partner_` and belong to your company, not to a user. One key reaches every account you create.
- Keep keys on your servers. Never put one in a browser, a mobile app or a public repository. Anyone holding it can read and send your users' LinkedIn messages.
- Spurly stores only a hash of each key, so a lost key cannot be shown again. Ask us for a new one.
- You can hold more than one active key, so a key can be rotated without downtime: start using the new key, then ask us to revoke the old one.

## Failed authentication

| Status | Code | Meaning |
|---|---|---|
| 401 | `UNAUTHORIZED` | The key is missing, mistyped, revoked, or your access is suspended |
| 503 | `UNAVAILABLE` | We could not check the key just now. Retry; your key is fine |

## Webhook secret

Webhook deliveries are signed with a separate **webhook secret** (`whsec_...`), so you can prove a delivery came from Spurly. See [Webhooks](/developers/guides/webhooks). Rotate it at any time with `POST /webhook/rotate-secret`.

## Accounts are isolated

Each account belongs to the key's company. Asking for an account, conversation or message that is not yours answers `404`, never `403`, so ids cannot be probed.
