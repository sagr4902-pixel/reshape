"""Blur every face in a short clip: python3 blur_faces_video.py <in.mp4> <out.mp4> <yunet.onnx> [max_faces]
YuNet detection per frame (on a 2x upscale), faces tracked by nearest centre, gaps interpolated, boxes smoothed."""
import sys, subprocess, cv2, numpy as np
sys.path.insert(0, __import__("os").path.dirname(__file__))
from blur_faces import blur
src, dst, model = sys.argv[1:4]; K = int(sys.argv[4]) if len(sys.argv) > 4 else 2
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
h, w = frames[0].shape[:2]
det = cv2.FaceDetectorYN.create(model, "", (w * 2, h * 2), 0.45)
dets = []
for f in frames:
    _, fc = det.detect(cv2.resize(f, (w * 2, h * 2)))
    dets.append([] if fc is None else [tuple(d[:4] / 2) for d in fc])
# seed tracks from the frame with the most faces, then assign by nearest centre
seed = max(range(len(dets)), key=lambda i: len(dets[i]))
tracks = [{seed: b} for b in sorted(dets[seed], key=lambda b: b[0])[:K]]
for order in (range(seed + 1, len(dets)), range(seed - 1, -1, -1)):
    for i in order:
        for b in dets[i]:
            c = np.array([b[0] + b[2] / 2, b[1] + b[3] / 2])
            best, bd = None, 1e9
            for t in tracks:
                j = min(t, key=lambda k: abs(k - i)); p = t[j]
                d = np.linalg.norm(c - [p[0] + p[2] / 2, p[1] + p[3] / 2])
                if d < bd: best, bd = t, d
            if best is not None and bd < max(b[2], b[3]) * 1.5 and i not in best: best[i] = b
boxes = [[] for _ in frames]
for t in tracks:
    ks = sorted(t); arr = np.array([t[k] for k in ks])
    full = np.stack([np.interp(range(len(frames)), ks, arr[:, c]) for c in range(4)], 1)
    full = np.stack([np.convolve(np.pad(full[:, c], 2, mode="edge"), np.ones(5) / 5, "valid") for c in range(4)], 1)
    for i, b in enumerate(full): boxes[i].append(tuple(b))
    print(f"track: detected in {len(ks)}/{len(frames)} frames")
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
                      "-i", src, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "copy", dst], stdin=subprocess.PIPE)
for f, b in zip(frames, boxes): p.stdin.write(blur(f, b, pad=0.45).tobytes())
p.stdin.close(); p.wait(); print("wrote", dst, len(frames), "frames")
