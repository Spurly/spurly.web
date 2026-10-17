# Demo clips (home page Features section)

Real spurly.web, run with Vite, every `/api` call answered by `mocks.mjs` (invented people,
companies and logos only), driven by Playwright and rendered frame by frame on a virtual clock.

## Re-render a clip

```bash
# 1. the app, pointed at the mock API (any free port 3000)
VITE_API_URL=http://localhost:5000 VITE_API_BASE=/api VITE_LOGO_DEV_TOKEN=demo npx vite --port 3000

# 2. in demo-clips/ (once): npm i playwright@1 ; tar xzf assets.tgz   # flags/ + logos/
#    Linux needs Chromium; set its path in studio.mjs (executablePath)
node find.mjs                          # → frames/find/*.jpg (2x, 60 fps) + meta.json
python3 camera.py find shots-find.json # → out/find.mp4 / .webm / -poster.webp (needs ffmpeg + Pillow)
# same for the others; the published files used CRF=28 (CRF=29 for follow):
node claude.mjs      && CRF=28 python3 camera.py claude shots-claude.json
node follow.mjs      && CRF=29 python3 camera.py follow shots-follow.json
node invitations.mjs && CRF=28 python3 camera.py invitations shots-invitations.json
# any storyboard script takes --probe: a fast dry run that writes CSS-size screenshots to shots/
```

| Clip | Storyboard (real screens only) |
|---|---|
| find | Leads → New audience → Build from filters → Review (Location, Industry, 2nd, Title) → Run import → rows land |
| claude | Dashboard "Run Spurly from Claude" → /oauth/consent (Read + Draft, Act unticked) → Approve → Settings › AI assistants (actions off, Recent activity) → Campaigns: Claude's campaign in Draft |
| follow | Draft campaign → Edit note → Write (AI) → Save → Start sending → Review before sending → paced → sequence Enrolled: "Replied — handed to you" |
| invitations | Sent: withdraw a stale request → Received: accept a founder → Rules: auto-withdraw + auto-accept by headline keywords → Save |

- `studio.mjs` — the recorder: fake clock (Playwright `page.clock`), CSS animations seeked to
  the same clock, in-page pointer, 2x screenshots.
- `mocks.mjs` — the fake backend, fake signed-in extension bridge, flag + logo images.
- `find.mjs`, `claude.mjs`, `follow.mjs`, `invitations.mjs` — the storyboards (real clicks on real pages); `fixtures.mjs` — shared invented data (analytics, campaigns).
- `shots-*.json` — camera keys (zoom/pan) by storyboard mark; `camera.py` eases between them,
  crops the 2x frames, dissolves at scene cuts, crossfades the last 0.5 s into frame 1 for a seamless loop, encodes.
- The app's 5 s import poll is shortened to 0.5 s on the demo clock; nothing else in the app is changed.
