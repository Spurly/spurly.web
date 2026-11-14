---
title: Usage and billing
seoTitle: Usage and billing | Spurly API v2
description: Read what you are billed on in the Spurly organisation API: distinct LinkedIn members connected now, over a window and at peak, per organisation.
lead: Billing counts distinct LinkedIn members. Here is how to read the numbers.
path: /developers/v2/guides/usage
template: docs
section: Guides
order: 2
date: 2026-11-04
parent: /developers/v2
---
`GET /usage` returns counts only: no amounts, no invoices.

```bash
curl "https://api.getspurly.com/v2/usage?days=30" \
  -H "Authorization: Bearer $SPURLY_API_KEY"
```

```json
{
  "success": true,
  "data": {
    "window": { "from": "2026-10-05T00:00:00.000Z", "to": "2026-11-04T00:00:00.000Z" },
    "total": { "connected": 3, "distinct": 4, "peak": { "count": 3, "at": "2026-10-20T10:00:00.000Z" } },
    "orgs": [
      { "id": "6720a1b2c3d4e5f607182930", "externalId": "jane@acme.com", "name": "Acme Inc.", "connected": 1, "distinct": 2, "peak": { "count": 1, "at": "2026-10-21T10:00:00.000Z" }, "refusedConnects": 0 }
    ]
  }
}
```

| Field | Meaning |
|---|---|
| `connected` | Distinct members connected at the end of the window |
| `distinct` | Distinct members connected at any time in the window |
| `peak` | The most members connected at the same moment, and when |
| `refusedConnects` | Connects refused because the member was live in another organisation. Refused connects are never billed. |

## The rules

- A member counts **once**, however many times they disconnect and reconnect.
- A member who moves from one organisation to another counts once in the total. Per organisation, each organisation counts them for the time they were there.
- `CREDENTIALS` (needs a new sign-in) keeps the seat: the account still exists.
- `from`, `to` and `days` pick the window (up to 366 days; default 30). Pass `orgId` to see one organisation.
