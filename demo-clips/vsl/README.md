# Spurly VSL (landing page video)

Built 2026-10-20. ~4:20, ElevenLabs voice (Killian) + code-rendered motion graphics + real app screens.

## What is here
- `comp/` — the video itself: an HTML page whose `window.render(t)` draws any instant of the video.
  - `scenes.js` (0:00–0:50) and `scenes2.js` (0:50–end): every scene, caption and sound cue, timed to the
    voiceover's word timings (`words_out.json`), so editing the timing of a scene = editing its phrase anchors.
  - `render.mjs` — Playwright renderer → ffmpeg. `--stills 12.5,30` writes check frames to `comp/stills/`.
- `mix.py` — sound design (Kenney CC0 UI sounds + synthesised whooshes/impacts/music), VO EQ/compression,
  music ducking, -14 LUFS master. Reads `comp/cues.json` (written by any render run).
- `signals.mjs`, `inbox.mjs` — Playwright storyboards for the two new app clips, with their invented data in `data.mjs` (`probe.mjs` screenshots one page against the mocks).
  They run from `demo-clips/` like the original four (`node vsl/signals.mjs`).
- `vo_final.wav` is the edited voiceover (clock lines cut, founder line cut, dead air trimmed, 1.04x).

## Re-render
```bash
# 1. app clips (from demo-clips/, with the mock-API Vite app on :3000 — see demo-clips/README.md)
node find.mjs; node follow.mjs; node invitations.mjs; node claude.mjs; node vsl/signals.mjs; node vsl/inbox.mjs
# 2. serve this folder (frames/ must point at demo-clips/frames, meta/ holds the clip metas + shots)
python3 -m http.server 8123
# 3. video + audio
node comp/render.mjs --fps 60 --q 95 --crf 14 --preset medium --out master1080.mp4      # 1080p60
node comp/render.mjs --fps 60 --scale 2 --png --out master4k.mp4                        # 4K60 (slow)
python3 mix.py
ffmpeg -i master1080.mp4 -i final.wav -map 0:v -map 1:a -c:v libx264 -crf 21 -preset slow -c:a aac -b:a 192k -movflags +faststart spurly-vsl.mp4
```
All people, companies and numbers in the app clips are invented.
