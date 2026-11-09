"""Track a chroma-green phone screen in a generated clip and composite a real app capture into it.

  python3 scripts/phone_comp.py <clip.mp4> <screen_track_dir> <out.mp4> [--offset S] [--fps-screen 30] [--debug dir]

Per frame: key the green, fit the screen quad (lines fitted to the four hull sides, so rounded
corners do not shrink it), smooth the corners over time, warp the capture with a homography,
and blend it through the soft key so fingers stay in front. Green spill on the hands is removed.
Frames with no plausible screen are left as they are (spill removal only).
"""
import argparse
import glob
import os
import subprocess

import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("clip"); ap.add_argument("track"); ap.add_argument("out")
ap.add_argument("--offset", type=float, default=0.0, help="screen-track time at clip frame 0 (s)")
ap.add_argument("--fps-screen", type=float, default=30.0)
ap.add_argument("--rate", type=float, default=1.0, help="screen-track seconds per clip second")
ap.add_argument("--debug", default="")
ap.add_argument("--glow", type=float, default=1.0, help="screen brightness multiplier")
ap.add_argument("--quads", default="", help="write the smoothed per-frame screen corners (TL,TR,BR,BL px) as JSON")
a = ap.parse_args()

def read_frames(path):
    cap = cv2.VideoCapture(path)
    while True:
        ok, f = cap.read()
        if not ok:
            break
        yield f


_cap = cv2.VideoCapture(a.clip)
fps = _cap.get(cv2.CAP_PROP_FPS) or 24
W, H = int(_cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
_cap.release()
track = sorted(glob.glob(os.path.join(a.track, "*.jpg")) + glob.glob(os.path.join(a.track, "*.png")))
assert track, "empty screen track"
SH, SW = cv2.imread(track[0]).shape[:2]


def greenness(img):
    f = img.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]
    return g - np.maximum(r, b)


def fit_quad(mask):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cnts:
        return None
    c = max(cnts, key=cv2.contourArea)
    area = cv2.contourArea(c)
    if area < 0.0015 * W * H:
        return None
    hull = cv2.convexHull(c)
    eps = 0.02 * cv2.arcLength(hull, True)
    approx = None
    for _ in range(30):
        ap_ = cv2.approxPolyDP(hull, eps, True)
        if len(ap_) == 4:
            approx = ap_.reshape(4, 2).astype(np.float32)
            break
        eps *= 1.15 if len(ap_) > 4 else 0.85
    if approx is None:
        rect = cv2.minAreaRect(hull)
        approx = cv2.boxPoints(rect).astype(np.float32)
    # order TL, TR, BR, BL
    s = approx.sum(1); d = approx[:, 0] - approx[:, 1]
    q = np.array([approx[np.argmin(s)], approx[np.argmax(d)], approx[np.argmax(s)], approx[np.argmin(d)]], np.float32)
    # refine: fit a line to the hull points nearest each side, intersect neighbours
    pts = c.reshape(-1, 2).astype(np.float32)
    lines = []
    for i in range(4):
        p0, p1 = q[i], q[(i + 1) % 4]
        v = p1 - p0; L = np.linalg.norm(v) + 1e-6; n = np.array([-v[1], v[0]]) / L
        t = ((pts - p0) @ v) / (L * L)
        dist = np.abs((pts - p0) @ n)
        sel = pts[(t > 0.15) & (t < 0.85) & (dist < max(4, 0.06 * L))]
        if len(sel) < 8:
            lines.append((p0, v / L)); continue
        vx, vy, x0, y0 = cv2.fitLine(sel, cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        lines.append((np.array([x0, y0], np.float32), np.array([vx, vy], np.float32)))
    out = []
    for i in range(4):
        (pa, da), (pb, db) = lines[i - 1], lines[i]
        A = np.array([[da[0], -db[0]], [da[1], -db[1]]], np.float32)
        if abs(np.linalg.det(A)) < 1e-4:
            out.append(q[i]); continue
        t = np.linalg.solve(A, pb - pa)
        out.append(pa + da * t[0])
    out = np.array(out, np.float32)
    if np.abs(out - q).max() > 0.25 * np.sqrt(area):
        out = q
    w = (np.linalg.norm(out[1] - out[0]) + np.linalg.norm(out[2] - out[3])) / 2
    h = (np.linalg.norm(out[3] - out[0]) + np.linalg.norm(out[2] - out[1])) / 2
    if h < 1 or not (0.30 < w / h < 0.75):
        return None
    return out, area


raw_q = []
for f in read_frames(a.clip):
    g = greenness(f)
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    # screen plate only: the chroma screen measures ~220 here, green spill on skin ~60-110
    m = ((g > 150) & (hsv[..., 1] > 150) & (hsv[..., 2] > 120)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    r = fit_quad(m)
    raw_q.append(None if r is None else r[0])

# fill short gaps, then smooth corners over time (forward-backward EMA)
n = len(raw_q)
valid = [q is not None for q in raw_q]
Q = np.zeros((n, 4, 2), np.float32)
idx = [i for i in range(n) if valid[i]]
for i in range(n):
    if valid[i]:
        Q[i] = raw_q[i]
    elif idx:
        prev = max([j for j in idx if j < i], default=None); nxt = min([j for j in idx if j > i], default=None)
        if prev is not None and nxt is not None and nxt - prev <= 6:
            t = (i - prev) / (nxt - prev); Q[i] = raw_q[prev] * (1 - t) + raw_q[nxt] * t; valid[i] = True
def ema(arr, k):
    out = arr.copy()
    for i in range(1, len(arr)):
        out[i] = out[i - 1] * k + arr[i] * (1 - k)
    return out
runs, i = [], 0
while i < n:
    if valid[i]:
        j = i
        while j + 1 < n and valid[j + 1]:
            j += 1
        runs.append((i, j)); i = j + 1
    else:
        i += 1
for s, e in runs:
    seg = Q[s:e + 1]
    f1 = ema(seg, 0.55); f2 = ema(f1[::-1], 0.55)[::-1]
    Q[s:e + 1] = f2

if a.debug:
    os.makedirs(a.debug, exist_ok=True)
if a.quads:
    import json
    json.dump({"w": W, "h": H, "fps": fps, "quads": [Q[i].round(2).tolist() if valid[i] else None for i in range(n)]}, open(a.quads, "w"))

src = np.float32([[0, 0], [SW - 1, 0], [SW - 1, SH - 1], [0, SH - 1]])
proc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                         "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", a.out], stdin=subprocess.PIPE)
cache = {}
def screen_at(t):
    k = int(round(t * a.fps_screen))
    k = min(max(k, 0), len(track) - 1)
    if k not in cache:
        img = cv2.imread(track[k])
        if len(cache) > 8:
            cache.pop(next(iter(cache)))
        cache[k] = img
    return cache[k]

def despill(img, band, blur):
    """The generated glow tints the hands green: clamp green to a skin-aware limit near the
    screen (neutral greys and whites are unchanged) and give a little energy back as neutral light."""
    bandf = cv2.GaussianBlur(band.astype(np.float32) / 255, (0, 0), blur)[..., None]
    b_, g_, r_ = img[..., 0], img[..., 1], img[..., 2]
    lim = np.maximum(b_, 0.88 * r_ + 0.12 * b_)
    g2 = np.where(g_ > lim, lim + (g_ - lim) * 0.06, g_)
    spill = g_ - g2
    # give a little of the removed energy back as neutral screen light (never warm: that read as yellow)
    des = np.stack([b_ + spill * 0.14, g2 + spill * 0.12, r_ + spill * 0.12], -1)
    # where a strong cast was removed, ease the saturation a little so skin reads as screen-lit, not olive
    lum = (0.114 * des[..., 0] + 0.587 * des[..., 1] + 0.299 * des[..., 2])[..., None]
    k = (np.clip(spill / 40.0, 0, 1) * 0.35)[..., None]
    des = des * (1 - k) + lum * k
    return img * (1 - bandf) + des * bandf


for i, f in enumerate(read_frames(a.clip)):
    if i >= n:
        break
    base = f.astype(np.float32)
    g = greenness(f)
    if valid[i]:
        q = Q[i]
        ph = int(max(np.linalg.norm(q[3] - q[0]), np.linalg.norm(q[2] - q[1])))
        k = max(31, int(ph * 0.55)) | 1
        poly = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(poly, q.astype(np.int32), 255)
        band = cv2.dilate(poly, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
        out = despill(base, band, max(8, k / 6))
        Hm = cv2.getPerspectiveTransform(src, q)
        scr = screen_at(a.offset + i / fps * a.rate)
        scr = cv2.GaussianBlur(scr, (0, 0), 0.35 * SW / max(1, np.linalg.norm(q[1] - q[0])))
        warp = cv2.warpPerspective(scr, Hm, (W, H), flags=cv2.INTER_AREA if SW > W else cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        inner = cv2.erode(poly, np.ones((3, 3), np.uint8)).astype(np.float32) / 255
        inner = cv2.GaussianBlur(inner, (0, 0), 0.8)
        # soft key on strong green only (screen ~220, spill on skin ~60-110). Holes are closed inside
        # the green area itself, never by brightness, so green-lit fingers and the bezel (inside the
        # fitted quad but not screen-green) always stay in front of the app.
        alpha = np.clip((g - 120) / 70.0, 0, 1) * inner
        solid = cv2.morphologyEx(((g > 150) * 255).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        solid = cv2.erode(solid, np.ones((3, 3), np.uint8)).astype(np.float32) / 255
        alpha = np.maximum(alpha, solid * inner * 0.97)
        alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)[..., None]
        out = out * (1 - alpha) + warp.astype(np.float32) * a.glow * alpha
    else:
        band = ((g > 25).astype(np.uint8) * 255)
        band = cv2.dilate(band, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (151, 151)))
        out = despill(base, band, 20)
    o = np.clip(out, 0, 255).astype(np.uint8)
    proc.stdin.write(o.tobytes())
    if a.debug and i % 12 == 0:
        dbg = o.copy()
        if valid[i]:
            cv2.polylines(dbg, [Q[i].astype(np.int32)], True, (0, 0, 255), 2)
        cv2.imwrite(os.path.join(a.debug, f"f{i:04d}.jpg"), dbg)
proc.stdin.close(); proc.wait()
print(f"{a.out}: {n} frames @ {fps}, screen tracked in {sum(valid)} frames")
