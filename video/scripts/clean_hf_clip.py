"""Key a Higgsfield character clip off its flat background into a transparent WebM (VP9 + alpha), so the
character can be composited over the reel's own backgrounds in Remotion.

The clips are drawn on a flat wall + floor band, and the model sometimes paints dark smudges into the
empty wall. Each frame: the wall/floor colour of every row is read from the left and right edges, pixels
close to it (or a plain darker floor = the cast shadow) are background, and of what is left only the
components that follow the subject from the previous frame are kept. Smudges, shadow and floor all go.

Usage: python3 scripts/clean_hf_clip.py in.mp4 out.webm first_frame last_frame repeats [width] [pp]
"""
import os
import shutil
import subprocess
import sys

import cv2
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
f0, f1, reps = int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
out_w = int(sys.argv[6]) if len(sys.argv) > 6 else 1280
pingpong = len(sys.argv) > 7 and sys.argv[7] == "pp"     # play the range forward then backward

cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
h, w = frames[0].shape[:2]
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))


def matte(f):
    """Soft 0..1 'not background' matte of one frame."""
    x = f.astype(np.float32)
    edge = np.concatenate([x[:, :24], x[:, -24:]], axis=1)
    row = np.median(edge, axis=1)[:, None, :]                      # h x 1 x 3
    dist = np.abs(x - row).max(axis=2)
    a = np.clip((dist - 14) / 18, 0, 1)
    # the cast shadow: a uniformly darker version of the row's own colour
    ratio = x / np.maximum(row, 1)
    floor = (np.abs(row - row[:8].mean(axis=0)).max(axis=2) > 6)                     # rows of the floor band
    shadow = floor & (ratio.max(axis=2) < 1.04) & (ratio.min(axis=2) > 0.55) & ((ratio.max(axis=2) - ratio.min(axis=2)) < 0.17)
    a[shadow] = 0
    return a


first = matte(frames[0])
n, lab, stats, _ = cv2.connectedComponentsWithStats((first > 0.5).astype(np.uint8), 8)
prev = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
# everything solid in the first frame that sits near the main figure belongs to the subject (box, shoes)
near0 = cv2.dilate(prev, k, iterations=6)
prev = ((first > 0.5) & (near0 > 0)).astype(np.uint8)

tmp = dst + ".frames"
shutil.rmtree(tmp, ignore_errors=True)
os.makedirs(tmp)
out_h = int(round(h * out_w / w / 2) * 2)
kept = []
for i, f in enumerate(frames):
    if i >= f1:
        break
    a = matte(f)
    solid = (a > 0.5).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
    near = cv2.dilate(prev, k, iterations=3)
    keep = np.zeros_like(solid)
    for c in range(1, n):
        comp = lab == c
        area = comp.sum()
        inside = (comp & (near > 0)).sum()
        if inside > 0.85 * area:
            keep[comp] = 1
        elif inside > 1500:                                        # a smudge touching the subject
            keep[comp & (near > 0)] = 1
    prev = keep if keep.sum() > 0.5 * prev.sum() else prev
    if i < f0:
        continue
    alpha = a * cv2.dilate(keep, k).astype(np.float32)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
    rgba = np.dstack([f, (alpha * 255).astype(np.uint8)])
    kept.append(cv2.resize(rgba, (out_w, out_h), interpolation=cv2.INTER_AREA))
if pingpong:
    kept = kept + kept[-2:0:-1]
idx = 0
for _ in range(reps):
    for fr in kept:
        cv2.imwrite(f"{tmp}/{idx:04d}.png", fr)
        idx += 1
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(fps), "-i", f"{tmp}/%04d.png", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                "-b:v", "0", "-crf", "24", "-auto-alt-ref", "0", dst], check=True)
shutil.rmtree(tmp)
print(f"{dst}: {len(kept)} frames x {reps} at {fps} fps, {out_w}x{out_h}")
