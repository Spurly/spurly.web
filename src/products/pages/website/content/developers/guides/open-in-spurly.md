---
title: Open in Spurly
description: Let your users open their LinkedIn account in the full Spurly app with a one-time sign-in link, without a password, and close or reopen accounts when they leave.
lead: Add an "Open in Spurly" button to your product. Your server asks for a one-time link, and the person lands in Spurly on that account, already connected to LinkedIn.
path: /developers/guides/open-in-spurly
template: docs
section: Guides
order: 2
date: 2026-10-28
parent: /developers
---
## The flow

1. A person clicks "Open in Spurly" next to one of their connected LinkedIn accounts in your product.
2. Your frontend calls **your own** backend. Never call Spurly from the browser: the API key must stay on your server.
3. Your backend checks that this person may use that account, then calls `POST /accounts/:accountId/login-link`.
4. Spurly answers `{ url, expiresAt }`. Your frontend opens `url` straight away.
5. The person is signed in to that account in the Spurly web app for 12 hours. When that ends, they click your button again.

There is no password and no Spurly login form for these accounts. Your button is the only way in.

::endpoint createLoginLink

## The link

- **One use, 2 minutes.** Create it when the person clicks, never in advance. Opened twice or too late, it shows "This link has expired" and the person clicks again.
- **The secret is after `#`.** Browsers never send that part to a server, so it stays out of server logs and `Referer` headers. Do not log, store or send the `url` yourself.
- **`actor` is strongly recommended.** Send your own id or email for the person who clicked (up to 200 characters). Spurly keeps it on the account's audit trail only, so either side can trace who opened an account.

## Access control is yours

Spurly cannot know which of your users may open which account. Check it on your server before you create a link, the same way you decide who may see that account's inbox in your product.

## A server-side handler (Node.js)

```js
// POST /integrations/spurly/open/:accountId on YOUR backend.
app.post("/integrations/spurly/open/:accountId", requireLogin, async (req, res) => {
  const { accountId } = req.params;
  if (!(await canUseAccount(req.user, accountId))) return res.status(403).json({ error: "Not allowed" });

  const r = await fetch(`https://api.getspurly.com/v1/accounts/${accountId}/login-link`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SPURLY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ actor: String(req.user.id) }),
  });
  const json = await r.json();
  if (!json.success) return res.status(r.status).json({ error: json.message, code: json.code });

  res.set("Cache-Control", "no-store"); // a one-time sign-in: never cache it
  return res.json({ url: json.data.url });
});
```

In the browser, call that endpoint on click and open the answer with `window.open(url, "_blank")`. If a browser blocks the new tab because it opened after an `await`, open a blank tab in the click handler first and set its `location` when the URL arrives.

## What the person gets

The full Spurly web app on that account, with Spurly's normal pacing and safety limits, and 100 starter credits.

Some things stay with your product: connecting and disconnecting LinkedIn (read-only inside Spurly), and closing the account. These accounts cannot sign in with Google or a password, create API tokens, connect AI assistants or use the Chrome extension.

## Closing and reopening

- **Close** with `DELETE /accounts/:accountId` when your user removes that LinkedIn account. Access ends at once, campaigns pause, LinkedIn disconnects, and nothing is deleted. Safe to repeat. A `502 DISCONNECT_FAILED` means the account is closed but LinkedIn is still connected: send the same `DELETE` again.
- **Reopen** by creating the same `externalId` again with `POST /accounts`. The answer carries `reopened: true`, the history is intact, and you connect LinkedIn again.
- A closed account answers `409 ACCOUNT_CLOSED` to `login-link` and most other calls.

## Errors

| Status | `code` | What to do |
|---|---|---|
| 404 | `ACCOUNT_NOT_FOUND` | Check the `accountId`: it is not one of yours |
| 409 | `ACCOUNT_CLOSED` | Reopen the account first |
| 400 | `INVALID_ACTOR` | Send `actor` as a string of up to 200 characters, or leave it out |
| 401 | `UNAUTHORIZED` | Check the API key |
| 429 | `RATE_LIMITED` | Wait for `Retry-After` |

Show the error and let the person click again. Do not retry in a loop.
