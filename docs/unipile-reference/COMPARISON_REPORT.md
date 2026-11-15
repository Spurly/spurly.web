# Unipile docs vs Spurly developer docs — comparison (2026-11-15)

Source of truth: https://developer.unipile.com/docs (v1 docs, 45 pages, saved in `pages/` and merged in `ALL_UNIPILE_DOCS.md`).
Spurly side: `src/products/pages/website/content/developers/**` (page: /developers/guides/linkedin-limits).

NOTE: the Unipile docs you were viewing are **v1**. Spurly's API is a `/v2` API, and Unipile also publishes a v2 doc set (see changelog entries v2.2026xxxx in llms.txt). Anything that differs only because v1 != v2 should be checked against the v2 pages before copying.

## 1. Structure

| | Unipile | Spurly |
|---|---|---|
| Limits page | ONE page "Provider Limits and Restrictions" covering LinkedIn, LinkedIn Recruiter, WhatsApp, Instagram, Facebook, Gmail, Outlook, IMAP | LinkedIn only (OK: Spurly is LinkedIn-only) |
| Order of LinkedIn content | disclaimer → human behaviour → new accounts → per-account scope → Connection requests → Profile retrieval → Search → Relations/Invitations list → Chats → InMail → Other routes → Recruiter | Rules → pacing table → Connection requests → Search → Profile reads → New connections → InMail → Messages → What Spurly does → Errors table |
| Spurly-only additions | – | per-action hour/day/week table, "What Spurly does for you", "Handling the errors" table |
| Missing on Spurly | LinkedIn Recruiter section (session limits, `disable_feature`, cookie login, Chrome extension) | – |

Other Unipile sections with no Spurly equivalent (mostly N/A, Spurly is LinkedIn-only and wraps Unipile): WhatsApp/Telegram/Instagram/X/Messenger/IMAP guides, Email & Calendar pages, n8n/MCP/Node SDK dev tools, "List of provider features". LinkedIn-specific Unipile pages worth mirroring or linking: *How to create an Outreach Sequence*, *Detecting Accepted Invitations*, *Get Raw Data Route Example*, *Perform API LinkedIn search and export result*, *Posts and Comments*, *Users overview / Retrieving users / Invite users*, *Message object*, *Send/Retrieving messages*, *Account status updates* (account-lifecycle). Spurly maps these to guides/messaging, guides/linkedin-features, objects, webhooks, errors.

## 2. Content differences on the limits page (Unipile says -> Spurly says)

1. **Free-account invitations.** Unipile: ~5/month with a 200-char note, **150/week** without a note. Spurly: "a few hundred a week without one". WRONG -> change to 150/week.
2. **Invitation-limit error.** Unipile: LinkedIn returns `422 / cannot_resend_yet`; same limit as the LinkedIn UI, and the UI only shows the error at the last step. Spurly: generic "you get an error" and a `429` rule. Not in the errors table. Check what the Spurly API really returns for this case (grep found no `cannot_resend` in spurly.backend/web src) and document the real code.
3. **Overuse consequence.** Unipile: exceeding limits gives HTTP 429 or 500 and risks automation warnings on the account. Spurly says "Going too fast does not break the API" — softer; align wording.
4. **Profile reads.** Unipile: ~100/day; accounts with Sales Navigator/Recruiter can do additional requests via the `api` parameter; Recruiter Lite official limit 2,000. Spurly omits the SN/Recruiter extra capacity.
5. **Search.** Unipile: 1,000 results per search on standard LinkedIn, **2,500 on Sales Navigator/Recruiter** (SN Company search still 1,000); recommended daily total 1,000 standard / **2,500 SN/Recruiter**, counted in result lines, not requests. Spurly states only 1,000 and 1,000/day.
6. **Accepted invitations.** Unipile: don't poll hourly or at fixed times; use the `new_relation` webhook; initial sync then first page only a few times a day at random multi-hour gaps. Spurly: same polling advice but no webhook mention (Spurly webhooks.md has no relation/invitation event) and adds "newest first" claim Unipile does not make — verify.
7. **InMail.** Unipile: Career plans start at 5/month, recruiter contracts can have thousands (shared); balance route; free InMail to open profiles capped by LinkedIn at up to **800/month/account**; may still need a credit; recommends **30–50 sends/day max**. Spurly: table says **10/day**, "a few a day", no 800 figure, "small monthly number". Decide whether Spurly's 10/day (own pacing) stays, but then state it as Spurly's number, not Unipile's.
8. **Other routes.** Unipile: default max 100/day per action per account. Spurly matches ("about 100 a day").
9. **Recruiter.** Unipile has a dedicated section; Spurly's limits page has none (partly covered in guides/connection-methods "Smooth reconnects with a browser extension" — confirm it mentions disable_feature and concurrent-session popup).
10. **Spurly-only numbers** (10/hr, 80/day, 200/wk invites; 20/100/500 messages; follows 30/day; comments 15/day; posts 2/day; etc.) have no Unipile source except invites (80–100/day, ~200/wk) and the 100/day default. They are labelled as Spurly's own pacing, which is honest, but they must not be presented as Unipile's.
11. Unipile opening notes missing from Spurly's lead: "conservative recommendations, you may raise at your own risk" (Spurly has it), "limits per account, independent of route, do not accumulate" (Spurly has it), accounts with <~150 connections get delivery issues with invites (Spurly has it).

## 3. Suggested edits (smallest set that makes Spurly agree with Unipile)
- Fix free-account weekly number (150). 
- Add 2,500 SN/Recruiter search tier + daily 2,500 and the SN company-search exception.
- Add SN/Recruiter extra profile-read note.
- Document the real "invitation limit reached" error code.
- InMail: add 800/month open-profile cap and Unipile's 30–50/day guidance; reconcile with the table's 10/day.
- Add a short LinkedIn Recruiter section (sessions, disable_feature, cookie + extension).
- Align the "going too fast" wording (429/500 + account warnings).
