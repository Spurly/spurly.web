# Hero product demo (62 s ad cut)

Built from the clip renders in `demo-clips/` (frames/<clip>/ at 2x + shots-*.json), so render those first.

```bash
# fonts: convert Instrument Sans 500/600/700 (node_modules/@fontsource/instrument-sans/files/*.woff2)
#        and public/fonts/plex-mono-500.woff2 to fonts/*.ttf with fontTools (see demo.py FONT/MONO)
# voice: put the ElevenLabs mp3 here as vo.mp3, then
ffmpeg -i vo.mp3 -af atempo=1.08 -ar 48000 vo_raw.wav   # then static gain to ~-17 dB RMS -> vo_108.wav
python3 demo.py --stills 1.5,20,56      # check frames
python3 demo.py                         # -> out/demo-master.mov (1920x1080, 60 fps)
python3 sfx.py && python3 music.py      # -> sfx.wav, final.wav (voice + music bed + SFX, all synthesised)
ffmpeg -i out/demo-master.mov -i final.wav -map 0:v -map 1:a -c:v libx264 -crf 23 -preset slow -tune animation \
  -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart spurly-demo.mp4
```

`timeline.json` holds every scene: duration, which clip and which part of it plays (`src`/`speed` or `segs`), captions
(`*word*` = blue), and is synced to the voiceover at 1.08x. CLIPS path at the top of demo.py points at the clip renders.
