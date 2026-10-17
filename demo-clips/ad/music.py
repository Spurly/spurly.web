"""Synthesised ad-style music bed + final mix (VO + music + SFX) -> final.wav.
Nothing sampled, so nothing to license."""
import json
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(3)
TL = json.load(open('timeline.json'))
starts, t0 = [], 0.0
for s in TL['scenes']:
    starts.append(t0); t0 += s['dur']
TOTAL = t0 + 0.6
N = int(TOTAL * SR)
BPM = 116
BEAT = 60 / BPM
card_i = next(i for i, s in enumerate(TL['scenes']) if s['kind'] == 'card')
CARD, CLAUDE, CTA = starts[card_i], starts[card_i + 1], starts[-1]
DROP1 = TL['scenes'][0]['beats'][1]['at']          # groove starts on the second hook line
BREAK = CARD - 1.25                                  # filter-down before "the last trick"

def filt(x, kind, f): return sosfilt(butter(2, f, kind, fs=SR, output='sos'), x)
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

L = np.zeros(N); Rr = np.zeros(N)
def add(sig, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0: return
    sig = sig[: N - i] * g
    L[i:i + len(sig)] += sig * (1 - max(0, pan)); Rr[i:i + len(sig)] += sig * (1 + min(0, pan))

def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 48 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12)
def clap():
    n = int(0.25 * SR)
    return filt(rng.standard_normal(n), 'bandpass', [900, 4000]) * env(n, 0.001, 0.06) * 0.6
def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    return filt(rng.standard_normal(n), 'highpass', 7000) * env(n, 0.0005, 0.06 if open_ else 0.012) * 0.35
def bass(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * h * t) / h for h in range(1, 7))
    return filt(x, 'lowpass', 900) * env(n, 0.004, dur * 0.7) * 0.35
def pad(freqs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.25 * t)) for f in freqs)
    shape = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)
    return x * shape * 0.06

PROG = [(110.0, [220, 261.6, 329.6]), (87.31, [174.6, 220, 261.6]), (130.81, [261.6, 329.6, 392]), (98.0, [196, 246.9, 293.7])]

def groove(a, b, full=True):
    t = a; k = 0
    while t < b:
        bar = int(k // 4) % 4
        root, chord = PROG[bar]
        add(kick(), t, 0.9)
        if k % 4 in (1, 3) and full: add(clap(), t, 0.8, pan=0.1)
        add(hat(), t + BEAT / 2, 0.8, pan=-0.3)
        if full and k % 2 == 1: add(hat(), t + BEAT * 0.75, 0.4, pan=0.3)
        add(bass(root, BEAT * 0.45), t, 1.0)
        add(bass(root, BEAT * 0.4), t + BEAT / 2, 0.8)
        if k % 4 == 0: add(pad(chord, BEAT * 4), t, 1.0)
        t += BEAT; k += 1

# intro tension: low pad under "Okay, stop."
add(pad([110, 164.8], DROP1), 0, 1.2)
groove(DROP1, BREAK)
# break: pad only, then silence for the whisper (the SFX riser carries it)
add(pad([110, 164.8, 220], CARD - BREAK + 0.3), BREAK, 1.3)
groove(CLAUDE, CTA)
# outro: one big chord ringing out under the CTA
add(pad([110, 220, 261.6, 329.6, 440], TOTAL - CTA), CTA, 2.2)
add(bass(55, 2.0), CTA, 1.4)

music = np.stack([L, Rr], 1)
music /= np.max(np.abs(music)) + 1e-9

def load(p):
    sr, x = wavfile.read(p)
    x = x.astype(np.float32) / 32768.0
    if x.ndim == 1: x = np.stack([x, x], 1)
    assert sr == SR, (p, sr)
    out = np.zeros((N, 2)); out[: min(N, len(x))] = x[:N]
    return out

vo = load('vo_108.wav')
sfx = load('sfx.wav')
# sidechain: duck the music while the voice talks
lvl = np.sqrt(np.convolve((vo[:, 0] ** 2), np.ones(2400) / 2400, mode='same'))
duck = 1 - 0.55 * np.clip(lvl / 0.05, 0, 1)
duck = np.convolve(duck, np.ones(4800) / 4800, mode='same')
mixed = vo * 1.0 + music * 0.42 * duck[:, None] + sfx * 0.85
mixed /= max(1.0, np.max(np.abs(mixed)) / 0.97)
wavfile.write('final.wav', SR, (mixed * 32767).astype(np.int16))
print('final.wav', round(TOTAL, 2), 's')
