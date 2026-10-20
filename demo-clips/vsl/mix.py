"""Sound design + music + VO mix for the Spurly VSL.
Reads comp/cues.json (sound cues + music moods written by the compositor) and vo_final.wav.
Writes final.wav (48 kHz stereo, -14 LUFS).  python3 mix.py [--to SECONDS]
UI samples: Kenney (CC0). Everything else is synthesised here."""
import json, math, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve
import pyloudnorm as pyln

SR = 48000
rng = np.random.default_rng(11)
C = json.load(open('comp/cues.json'))
sr, vo = wavfile.read('vo_final.wav'); vo = vo.astype(np.float32) / 32768
TOTAL = max(C['total'], len(vo) / SR) + 2.5
if '--to' in sys.argv: TOTAL = float(sys.argv[sys.argv.index('--to') + 1]) + 1.0
N = int(TOTAL * SR)
LIB = '/home/claude/sfxlib/wav/'

def T(n): return np.arange(n) / SR
def env(n, a=0.005, d=0.2): t = T(n); return np.minimum(1, t / max(a, 1e-5)) * np.exp(-t / d)
def flt(x, kind, f, order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)
def bp(x, lo, hi): return flt(x, 'bandpass', [lo, min(hi, SR / 2 - 100)])
def lp(x, f): return flt(x, 'lowpass', f)
def hp(x, f): return flt(x, 'highpass', f)
def load(name):
    r, x = wavfile.read(LIB + name + '.wav'); x = x.astype(np.float32)
    return x / (np.abs(x).max() + 1e-9)
_IR = None
def reverb(x, size=1.6, mix=0.25, bright=6000):
    global _IR
    n = int(size * SR)
    ir = rng.standard_normal(n) * np.exp(-T(n) * 6.5 / size)
    ir = lp(ir, bright); ir /= np.abs(ir).sum() ** 0.5 * 4
    wet = fftconvolve(x, ir)[: len(x) + n]
    out = np.zeros(len(x) + n); out[: len(x)] += x * (1 - mix); out[: len(wet)] += wet * mix * 3
    return out

# ───────────── sound effects ─────────────
def whoosh(dur=0.45, up=True, lo=250, hi=5200):
    n = int(dur * SR); u = np.linspace(0, 1, n); noise = rng.standard_normal(n); out = np.zeros(n)
    K = 24
    for k in range(K):
        a, b = k * n // K, (k + 1) * n // K
        f = lo + (hi - lo) * ((k / (K - 1)) if up else 1 - k / (K - 1)) ** 1.3
        seg = bp(noise[max(0, a - 2000):b], f * 0.55, f * 1.7)[-(b - a):]
        out[a:b] = seg
    shape = np.sin(np.pi * u ** 0.8) ** 2
    st = out * shape
    return np.stack([st * (0.7 + 0.3 * u), st * (1 - 0.3 * u)], 1) * 0.9   # pans across

def sub_hit(f=48, dur=1.3, click=0.5):
    n = int(dur * SR); t = T(n)
    ph = 2 * np.pi * np.cumsum(f * (1 + 2.2 * np.exp(-t * 28))) / SR
    body = np.sin(ph) * env(n, 0.001, 0.32)
    crack = bp(rng.standard_normal(n), 900, 7000) * env(n, 0.0005, 0.025) * click
    return body + crack

def slam():
    x = sub_hit(52, 0.9, 0.9) * 0.9
    p = load('impact-sounds_impactPunch_heavy_000'); x[: len(p)] += p * 0.55
    return x

def impact_soft():
    x = sub_hit(44, 1.6, 0.25) * 0.7
    return reverb(x, 1.8, 0.3)

def boom_soft(): return reverb(sub_hit(38, 2.0, 0.1) * 0.75, 2.4, 0.35)

def logo_hit():
    x = sub_hit(46, 1.8, 0.6) * 0.8
    n = int(2.5 * SR); t = T(n)
    bell = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((880, .3), (1318.5, .22), (1760, .15), (2637, .08))) * env(n, 0.002, 0.7)
    y = np.zeros(n); y[: len(x)] += x; y += bell * 0.45
    return reverb(y, 2.6, 0.35)

def chime(freqs=(1567.98, 2093.0), gap=0.11, d=0.55, a=0.32):
    n = int((gap * len(freqs) + d * 2) * SR); out = np.zeros(n)
    for k, f in enumerate(freqs):
        m = n - int(k * gap * SR); t = T(m)
        tone = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3.01 * f * t)) * env(m, 0.002, d)
        out[int(k * gap * SR):] += tone * a
    return reverb(out, 1.0, 0.2, 9000)

def notif():  # soft glass two-tone, our own
    return chime((1318.5, 1975.5), 0.085, 0.45, 0.3)

def shimmer(dur=1.4):
    n = int(dur * SR); out = np.zeros(n)
    for k in range(26):
        f = rng.uniform(2500, 7500); s = int(rng.uniform(0, dur * 0.75) * SR); m = n - s; t = T(m)
        out[s:] += np.sin(2 * np.pi * f * t) * env(m, 0.003, 0.18) * rng.uniform(0.03, 0.08)
    return reverb(out, 1.6, 0.4, 10000)

def riser(dur=1.4, f0=140, f1=1100):
    n = int(dur * SR); t = T(n); u = t / dur
    f = f0 * (f1 / f0) ** (u ** 1.6)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.18 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.08
    noise = hp(rng.standard_normal(n), 1500) * 0.12
    return (tone + noise * u) * u ** 2.2

def tick(freq=3200, d=0.012):
    n = int(0.06 * SR)
    return bp(rng.standard_normal(n), freq * 0.7, freq * 1.4) * env(n, 0.0004, d) * 0.9

def counter(dur=1.3):
    n = int(dur * SR); out = np.zeros(n); t = 0.0
    while t < dur - 0.03:
        k = tick(4200, 0.006) * 0.5; i = int(t * SR); out[i:i + len(k)] += k[: n - i]; t += 0.035 + 0.05 * (t / dur) ** 2
    return out

def cash():
    x = chime((2637, 3136, 3951), 0.06, 0.35, 0.26)
    c = load('interface-sounds_drop_002'); x[: len(c)] += c * 0.3
    return x

def stamp():
    x = sub_hit(70, 0.6, 1.0) * 0.6
    p = load('impact-sounds_impactPlate_heavy_001'); x[: len(p)] += p * 0.4
    return x

def typing(dur=0.55):
    n = int(dur * SR); out = np.zeros(n); t = 0
    while t < dur - 0.05:
        k = load('ui-audio_click%d' % rng.integers(1, 6)) * 0.35; i = int(t * SR); m = min(len(k), n - i); out[i:i + m] += k[:m]; t += rng.uniform(0.05, 0.09)
    return out

def paper():
    n = int(0.5 * SR); u = np.linspace(0, 1, n)
    x = bp(rng.standard_normal(n), 1200, 6000) * (np.abs(np.sin(u * 40)) ** 3) * np.sin(np.pi * u) * 0.4
    return x

def lock_rattle():
    n = int(0.55 * SR); out = np.zeros(n)
    for k in range(7):
        s = load('impact-sounds_impactMetal_light_00%d' % (k % 5)) * (0.45 - k * 0.04); i = int(k * 0.06 * SR); m = min(len(s), n - i); out[i:i + m] += s[:m]
    return out

def glitch():
    g = load('interface-sounds_glitch_002') * 0.7
    return np.concatenate([g, np.zeros(2000)])

def scratch():
    n = int(0.42 * SR); t = T(n); u = t / 0.42
    f = 900 * (1 - u) + 120
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.12 + bp(rng.standard_normal(n), 500, 3000) * 0.25
    return lp(x, 3500) * np.sin(np.pi * u ** 0.5) * 0.9

def dawn_swell(dur=4.0):
    n = int(dur * SR); t = T(n); u = t / dur
    x = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * a for f, a in ((261.6, .2), (329.6, .16), (392, .14), (493.9, .1), (587.3, .07)))
    return lp(x, 2500) * np.sin(np.pi * u) ** 1.5 * 0.4

def ui(name, g=1.0): return lambda: load(name) * g

SFX = {
    'whoosh': lambda: whoosh(0.42), 'whoosh_zoom': lambda: whoosh(0.5, True, 180, 6500), 'swipe': lambda: whoosh(0.3, True, 900, 6000) * 0.6,
    'send_swoosh': lambda: whoosh(0.35, True, 600, 7000) * 0.7, 'loop_whoosh': lambda: whoosh(0.5, False, 300, 3000) * 0.6,
    'impact_soft': impact_soft, 'boom_soft': boom_soft, 'slam': lambda: slam() * 0.55, 'logo_hit': logo_hit, 'stamp': stamp,
    'notif': notif, 'shimmer': shimmer, 'dawn_swell': dawn_swell, 'riser_short': lambda: riser(1.0), 'riser': lambda: riser(2.2, 110, 1400),
    'pop': ui('interface-sounds_pluck_001', 0.7), 'pop_low': ui('interface-sounds_drop_001', 0.6), 'tick_ui': ui('interface-sounds_tick_001', 0.8),
    'tick_soft': lambda: tick(2600, 0.01) * 0.6, 'click': ui('interface-sounds_click_002', 0.8), 'scroll_tick': ui('interface-sounds_scroll_002', 0.9),
    'type': typing, 'paper': paper, 'lock_rattle': lock_rattle, 'glitch': glitch, 'scratch': scratch, 'counter': counter, 'cash': cash,
    'select': ui('interface-sounds_select_002', 0.7), 'confirm': ui('interface-sounds_confirmation_002', 0.8), 'toggle': ui('interface-sounds_toggle_002', 0.8),
    'error': ui('interface-sounds_error_004', 0.6), 'maximize': ui('interface-sounds_maximize_004', 0.7), 'open': ui('interface-sounds_open_002', 0.7),
    'bong': ui('interface-sounds_bong_001', 0.6), 'close': ui('interface-sounds_close_002', 0.7), 'glass': ui('interface-sounds_glass_002', 0.7),
}

sfx = np.zeros((N, 2))
def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0: return
    if sig.ndim == 1: sig = np.stack([sig * (1 - max(0, pan)), sig * (1 + min(0, pan))], 1)
    sig = sig[: N - i] * gain
    sfx[i:i + len(sig)] += sig
cache = {}
for c in C['cues']:
    if c['name'] not in SFX: print('missing sfx', c['name']); continue
    key = c['name'] + str(rng.integers(0, 3) if c['name'] in ('notif', 'slam', 'whoosh') else '')
    if key not in cache: cache[key] = SFX[c['name']]()
    place(cache[key], c['t'], c['gain'] * 0.55, c.get('pan', 0.0))

# ───────────── music ─────────────
BPM = 112; BEAT = 60 / BPM; BAR = BEAT * 4
moods = sorted(C['music'], key=lambda m: m['t'])
# layer gains per mood
L = ['pad', 'pad_dark', 'arp', 'bass', 'kick', 'hat', 'clap', 'drone', 'clock', 'bells', 'pulse']
G = {
    'dawn':    dict(pad=.55, bells=.35),
    'lift':    dict(pad=.65, arp=.5, bells=.3, hat=.25),
    'groove':  dict(pad=.5, arp=.55, bass=.6, kick=.7, hat=.45, clap=.45),
    'stop':    dict(),
    'grind':   dict(drone=.55, clock=.8, pulse=.5),
    'tension': dict(pad_dark=.55, drone=.5, pulse=.6, kick=.35),
    'airy':    dict(pad=.55, bells=.45, arp=.25),
    'build':   dict(pad=.55, arp=.6, hat=.4, pulse=.3),
    'drive':   dict(pad=.5, arp=.6, bass=.65, kick=.75, hat=.5, clap=.5),
    'soft':    dict(pad=.5, arp=.35, bass=.35, hat=.25),
    'suspense':dict(pad_dark=.5, drone=.6, pulse=.45),
    'silence': dict(),
    'epic':    dict(pad=.65, arp=.65, bass=.7, kick=.8, hat=.55, clap=.55, bells=.3),
    'warm':    dict(pad=.55, bells=.4, bass=.3),
    'finale':  dict(pad=.6, arp=.6, bass=.7, kick=.8, hat=.55, clap=.55, bells=.35),
    'end':     dict(pad=.4, bells=.3),
}
gain = {l: np.zeros(N) for l in L}
for k, m in enumerate(moods):
    a = int(m['t'] * SR); b = int(moods[k + 1]['t'] * SR) if k + 1 < len(moods) else N
    for l in L: gain[l][a:b] = G.get(m['mood'], {}).get(l, 0.0)
def smooth(x, sec):
    n = int(sec * SR); k = np.ones(n) / n
    return fftconvolve(x, k, mode='full')[n // 2: n // 2 + len(x)]
fast = {'kick', 'clap', 'hat', 'clock', 'pulse'}
for l in L: gain[l] = smooth(gain[l], 0.06 if l in fast else 0.7)

NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
PROG = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 66]]   # Am7  Fmaj7  Cmaj7  G(maj7)
PROG_D = [[57, 60, 64], [50, 53, 57], [52, 55, 59], [57, 60, 64]]                 # Am Dm Em Am
music = np.zeros((N, 2))
tt = T(N)

def add_note(buf, at, sig, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    s = sig[: N - i]
    buf[i:i + len(s), 0] += s * (1 - max(0, pan)); buf[i:i + len(s), 1] += s * (1 + min(0, pan))

def saw_pad(freqs, dur):
    n = int(dur * SR); t = T(n); x = np.zeros(n)
    for f in freqs:
        for d in (-0.08, 0.0, 0.08):
            ff = f * 2 ** (d / 12)
            x += (2 * ((t * ff) % 1) - 1) * 0.05
    x = lp(x, 1800)
    e = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6).clip(0, 1)
    return x * e

def pluck(f, d=0.28):
    n = int((d * 3) * SR); t = T(n)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)) * env(n, 0.002, d)
    return x * 0.16

def layer(name):
    buf = np.zeros((N, 2))
    nbars = int(TOTAL / BAR) + 1
    for b in range(nbars):
        t0 = b * BAR
        ch = PROG[b % 4]; chd = PROG_D[b % 4]
        if name == 'pad': add_note(buf, t0, saw_pad([NOTE(m) for m in ch], BAR + 0.6))
        if name == 'pad_dark': add_note(buf, t0, saw_pad([NOTE(m - 12) for m in chd], BAR + 0.6))
        if name == 'bass':
            for k in range(8):
                f = NOTE(ch[0] - 24); n = int(BEAT / 2 * SR); x = np.sin(2 * np.pi * f * T(n)) * env(n, 0.004, 0.18) * 0.45
                add_note(buf, t0 + k * BEAT / 2 + (BEAT / 4 if k % 2 else 0) * 0, x)
        if name == 'arp':
            pat = [0, 1, 2, 3, 2, 1, 2, 3] * 2
            for k in range(16):
                m = ch[pat[k] % len(ch)] + 12
                add_note(buf, t0 + k * BEAT / 4, pluck(NOTE(m)), pan=0.35 * math.sin(k))
        if name == 'kick':
            for k in range(4): add_note(buf, t0 + k * BEAT, sub_hit(50, 0.45, 0.25) * 0.5)
        if name == 'hat':
            for k in range(8):
                n = int(0.08 * SR); x = hp(rng.standard_normal(n), 7000) * env(n, 0.001, 0.02 if k % 2 == 0 else 0.04) * (0.08 if k % 2 == 0 else 0.13)
                add_note(buf, t0 + k * BEAT / 2, x, pan=0.2)
        if name == 'clap':
            for k in (1, 3):
                n = int(0.3 * SR); x = bp(rng.standard_normal(n), 900, 5000) * env(n, 0.002, 0.07) * 0.35
                add_note(buf, t0 + k * BEAT, reverb(x, 0.7, 0.25))
        if name == 'clock':
            for k in range(4): add_note(buf, t0 + k * BEAT, tick(2400 if k % 2 else 3100, 0.012) * 0.35)
        if name == 'pulse':
            for k in range(8):
                n = int(0.2 * SR); x = lp(np.sign(np.sin(2 * np.pi * NOTE(chd[0] - 24) * T(n))), 400) * env(n, 0.005, 0.08) * 0.22
                add_note(buf, t0 + k * BEAT / 2, x)
        if name == 'bells' and b % 2 == 0:
            for k, m in enumerate([ch[3] + 12, ch[2] + 24, ch[1] + 12]):
                n = int(2.4 * SR); x = (np.sin(2 * np.pi * NOTE(m) * T(n)) + 0.2 * np.sin(2 * np.pi * NOTE(m) * 2.76 * T(n))) * env(n, 0.003, 0.9) * 0.08
                add_note(buf, t0 + k * BEAT * 1.5, x, pan=(-0.4, 0.4, 0)[k])
    if name == 'drone':
        x = sum(np.sin(2 * np.pi * NOTE(m) * tt + 0.3 * np.sin(tt * 0.3 + m)) for m in (33, 40, 45)) * 0.07
        buf[:, 0] += x; buf[:, 1] += x
    return buf

for l in L:
    if gain[l].max() <= 0: continue
    lay = layer(l)
    if l in ('pad', 'bells', 'pad_dark', 'arp'):
        lay = np.stack([reverb(lay[:, 0], 2.2, 0.3)[:N], reverb(lay[:, 1], 2.3, 0.3)[:N]], 1)
    music += lay * gain[l][:, None]

# kick sidechain pump on pads
kickenv = np.ones(N)
for b in range(int(TOTAL / BEAT)):
    i = int(b * BEAT * SR); n = min(int(0.25 * SR), N - i)
    if n <= 0: break
    kickenv[i:i + n] *= 1 - 0.35 * np.exp(-T(n) / 0.08)
music *= (1 - (1 - kickenv) * (gain['kick'] > 0.1))[:, None]

# ───────────── voice: EQ, compression, special treatments ─────────────
v = np.zeros(N); v[: min(N, len(vo))] = vo[: N]
v = hp(v, 85)
pres = bp(v, 2500, 6000); v = v + pres * 0.25                    # presence
low = bp(v, 120, 300); v = v + low * 0.12                         # warmth
# simple compressor
e = np.sqrt(smooth(v ** 2, 0.02) + 1e-9)
g = np.minimum(1, (0.12 / e) ** 0.45); v = v * g
for fx in C.get('fx', {}).get('voice', []):
    a, b = int(fx['t0'] * SR), int(fx['t1'] * SR)
    seg = v[a:b].copy()
    if fx['kind'] == 'thought':
        seg2 = bp(seg, 350, 3200) * 1.6
        tail = reverb(seg2, 1.2, 0.3)
        v[a:b] = seg2 * 0.9
        v[b:b + len(tail) - len(seg2)] += tail[len(seg2):][: N - b]
    if fx['kind'] == 'whisper':
        tail = reverb(seg, 2.4, 0.3)
        m = min(len(tail), N - a)
        v[a:b] = 0
        v[a:a + m] += tail[:m] * 1.1
v_st = np.stack([v, v], 1)
# duck music + ambience under the voice
speech = smooth((np.abs(v) > 0.02).astype(float), 0.25)
duck = 1 - 0.55 * np.clip(speech * 1.6, 0, 1)
mix = v_st * 1.0 + music * 0.30 * duck[:, None] + sfx * 1.0
# ambience beds
for amb in C.get('fx', {}).get('amb', []):
    a, b = int(amb['t0'] * SR), int(amb['t1'] * SR); n = b - a
    if n <= 0: continue
    fade = np.minimum(1, np.minimum(T(n) / 0.8, (n / SR - T(n)) / 0.8))
    if amb['kind'] == 'birds':
        x = np.zeros(n)
        for k in range(int(n / SR * 2.2)):
            s = int(rng.uniform(0, n / SR - 0.4) * SR); m = int(rng.uniform(0.06, 0.16) * SR); t = T(m)
            f0 = rng.uniform(2600, 4200); ch_ = np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.sin(2 * np.pi * rng.uniform(18, 30) * t)) / SR) * np.sin(np.pi * t / t[-1]) * 0.05
            x[s:s + m] += ch_
        x = reverb(x, 1.6, 0.4)[:n]
    elif amb['kind'] == 'crickets':
        t = T(n); x = np.sin(2 * np.pi * 4600 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (np.sin(2 * np.pi * 0.9 * t) > 0) * 0.025
        x = x + np.sin(2 * np.pi * 5200 * t) * (np.sin(2 * np.pi * 31 * t + 1) > 0.4) * (np.sin(2 * np.pi * 0.7 * t + 2) > 0.2) * 0.018
    elif amb['kind'] == 'office':
        x = lp(rng.standard_normal(n), 500) * 0.05 + np.sin(2 * np.pi * 100 * T(n)) * 0.006
    else:
        x = lp(rng.standard_normal(n), 3000) * 0.012
    mix[a:b] += (x * fade * amb.get('gain', 1.0))[:, None]

# master: gentle limiter + loudness
mix = mix[: N]
peak = np.abs(mix).max()
meter = pyln.Meter(SR)
loud = meter.integrated_loudness(mix)
mix = pyln.normalize.loudness(mix, loud, -14.0)
mix = np.tanh(mix * 1.1) / np.tanh(1.1) * 0.97
wavfile.write('final.wav', SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
print('wrote final.wav', round(N / SR, 2), 's; loudness before', round(loud, 1))
if '--stats' in sys.argv:
    def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    mus_ = music * 0.30 * duck[:, None]
    for a in range(0, int(TOTAL) - 5, 15):
        sl = slice(a * SR, (a + 15) * SR)
        print(f'{a:4d}s  vo {db(v_st[sl]):6.1f}  music {db(mus_[sl]):6.1f}  sfx {db(sfx[sl]):6.1f}  peak sfx {20*np.log10(np.abs(sfx[sl]).max()+1e-9):6.1f}')
