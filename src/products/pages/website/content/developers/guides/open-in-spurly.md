---
title: Open in Spurly
seoTitle: Open in Spurly | Spurly API v2
navTitle: Open in Spurly
description: Let your customers open their organisation, or one LinkedIn account in it, in the full Spurly app with a one-time link: no password and no emailed code.
lead: Add an "Open in Spurly" button to your product. Your server asks for a one-time link and the customer lands in Spurly, signed in to their organisation.
path: /developers/guides/open-in-spurly
template: docs
section: Guides
order: 8
date: 2026-11-12
parent: /developers
---
## The flow

1. A person clicks "Open in Spurly" in your product, next to their organisation or next to one of its LinkedIn accounts.
2. Your frontend calls **your own** backend. Never call Spurly from the browser: the API key must stay on your server.
3. Your backend checks that this person may open that organisation, then calls `POST /orgs/{orgId}/login-link`. Add `accountId` to open with that LinkedIn account already chosen.
4. Spurly answers `{ url, expiresAt, orgId, accountId }`. Your frontend opens `url` straight away.
5. The person lands in the Spurly web app, signed in to the organisation for 12 hours. When that ends they click your button again.

::endpoint v2CreateLoginLink

## The link

- **One use, 2 minutes.** Create it when the person clicks, never in advance. Opened twice or too late, it shows "This link has expired" and the person clicks again.
- **The secret is after `#`.** Browsers never send that part to a server, so it stays out of server logs and `Referer` headers. Do not log, store or send the `url` yourself.
- **`actor` is strongly recommended.** Send your own id or email for the person who clicked (up to 200 characters). Spurly keeps it on an audit trail only.
- **Never cached.** The answer carries `Cache-Control: no-store`; do not cache it either.

## Which account opens

- Without `accountId` the person opens the organisation as a whole.
- With `accountId` Spurly opens the organisation with that LinkedIn account chosen under "Acting as". It must belong to this organisation and not be disconnected, else `404 NOT_FOUND`.
- If the account is disconnected in the two minutes before the link is opened, the person still lands in the organisation, just without an account chosen.

## Access control is yours

Spurly cannot know which of your users may open which organisation. Check it on your server before you create a link, the same way you decide who may see that customer's data in your product.

## Who the person becomes

The organisation's owner: the member whose email is the organisation's `externalId` (the customer's email address). If nobody has signed in yet, Spurly creates that member the first time a link is opened. Nobody has to receive an emailed code.

A link can never sign in to an email address that already has a Spurly account of its own (a personal account, or a member of another organisation). `POST /orgs/{orgId}/login-link` answers `409 EMAIL_TAKEN` and the person signs in at getspurly.com/login/org with the emailed code instead, which proves they own the mailbox.

An organisation you have suspended gets no link (`403 ORG_SUSPENDED`), and a link made before a suspension stops working.

## A server-side handler (Node.js)

```js
// POST /integrations/spurly/open/:orgId on YOUR backend.
app.post("/integrations/spurly/open/:orgId", requireLogin, async (req, res) => {
  const { orgId } = req.params;
  if (!(await canOpenOrg(req.user, orgId))) return res.status(403).json({ error: "Not allowed" });

  const r = await fetch(`https://api.getspurly.com/v2/orgs/${orgId}/login-link`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SPURLY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ actor: String(req.user.id), accountId: req.body?.accountId }),
  });
  const json = await r.json();
  if (!json.success) return res.status(r.status).json({ error: json.message, code: json.code });

  res.set("Cache-Control", "no-store"); // a one-time sign-in: never cache it
  return res.json({ url: json.data.url });
});
```

In the browser, call that endpoint on click and open the answer with `window.open(url, "_blank")`. If a browser blocks the new tab because it opened after an `await`, open a blank tab in the click handler first and set its `location` when the URL arrives.

## If the browser is already signed in

A person who is signed in to a personal Spurly account is asked before it is replaced. Someone who is already signed in to an organisation is taken straight in.
