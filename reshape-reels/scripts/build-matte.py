# -*- coding: utf-8 -*-
"""Per-frame subject matte for the plate.
Emits three aligned assets Remotion can blend against speaker.mp4:
  isolate.mp4  background darkened + desaturated, subject untouched (depth separation)
  edge.mp4     silhouette contour glow on black (screen-blend)
  track.json   per-frame subject bbox + arm centroids, for tracked labels
"""
import subprocess, json, sys, os
import numpy as np, cv2, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision

FF = os.environ.get("FFMPEG", "ffmpeg")
SRC = "/home/user/reshape/reshape-reels/public/speaker.mp4"
OUT = "/home/user/reshape/reshape-reels/public"
W, H, FPS = 1350, 2400, 30
SW, SH = W // 2, H // 2          # work at half res; matte edges are soft anyway

opts = vision.ImageSegmenterOptions(
    base_options=mpp.BaseOptions(model_asset_path="models/selfie_multiclass_256x256.tflite"),
    running_mode=vision.RunningMode.VIDEO, output_category_mask=True)

dec = subprocess.Popen([FF,"-loglevel","error","-i",SRC,"-f","rawvideo","-pix_fmt","rgb24","-vsync","0","-"],
                       stdout=subprocess.PIPE, bufsize=10**8)
def enc(path, extra):
    return subprocess.Popen([FF,"-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24",
        "-s",f"{W}x{H}","-r",str(FPS),"-i","-",*extra,path], stdin=subprocess.PIPE, bufsize=10**8)
iso = enc(f"{OUT}/isolate.mp4", ["-c:v","libx264","-preset","veryfast","-crf","18","-pix_fmt","yuv420p"])
edg = enc(f"{OUT}/edge.mp4",    ["-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p"])

k_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
k_e = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
track = []
fsz = W * H * 3
n = 0
with vision.ImageSegmenter.create_from_options(opts) as seg:
    while True:
        buf = dec.stdout.read(fsz)
        if len(buf) < fsz: break
        rgb = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        small = cv2.resize(rgb, (SW, SH), interpolation=cv2.INTER_AREA)
        cat = seg.segment_for_video(
            mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(small)),
            int(n * 1000 / FPS)).category_mask.numpy_view()
        cat = np.squeeze(cat)

        person_s = (cat > 0).astype(np.uint8)
        skin_s   = (cat == 2).astype(np.uint8)          # body skin only, not face
        face_s   = (cat == 3).astype(np.uint8)

        person = cv2.resize(person_s * 255, (W, H), interpolation=cv2.INTER_LINEAR)
        person = cv2.GaussianBlur(person, (0, 0), 3.0).astype(np.float32) / 255.0
        a = person[..., None]

        # --- isolate: world falls back, he does not ---
        g = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
        bg = (rgb.astype(np.float32) * 0.34 + g[..., None] * 0.30)     # dim + desaturate
        iso.stdin.write(np.clip(rgb * a + bg * (1 - a), 0, 255).astype(np.uint8).tobytes())

        # --- edge: contour ring around the silhouette ---
        pm = (person_s * 255)
        ring = cv2.subtract(cv2.dilate(pm, k_d), cv2.erode(pm, k_e))
        ring = cv2.resize(ring, (W, H), interpolation=cv2.INTER_LINEAR)
        ring = cv2.GaussianBlur(ring, (0, 0), 5.0)
        edg.stdin.write(np.repeat(ring[..., None], 3, axis=2).astype(np.uint8).tobytes())

        # --- track: bbox + left/right arm centroids (skin, excluding the face band) ---
        ys, xs = np.where(person_s > 0)
        rec = {"f": n}
        if len(xs):
            rec["bbox"] = [int(xs.min()*2), int(ys.min()*2), int(xs.max()*2), int(ys.max()*2)]
            fy = np.where(face_s.sum(axis=1) > 0)[0]
            below = int(fy.max()) if len(fy) else 0
            arm = skin_s.copy(); arm[:below, :] = 0
            cx = SW // 2
            for side, sl in (("L", slice(0, cx)), ("R", slice(cx, SW))):
                m = arm[:, sl]
                yy, xx = np.where(m > 0)
                if len(xx) > 400:
                    off = 0 if side == "L" else cx
                    rec[side] = [int((xx.mean() + off) * 2), int(yy.mean() * 2)]
        track.append(rec)
        n += 1
        if n % 120 == 0: print(f"  {n} frames", file=sys.stderr, flush=True)

for p in (iso, edg):
    p.stdin.close(); p.wait()
dec.stdout.close(); dec.wait()
json.dump(track, open(f"{OUT}/track.json", "w"))
print(f"done: {n} frames; tracked arms on {sum(1 for r in track if 'L' in r and 'R' in r)} frames")
