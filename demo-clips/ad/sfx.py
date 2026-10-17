"""Synthesised sound design for the demo, timed from timeline.json. Writes sfx.wav (48 kHz stereo).
Every sound is generated here (no samples), so there is nothing to license."""
import json, math
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)
TL = json.load(open('timeline.json'))
starts, t0 = [], 0.0
for s in TL['scenes']:
    starts.append(t0); t0 += s['dur']
TOTAL = t0 + 0.5
mix = np.zeros((int(TOTAL * SR), 2))

def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)

def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(mix): return
    sig = sig[: len(mix) - i] * gain
    mix[i:i + len(sig), 0] += sig * (1 - max(0, pan))
    mix[i:i + len(sig), 1] += sig * (1 + min(0, pan))

def whoosh(dur=0.42, up=True):
    n = int(dur * SR); t = np.arange(n) / n
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    # sweep a band through the noise in chunks
    for k in range(12):
        a, b = k * n // 12, (k + 1) * n // 12
        f = 300 + 4200 * ((k / 11) if up else 1 - k / 11)
        out[a:b] = bp(noise, f * 0.6, min(f * 1.6, 20000))[a:b]
    shape = np.sin(np.pi * t) ** 1.6
    return out * shape * 0.5

def pop(f=1300):
    n = int(0.09 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f * t - 3000 * t * t)) * env(n, 0.002, 0.03) * 0.5

def click():
    n = int(0.03 * SR)
    return bp(rng.standard_normal(n), 1500, 7000) * env(n, 0.0005, 0.006) * 0.9

def impact(f=52):
    n = int(1.4 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * f * t * (1 - 0.25 * t)) * env(n, 0.002, 0.45)
    sub = np.sin(2 * np.pi * f / 2 * t) * env(n, 0.004, 0.6) * 0.6
    crack = bp(rng.standard_normal(n), 800, 6000) * env(n, 0.001, 0.05) * 0.5
    return (body + sub + crack) * 0.8

def riser(dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR; p = t / dur
    tone = np.sin(2 * np.pi * (180 * t + 900 * t * t / dur)) * 0.25
    air = bp(rng.standard_normal(n), 2000, 9000) * 0.35
    return (tone + air) * p ** 2.2

def chime():
    n = int(0.9 * SR); t = np.arange(n) / SR
    a = np.sin(2 * np.pi * 1318.5 * t) * env(n, 0.002, 0.25)
    b = np.sin(2 * np.pi * 1975.5 * t) * env(n, 0.002, 0.3)
    b[: int(0.07 * SR)] = 0
    return (a * 0.35 + b * 0.3)

def swipe():
    n = int(0.28 * SR); t = np.arange(n) / n
    return bp(rng.standard_normal(n), 2500, 9000) * np.sin(np.pi * t) * 0.45

def shimmer():
    n = int(1.6 * SR); t = np.arange(n) / SR
    out = sum(np.sin(2 * np.pi * f * t) * env(n, 0.01, 0.5 + k * 0.1) for k, f in enumerate([1046.5, 1318.5, 1568, 2093]))
    return out * 0.12

scenes = TL['scenes']
# hook
hook = scenes[0]
b = hook['beats']
place(impact(), b[0]['at'], 0.9)
place(pop(1100), b[1]['at'], 0.35)
for bb in b:
    for j in range(len(bb['text'].split(' '))):
        place(click(), bb['at'] + 0.02 + j * bb.get('stagger', 0.07), 0.5, pan=rng.uniform(-0.25, 0.25))
place(swipe(), b[1]['at'] + b[1]['strike'], 0.6, pan=0.3)
place(whoosh(0.35), b[2]['at'] - 0.05, 0.35)
# scene changes and captions
for k, s in enumerate(scenes):
    st = starts[k]
    if k > 0 and s['kind'] == 'window':
        place(whoosh(0.4, up=(k % 2 == 0)), st - 0.12, 0.55, pan=(-0.25 if k % 2 else 0.25))
    for c in s.get('captions', []):
        if c.get('typing'):
            n = int((c.get('until', s['dur']) - c['at']) * 0.62 / 0.075)
            for j in range(n):
                place(click(), st + c['at'] + 0.15 + j * 0.075 + rng.uniform(-0.012, 0.012), 0.35, pan=rng.uniform(-0.2, 0.2))
        else:
            # a soft key tick for every word as it lands, plus a pop on the first one
            words = c['text'].split(' ')
            place(pop(1250 + 120 * (k % 3)), st + c['at'] + 0.02, 0.3)
            for j in range(len(words)):
                place(click(), st + c['at'] + 0.03 + j * 0.07, 0.45, pan=rng.uniform(-0.25, 0.25))
        txt = c['text'].lower()
        if any(w in txt for w in ('accepted', 'withdrawn', 'pour', 'approve', 'stops')):
            place(chime(), st + c['at'] + 0.12, 0.45)
# last trick: riser into the card, hit on the Claude reveal
card_i = next(i for i, s in enumerate(scenes) if s['kind'] == 'card')
place(riser(1.5), starts[card_i] - 1.2, 0.6)
place(impact(60), starts[card_i], 0.55)
place(impact(48), starts[card_i + 1], 0.75)
place(whoosh(0.5), starts[card_i + 1] - 0.15, 0.5)
# CTA
cta_i = len(scenes) - 1
place(impact(44), starts[cta_i], 0.9)
place(shimmer(), starts[cta_i] + 0.05, 0.9)
place(pop(1500), starts[cta_i] + 1.0, 0.35)

peak = np.max(np.abs(mix)) or 1
mix = mix / peak * 0.89
wavfile.write('sfx.wav', SR, (mix * 32767).astype(np.int16))
print('sfx.wav', round(TOTAL, 2), 's')
