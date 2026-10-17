"""Camera + encode for a rendered clip.

python3 camera.py <name> <shots.json> [--preview]

frames/<name>/fNNNNN.jpg are 2x frames (3200x2000 for a 1600x1000 CSS viewport).
<shots.json> lists camera keys {"at": <mark or seconds>, "+": offset_s, "cx","cy","z"}
in CSS px. Between keys the camera eases (smootherstep, zoom in log space).
Output: out/<name>.mp4 / .webm / -poster.webp at 1280x800, 60 fps, with the
last XF seconds crossfading into the first frame so the loop is seamless.
"""
import json, math, os, subprocess, sys
from PIL import Image

name, shots_path = sys.argv[1], sys.argv[2]
preview = '--preview' in sys.argv
d = f'frames/{name}'
meta = json.load(open(f'{d}/meta.json'))
fps, N = meta['fps'], meta['frames']
VW, VH, DPR = meta['view']['width'], meta['view']['height'], meta['dpr']
OW, OH = 1280, 800
XF = 0.5
marks = {k: v / 1000 for k, v in meta['marks'].items()}
spec = json.load(open(shots_path))
keys = []
for k in spec['keys']:
    t = (marks[k['at']] if isinstance(k['at'], str) else k['at']) + k.get('+', 0)
    keys.append((t, k['cx'], k['cy'], k['z']))
keys.sort()
dur = N / fps

def smooth(t): return t * t * t * (t * (6 * t - 15) + 10)

def cam(t):
    if t <= keys[0][0]: return keys[0][1:]
    for (t0, x0, y0, z0), (t1, x1, y1, z1) in zip(keys, keys[1:]):
        if t <= t1:
            u = smooth((t - t0) / (t1 - t0)) if t1 > t0 else 1
            z = math.exp(math.log(z0) + (math.log(z1) - math.log(z0)) * u)
            return x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z
    return keys[-1][1:]

def crop_box(cx, cy, z):
    w, h = VW / z, VH / z
    cx = min(max(cx, w / 2), VW - w / 2)
    cy = min(max(cy, h / 2), VH - h / 2)
    b = [(cx - w / 2) * DPR, (cy - h / 2) * DPR, (cx + w / 2) * DPR, (cy + h / 2) * DPR]
    return [max(0.0, b[0]), max(0.0, b[1]), min(VW * DPR, b[2]), min(VH * DPR, b[3])]

def render(i):
    im = Image.open(f'{d}/f{i:05d}.jpg').convert('RGB')
    box = crop_box(*cam(i / fps))
    # resize from a float box: sub-pixel camera motion stays smooth
    return im.resize((OW, OH), Image.LANCZOS, box=box, reducing_gap=None)

os.makedirs('out', exist_ok=True)
master = f'out/{name}-master.mov'
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(fps), '-i', '-',
                       '-c:v', 'libx264', '-crf', '6', '-preset', 'medium', '-pix_fmt', 'yuv444p', master], stdin=subprocess.PIPE)
first = render(0)
xf_n = int(XF * fps)
poster_t = spec.get('poster')
poster_i = int(((marks[poster_t] if isinstance(poster_t, str) else poster_t) + spec.get('poster+', 0)) * fps) if poster_t is not None else 0
step = 6 if preview else 1
XC = int(0.4 * fps)
cut_frames = [round(marks[c] * fps) for c in meta.get('cuts', [])]
held = None
for i in range(0, N, step):
    im = first if i == 0 else render(i)
    for cf in cut_frames:
        if i == cf - 1 or (preview and cf - step <= i < cf):
            held = im
        if cf <= i < cf + XC and held is not None:
            im = Image.blend(held, im, smooth((i - cf + 1) / XC))
    k = i - (N - xf_n)
    if k >= 0:
        im = Image.blend(im, first, smooth((k + 1) / xf_n))
    if i == poster_i or (preview and abs(i - poster_i) < step):
        im.save(f'out/{name}-poster.png')
    ff.stdin.write(im.tobytes())
ff.stdin.close(); ff.wait()
if preview:
    print('preview master written'); sys.exit()

crf = os.environ.get('CRF', '20')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', master, '-an', '-c:v', 'libx264', '-preset', 'veryslow', '-crf', crf, '-tune', 'animation',
                '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-x264-params', 'keyint=600:min-keyint=60:aq-mode=3:deblock=-1,-1', '-movflags', '+faststart',
                f'out/{name}.mp4'], check=True)
vcrf = os.environ.get('VPCRF', '32')
for p in (1, 2):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', master, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', vcrf, '-pix_fmt', 'yuv420p',
                    '-row-mt', '1', '-tile-columns', '2', '-g', '600', '-deadline', 'good', '-cpu-used', '1', '-pass', str(p), '-passlogfile', f'out/{name}-vp9',
                    *(['-f', 'null', '/dev/null'] if p == 1 else [f'out/{name}.webm'])], check=True)
subprocess.run(['cwebp', '-quiet', '-q', '86', '-m', '6', f'out/{name}-poster.png', '-o', f'out/{name}-poster.webp'], check=False) if subprocess.run(['which', 'cwebp'], capture_output=True).returncode == 0 else \
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'out/{name}-poster.png', '-c:v', 'libwebp', '-quality', '86', '-compression_level', '6', f'out/{name}-poster.webp'], check=True)
for f in (f'{name}.mp4', f'{name}.webm', f'{name}-poster.webp'):
    print(f, round(os.path.getsize(f'out/{f}') / 1024), 'KB')
print('duration', round(dur, 2), 's')
