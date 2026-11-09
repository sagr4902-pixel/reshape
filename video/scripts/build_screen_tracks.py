"""Assemble the per-shot phone-screen timelines (30 fps, 1170x2532 JPEG frames) for the v2 film.

  python3 scripts/build_screen_tracks.py <captures_dir> <out_dir> <light_captures_dir>

The morning screens are dark (captures_dir: seq_lock, seq_me, seq_home_dawn, seq_session_dawn) and
the evening ones light (light_captures_dir: seq_food, seq_progress, seq_medal, seq_web), so the
phone reads against each scene's light. Each track is a folder of frames that
scripts/phone_comp.py warps into a clip.
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

CAP, OUT, LIGHT = sys.argv[1], sys.argv[2], sys.argv[3]
APP = "public/ad/app"
W, H = 1170, 2532


def seq(d):
    p = d if os.path.isabs(d) else d
    return [os.path.join(p, f) for f in sorted(os.listdir(p)) if f.endswith((".jpg", ".png"))]


def load(p):
    return Image.open(p).convert("RGB").resize((W, H), Image.LANCZOS) if Image.open(p).size != (W, H) else Image.open(p).convert("RGB")


def write(name, frames):
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        os.remove(os.path.join(d, f))
    for i, fr in enumerate(frames):
        (fr if isinstance(fr, Image.Image) else load(fr)).save(os.path.join(d, f"{i:04d}.jpg"), quality=92)
    print(name, len(frames))


def ease(t):
    t = min(1, max(0, t))
    return 4 * t * t * t if t < .5 else 1 - (-2 * t + 2) ** 3 / 2


def zoom_cross(a, b, n, a_zoom=1.06, b_from=0.92):
    """a (lock or page) zooms forward and fades; b grows in from slightly smaller."""
    A, B = load(a), load(b)
    out = []
    for i in range(n):
        t = ease((i + 1) / (n + 1))
        za = 1 + (a_zoom - 1) * t
        Az = A.resize((int(W * za), int(H * za)), Image.LANCZOS).crop((int(W * (za - 1) / 2), int(H * (za - 1) / 2), int(W * (za - 1) / 2) + W, int(H * (za - 1) / 2) + H))
        zb = b_from + (1 - b_from) * t
        Bz = B.resize((int(W * zb), int(H * zb)), Image.LANCZOS)
        canvas = Image.new("RGB", (W, H), (10, 10, 12))
        canvas.paste(Bz, ((W - Bz.width) // 2, (H - Bz.height) // 2))
        out.append(Image.blend(Az, canvas, t))
    return out


# ---- C1 bedroom: lock screen (notification drops in) -> tap -> Account page scroll
lock = seq(os.path.join(CAP, "seq_lock"))
me = seq(os.path.join(CAP, "seq_me"))
write("t_bedroom", lock + zoom_cross(lock[-1], me[0], 9) + me + [me[-1]] * 12)

# ---- C2/C3 dawn rooftop: today's workout (top of home) -> tap -> session with the exercise video playing
home = seq(os.path.join(CAP, "seq_home_dawn"))  # 05:20, today's session not started yet
sess = seq(os.path.join(CAP, "seq_session_dawn"))
COVER = (93, 977, 984, 554)  # COVER_RECT x3 (CSS px of the 390x844 viewport, scroll 0)
tmp = os.path.join(OUT, "_cover")
os.makedirs(tmp, exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "1.2", "-i", "public/ad/final169/h01.mp4", "-t", "6", "-vf",
                f"fps=30,scale={COVER[2]}:{COVER[3]}:force_original_aspect_ratio=increase,crop={COVER[2]}:{COVER[3]}", os.path.join(tmp, "%04d.jpg")], check=True)
cov = seq(tmp)
mask = Image.new("L", (COVER[2], COVER[3]), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, COVER[2] - 1, COVER[3] - 1), radius=48, fill=255)
sess_frames = []
base = load(sess[0])
for i in range(150):
    fr = load(sess[min(i, len(sess) - 1)])
    if i >= 6:
        c = Image.open(cov[min(i - 6, len(cov) - 1)]).convert("RGB")
        o = min(1, (i - 6) / 8)
        reg = fr.crop((COVER[0], COVER[1], COVER[0] + COVER[2], COVER[1] + COVER[3]))
        fr.paste(Image.blend(reg, c, o), (COVER[0], COVER[1]), mask)
    sess_frames.append(fr)
# home holds at the top, then a short scroll so the "today" card settles; tap into the session at 151
home_part = [home[0]] * (151 - len(home)) + home  # 151 frames
write("t_dawn", home_part + zoom_cross(home[-1], sess[0], 8, a_zoom=1.04, b_from=0.95) + sess_frames)

# ---- C09 kitchen (evening, light): today's meals
write("t_food", seq(os.path.join(LIGHT, "seq_food")))

# ---- C10 sunset (evening, light): progress scroll -> medal pop
prog = seq(os.path.join(LIGHT, "seq_progress"))
medal = seq(os.path.join(LIGHT, "seq_medal"))
write("t_sunset", [prog[0]] * 6 + prog + medal + [medal[-1]] * 20)

# ---- C12 dusk + full-screen: the browser types reshape-online.com and walks the landing page
write("t_web", seq(os.path.join(LIGHT, "seq_web")))
