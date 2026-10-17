"""Spurly product demo (≈50 s, 1920x1080, 60 fps) built from the real-app clip renders.

python3 demo.py [--preview] [--from S] [--to S]
Timeline lives in timeline.json so it can be re-timed to the final voiceover without code changes.
"""
import json, math, os, subprocess, sys
from functools import lru_cache
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

W, H, FPS = 1920, 1080, 60
CLIPS = '/home/claude/clips'
FONT = {w: f'fonts/InstrumentSans-{w}.ttf' for w in (500, 600, 700)}
MONO = 'fonts/PlexMono-500.ttf'
NAVY = (11, 14, 42)
BLUE = (59, 91, 219)
HL = (124, 147, 255)        # highlighted caption words
WHITE = (255, 255, 255)

# ── window geometry (content keeps the app's 16:10) ──
CW, CH = 1360, 850
BAR = 40
WX, WY = (W - CW) // 2, 166
RADIUS = 22

TL = json.load(open('timeline.json'))

def ease(t): return t * t * t * (t * (6 * t - 15) + 10)
def eout(t): return 1 - (1 - t) ** 3
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))

# ── per-clip camera, reused from the clip renders ──
class Clip:
    def __init__(self, name, frames, shots):
        self.dir = f'{CLIPS}/frames/{frames}'
        meta = json.load(open(f'{self.dir}/meta.json'))
        self.fps, self.n = meta['fps'], meta['frames']
        self.VW, self.VH, self.DPR = meta['view']['width'], meta['view']['height'], meta['dpr']
        marks = {k: v / 1000 for k, v in meta['marks'].items()}
        self.marks = marks
        self.cuts = [marks[c] for c in meta.get('cuts', [])]
        spec = json.load(open(f'{CLIPS}/{shots}'))
        self.keys = sorted(((marks[k['at']] if isinstance(k['at'], str) else k['at']) + k.get('+', 0), k['cx'], k['cy'], k['z']) for k in spec['keys'])

    def cam(self, t):
        k = self.keys
        if t <= k[0][0]: return k[0][1:]
        for (t0, x0, y0, z0), (t1, x1, y1, z1) in zip(k, k[1:]):
            if t <= t1:
                u = ease((t - t0) / (t1 - t0)) if t1 > t0 else 1
                return x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, math.exp(math.log(z0) + (math.log(z1) - math.log(z0)) * u)
        return k[-1][1:]

    def frame(self, t, size=(CW, CH)):
        i = int(round(clamp(t, 0, (self.n - 1) / self.fps) * self.fps))
        cx, cy, z = self.cam(i / self.fps)
        w, h = self.VW / z, self.VH / z
        cx = min(max(cx, w / 2), self.VW - w / 2); cy = min(max(cy, h / 2), self.VH - h / 2)
        box = [max(0, (cx - w / 2) * self.DPR), max(0, (cy - h / 2) * self.DPR), min(self.VW * self.DPR, (cx + w / 2) * self.DPR), min(self.VH * self.DPR, (cy + h / 2) * self.DPR)]
        im = Image.open(f'{self.dir}/f{i:05d}.jpg').convert('RGB')
        out = im.resize(size, Image.LANCZOS, box=box, reducing_gap=2.0)
        # the clip's own scene dissolves
        for c in self.cuts:
            ci = round(c * self.fps)
            if ci <= i < ci + int(0.35 * self.fps):
                prev = self.frame((ci - 1) / self.fps, size)
                out = Image.blend(prev, out, ease((i - ci + 1) / int(0.35 * self.fps)))
        return out

CLIP = {
    'find': Clip('find', 'find2', 'shots-find.json'),
    'claude': Clip('claude', 'claude', 'shots-claude.json'),
    'follow': Clip('follow', 'follow', 'shots-follow.json'),
    'invitations': Clip('invitations', 'invitations', 'shots-invitations.json'),
}

# ── static layers ──
@lru_cache(None)
def background():
    bg = Image.new('RGB', (W, H), NAVY)
    glow = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(glow)
    d.ellipse([W * 0.15, -H * 0.55, W * 0.85, H * 0.55], fill=150)
    d.ellipse([-W * 0.2, H * 0.6, W * 0.35, H * 1.5], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    bg = Image.composite(Image.new('RGB', (W, H), (52, 70, 190)), bg, glow)
    return bg

@lru_cache(None)
def hook_bg():
    src = Image.open(f"{CLIPS}/frames/find2/f00060.jpg").convert('RGB').resize((1920, 1200), Image.LANCZOS).crop((0, 60, 1920, 1140))
    src = src.filter(ImageFilter.GaussianBlur(14))
    return Image.blend(src, Image.new('RGB', (W, H), NAVY), 0.80)

@lru_cache(None)
def window_parts():
    full_h = BAR + CH
    mask = Image.new('L', (CW, full_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, CW - 1, full_h - 1], RADIUS, fill=255)
    shadow = Image.new('L', (CW + 240, full_h + 240), 0)
    ImageDraw.Draw(shadow).rounded_rectangle([120, 150, 120 + CW, 150 + full_h], RADIUS, fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(48))
    bar = Image.new('RGB', (CW, BAR), (22, 26, 64))
    d = ImageDraw.Draw(bar)
    for k, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse([18 + k * 22, 14, 30 + k * 22, 26], fill=c)
    border = Image.new('L', (CW, full_h), 0)
    ImageDraw.Draw(border).rounded_rectangle([0, 0, CW - 1, full_h - 1], RADIUS, outline=255, width=2)
    return mask, shadow, bar, border

@lru_cache(None)
def font(size, weight=700):
    return ImageFont.truetype(FONT[weight] if weight in FONT else weight, size)

@lru_cache(None)
def url_pill(text):
    f = ImageFont.truetype(MONO, 17)
    tw = int(f.getlength(text))
    pill = Image.new('RGBA', (tw + 36, 26), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle([0, 0, tw + 35, 25], 13, fill=(255, 255, 255, 22))
    ImageDraw.Draw(pill).text((18, 3), text, font=f, fill=(200, 206, 255, 230))
    return pill

def draw_window(canvas, content, url, alpha=1.0, scale=1.0, dy=0.0):
    mask, shadow, bar, border = window_parts()
    full = Image.new('RGB', (CW, BAR + CH))
    full.paste(bar, (0, 0)); full.paste(content, (0, BAR))
    pill = url_pill(url)
    full.paste(pill, ((CW - pill.width) // 2, 7), pill)
    # hairline highlight on the window edge
    full = Image.composite(Image.new('RGB', full.size, (70, 80, 150)), full, border.point(lambda v: v * 0.55))
    if scale != 1.0:
        sw, sh = int(CW * scale), int((BAR + CH) * scale)
        full = full.resize((sw, sh), Image.BICUBIC); m = mask.resize((sw, sh), Image.BICUBIC)
        sh_img = shadow.resize((int(shadow.width * scale), int(shadow.height * scale)), Image.BICUBIC)
    else:
        sw, sh, m, sh_img = CW, BAR + CH, mask, shadow
    x = int(W / 2 - sw / 2); y = int(WY + (BAR + CH) / 2 - sh / 2 + dy)
    sh_a = sh_img.point(lambda v: int(v * alpha))
    canvas.paste(Image.new('RGB', sh_img.size, (0, 0, 8)), (x - int(120 * scale), y - int(120 * scale)), sh_a)
    canvas.paste(full, (x, y), m.point(lambda v: int(v * alpha)))

# ── kinetic text ──
@lru_cache(None)
def word_img(word, size, weight, color):
    f = font(size, weight)
    l, t, r, b = f.getbbox(word)
    im = Image.new('RGBA', (r - l + 8, size + size // 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - l, size * 0.12), word, font=f, fill=color + (255,))
    return im

def kinetic(canvas, text, t, cx, cy, size=60, weight=700, stagger=0.07, dur=0.32, hl=(), out_t=None, max_w=1700, color=WHITE, align='center'):
    """Words rise + fade in one after another. `*word*` = highlighted. Returns nothing; draws on canvas."""
    words = text.split(' ')
    f = font(size, weight)
    space = f.getlength(' ')
    items = []
    for w_ in words:
        hot = w_.startswith('*')
        w_ = w_.strip('*')
        items.append((w_, HL if hot or w_.lower().strip('.,!?') in hl else color))
    # line wrap
    lines, cur, cw = [], [], 0
    for w_, c in items:
        ww = f.getlength(w_)
        if cur and cw + space + ww > max_w:
            lines.append((cur, cw)); cur, cw = [], 0
        cw = cw + (space if cur else 0) + ww; cur.append((w_, c, ww))
    if cur: lines.append((cur, cw))
    lh = size * 1.18
    y0 = cy - lh * len(lines) / 2
    k = 0
    fade_out = 1.0 if out_t is None else clamp(1 - (t - out_t) / 0.22)
    for li, (ln, lw) in enumerate(lines):
        x = cx - lw / 2 if align == 'center' else cx
        for w_, c, ww in ln:
            p = clamp((t - k * stagger) / dur)
            if p > 0:
                e = eout(p)
                img = word_img(w_, size, weight, c)
                a = e * fade_out
                if a > 0.01:
                    im = img if a > 0.99 else img.copy()
                    if a <= 0.99:
                        im.putalpha(img.getchannel('A').point(lambda v: int(v * a)))
                    canvas.paste(im, (int(x - 4), int(y0 + li * lh + (1 - e) * size * 0.45)), im)
            x += ww + space
            k += 1

# ── scenes ──
def scene_hook(t, s):
    c = _hook_text(t, s, hook_bg().copy())
    # camera shake right after "Okay, stop." and a zoom kick on every beat
    b0 = s['beats'][0]['at']
    z, ox, oy = 1.0, 0, 0
    for b in s['beats']:
        d = t - b['at']
        if 0 <= d < 0.4: z += 0.06 * (1 - eout(d / 0.4))
    d0 = t - b0
    if 0 <= d0 < 0.5:
        amp = 14 * (1 - d0 / 0.5)
        ox, oy = int(amp * math.sin(d0 * 95)), int(amp * math.cos(d0 * 71))
    if z != 1.0 or ox or oy:
        zw, zh = int(W * z), int(H * z)
        big = c.resize((zw, zh), Image.BICUBIC)
        x0, y0 = (zw - W) // 2 - ox, (zh - H) // 2 - oy
        c = Image.new('RGB', (W, H), NAVY); c.paste(big, (-x0, -y0))
    return c

def _hook_text(t, s, c):
    beats = s['beats']
    for b in beats:
        if b['at'] <= t < b['until'] + 0.25:
            kinetic(c, b['text'], t - b['at'], W / 2, H / 2 + b.get('dy', 0), size=b.get('size', 110), stagger=b.get('stagger', 0.07), out_t=b['until'] - b['at'], max_w=1760)
            if b.get('sub'):
                kinetic(c, b['sub'], t - b['at'] - 0.45, W / 2, H / 2 + b.get('dy', 0) + b.get('size', 110) * 0.95, size=34, weight=MONO, color=(170, 182, 255), out_t=b['until'] - b['at'] - 0.45)
            if b.get('strike'):
                # animated strike-through under the last two words
                f = font(b.get('size', 110), 700)
                words = b['text'].replace('*', '')
                lines_w = f.getlength(words)
                p = ease(clamp((t - b['at'] - b['strike']) / 0.35))
                if p > 0 and t < b['until']:
                    seg = f.getlength(b['strike_text'])
                    x1 = W / 2 + lines_w / 2 - seg
                    d = ImageDraw.Draw(c)
                    yy = H / 2 + b.get('dy', 0) + b.get('strike_dy', 0)
                    d.rounded_rectangle([x1, yy - 5, x1 + seg * p, yy + 5], 5, fill=(255, 92, 92))
    return c

def scene_window(t, s, prev_end_content=None):
    c = background().copy()
    # enter / exit motion of the window
    ent = s.get('enter', 0.0); ext = s.get('exit', 0.0); dur = s['dur']
    a, sc, dy = 1.0, 1.0, 0.0
    if ent and t < ent:
        p = eout(clamp(t / ent)); a, sc, dy = p, 0.94 + 0.06 * p, 40 * (1 - p)
    if ext and t > dur - ext:
        p = ease(clamp((t - (dur - ext)) / ext)); a, sc, dy = 1 - p, 1 - 0.04 * p, -20 * p
    # punch: every caption change gives the window a small zoom kick (an ad beat every 2-3 s)
    for cap in s.get('captions', []):
        dtc = t - cap['at']
        if 0 <= dtc < 0.38 and cap['at'] > 0.05:
            sc *= 1 + 0.03 * (1 - eout(dtc / 0.38))
    content = window_content(s, t)
    prev = s.get('_prev')
    TR = 0.34
    if prev is not None and prev['kind'] == 'window' and t < TR:
        content = slide(window_content(prev, prev['dur'] - 1 / FPS), content, t / TR)
    draw_window(c, content, s['url'], a, sc, dy)
    if s.get('flash') and t < 0.18:
        c = Image.blend(c, Image.new('RGB', (W, H), (235, 240, 255)), 0.32 * (1 - t / 0.18))
    for cap in s.get('captions', []):
        if cap['at'] <= t < cap.get('until', dur) + 0.25:
            if cap.get('typing'):
                typed_pill(c, cap['text'], t - cap['at'], cap.get('until', dur) - cap['at'])
            else:
                kinetic(c, cap['text'], t - cap['at'], W / 2, 84, size=cap.get('size', 58), out_t=(cap.get('until', dur) - cap['at']), max_w=1700)
    return c

def slide(prev, cur, p):
    """Whip transition inside the window: old content flies left, new one arrives, with motion blur."""
    e = ease(p)
    off = int(e * CW)
    out = Image.new('RGB', (CW, CH))
    out.paste(prev, (-off, 0)); out.paste(cur, (CW - off, 0))
    k = math.sin(math.pi * p)
    if k > 0.05:
        f = 1 + 26 * k
        out = out.resize((max(8, int(CW / f)), CH), Image.BILINEAR).resize((CW, CH), Image.BILINEAR)
    return out

def window_content(s, t):
    clip = CLIP[s['clip']]
    if s.get('segs'):
        acc = 0.0; content = None
        for k, (a0, b0, d0) in enumerate(s['segs']):
            if t < acc + d0 or k == len(s['segs']) - 1:
                u = clamp((t - acc) / d0)
                content = clip.frame(a0 + (b0 - a0) * u)
                if k > 0 and t - acc < 0.2:  # quick dissolve over the jump
                    pa, pb, _ = s['segs'][k - 1]
                    content = Image.blend(clip.frame(pb), content, ease((t - acc) / 0.2))
                break
            acc += d0
    else:
        content = clip.frame(s['src'][0] + t * s.get('speed', 1.0))
    return content

def typed_pill(canvas, text, t, life):
    """The ask, typed out in a prompt pill (our own motion graphic, not any app's UI)."""
    f = font(40, 600)
    n = int(clamp((t - 0.15) / max(0.1, life * 0.62)) * len(text))
    shown = text[:n]
    a = eout(clamp(t / 0.25)) * clamp(1 - (t - life) / 0.22)
    full_w = f.getlength(text)
    pw, ph = int(full_w + 150), 86
    px, py = int(W / 2 - pw / 2), int(84 - ph / 2)
    pill = Image.new('RGBA', (pw, ph), (0, 0, 0, 0))
    d = ImageDraw.Draw(pill)
    d.rounded_rectangle([0, 0, pw - 1, ph - 1], ph // 2, fill=(255, 255, 255, int(242 * a)), outline=(124, 147, 255, int(255 * a)), width=2)
    # spark glyph
    cx0, cy0 = 46, ph // 2
    for dx, dy in ((0, -14), (0, 14), (-14, 0), (14, 0)):
        d.line([cx0, cy0, cx0 + dx, cy0 + dy], fill=(217, 111, 74, int(255 * a)), width=5)
    d.text((80, ph // 2 - 26), shown, font=f, fill=(20, 24, 60, int(255 * a)))
    if n < len(text) or int(t * 2.2) % 2 == 0:
        cx = 80 + f.getlength(shown) + 4
        d.rectangle([cx, ph // 2 - 22, cx + 3, ph // 2 + 22], fill=(59, 91, 219, int(255 * a)))
    canvas.paste(pill, (px, py), pill)

def scene_card(t, s):
    c = background().copy()
    kinetic(c, s['text'], t, W / 2, H / 2, size=s.get('size', 96), stagger=0.09, dur=0.4, out_t=s['dur'] - 0.3, max_w=1400)
    return c

@lru_cache(None)
def mark_img(h):
    m = Image.open('mark.png'); return m.resize((int(m.width * h / m.height), h), Image.LANCZOS)

def scene_cta(t, s):
    c = background().copy()
    d = ImageDraw.Draw(c)
    # logo lockup
    p = eout(clamp(t / 0.5))
    mk = mark_img(130)
    wm = word_img('Spurly', 132, 700, WHITE)
    total = mk.width + 34 + wm.width
    x = W / 2 - total / 2; y = 300 + (1 - p) * 30
    if p > 0:
        m2 = mk.copy(); m2.putalpha(mk.getchannel('A').point(lambda v: int(v * p)))
        c.paste(m2, (int(x), int(y)), m2)
        w2 = wm.copy(); w2.putalpha(wm.getchannel('A').point(lambda v: int(v * p)))
        c.paste(w2, (int(x + mk.width + 34), int(y - 18)), w2)
    kinetic(c, s['tagline'], t - 0.45, W / 2, 545, size=56, weight=600, color=(214, 220, 255), hl=('autopilot.',))
    # button
    bp = eout(clamp((t - 1.0) / 0.45))
    if bp > 0:
        f = font(46, 700)
        label = s['button']
        tw = f.getlength(label)
        bw, bh = tw + 120, 104
        pulse = 1 + 0.025 * math.sin(max(0, t - 1.6) * 4.2) if t > 1.6 else 1
        bw2, bh2 = bw * pulse, bh * pulse
        bx, by = W / 2 - bw2 / 2, 650 + (1 - bp) * 30
        glow = Image.new('L', (W, H), 0)
        ImageDraw.Draw(glow).rounded_rectangle([bx - 10, by + 10, bx + bw2 + 10, by + bh2 + 30], 60, fill=int(150 * bp))
        glow = glow.filter(ImageFilter.GaussianBlur(30))
        c.paste(Image.new('RGB', (W, H), (60, 90, 230)), (0, 0), glow)
        btn = Image.new('RGBA', (int(bw2), int(bh2)), (0, 0, 0, 0))
        bd = ImageDraw.Draw(btn)
        bd.rounded_rectangle([0, 0, int(bw2) - 1, int(bh2) - 1], int(bh2 / 2), fill=BLUE + (int(255 * bp),))
        bd.rounded_rectangle([3, 2, int(bw2) - 4, 8], 4, fill=(255, 255, 255, int(70 * bp)))
        c.paste(btn, (int(bx), int(by)), btn)
        lw = word_img(label, int(46 * pulse), 700, WHITE)
        lw2 = lw.copy(); lw2.putalpha(lw.getchannel('A').point(lambda v: int(v * bp)))
        c.paste(lw2, (int(W / 2 - lw.width / 2), int(by + bh2 / 2 - 46 * pulse * 0.66)), lw2)
    kinetic(c, s['url'], t - 1.5, W / 2, 840, size=40, weight=MONO, color=(170, 182, 255))
    return c

SCENES = []
t0 = 0.0
_prev = None
for s in TL['scenes']:
    s['_prev'] = _prev; _prev = s
    SCENES.append((t0, s)); t0 += s['dur']
TOTAL = t0

def render(i):
    t = i / FPS
    for st, s in SCENES:
        if st <= t < st + s['dur']:
            lt = t - st
            kind = s['kind']
            img = scene_hook(lt, s) if kind == 'hook' else scene_window(lt, s) if kind == 'window' else scene_card(lt, s) if kind == 'card' else scene_cta(lt, s)
            # short dip between scenes that ask for it
            if s.get('fade_in') and lt < s['fade_in']:
                img = Image.blend(Image.new('RGB', (W, H), NAVY), img, ease(lt / s['fade_in']))
            if kind in ('card', 'cta') and lt < 0.4:
                # zoom-through: the new scene settles from 112% while a short flash fades
                p = eout(lt / 0.4); z = 1.12 - 0.12 * p
                zw, zh = int(W * z), int(H * z)
                img = img.resize((zw, zh), Image.BICUBIC).crop(((zw - W) // 2, (zh - H) // 2, (zw - W) // 2 + W, (zh - H) // 2 + H))
                img = Image.blend(img, Image.new('RGB', (W, H), (235, 240, 255)), 0.28 * (1 - p))
            return img.tobytes()
    return Image.new('RGB', (W, H), NAVY).tobytes()

if __name__ == '__main__':
    preview = '--preview' in sys.argv
    a = float(sys.argv[sys.argv.index('--from') + 1]) if '--from' in sys.argv else 0
    b = float(sys.argv[sys.argv.index('--to') + 1]) if '--to' in sys.argv else TOTAL
    if '--stills' in sys.argv:
        for ts in [float(x) for x in sys.argv[sys.argv.index('--stills') + 1].split(',')]:
            Image.frombytes('RGB', (W, H), render(int(ts * FPS))).save(f'stills/s{ts:05.2f}.png')
        sys.exit()
    os.makedirs('out', exist_ok=True)
    frames = range(int(a * FPS), int(b * FPS), 6 if preview else 1)
    out = 'out/demo-master.mov' if not preview else 'out/preview.mp4'
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS // (6 if preview else 1)), '-i', '-',
                           *(['-c:v', 'libx264', '-crf', '8', '-preset', 'medium', '-pix_fmt', 'yuv444p'] if not preview else ['-c:v', 'libx264', '-crf', '24', '-pix_fmt', 'yuv420p']), out], stdin=subprocess.PIPE)
    with Pool(2) as pool:
        for k, buf in enumerate(pool.imap(render, frames, chunksize=6)):
            ff.stdin.write(buf)
            if k % 300 == 0: print(f'{k}/{len(frames)}', flush=True)
    ff.stdin.close(); ff.wait()
    print('total', round(TOTAL, 2), 's ->', out)
