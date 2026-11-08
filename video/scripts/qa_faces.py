"""Frame-by-frame face check for the RESHAPE commercial (the brief: no faces, especially no eyes).

Samples every Nth frame of a video and runs OpenCV's YuNet face detector (which also
returns eye landmarks). Every hit is saved as a crop for human review.
  python3 scripts/qa_faces.py <video.mp4> <models_dir> <out_dir> [step] [score]
"""
import os
import sys

import cv2

video, models, out = sys.argv[1], sys.argv[2], sys.argv[3]
step = int(sys.argv[4]) if len(sys.argv) > 4 else 3
thr = float(sys.argv[5]) if len(sys.argv) > 5 else 0.6
os.makedirs(out, exist_ok=True)

cap = cv2.VideoCapture(video)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
det = None
hits, i, scanned = [], 0, 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    if i % step == 0:
        scanned += 1
        h, w = frame.shape[:2]
        scale = 960 / max(h, w)
        small = cv2.resize(frame, (int(w * scale), int(h * scale)))
        if det is None:
            det = cv2.FaceDetectorYN.create(os.path.join(models, "yunet.onnx"), "", (small.shape[1], small.shape[0]), thr, 0.3, 200)
        _, faces = det.detect(small)
        for fc in faces if faces is not None else []:
            x, y, ww, hh = [int(v / scale) for v in fc[:4]]
            score = float(fc[-1])
            hits.append((i, i / fps, score, x, y, ww, hh))
            crop = frame[max(0, y - hh // 2): y + hh + hh // 2, max(0, x - ww // 2): x + ww + ww // 2]
            if crop.size:
                cv2.imwrite(os.path.join(out, f"hit_{i:05d}_{score:.2f}.jpg"), crop)
    i += 1
print(f"frames scanned: {scanned} of {i} (every {step}), threshold {thr}")
print(f"detections: {len(hits)}")
for hd in hits[:80]:
    print("  frame %d (%.2fs) score=%.2f box=%d,%d,%d,%d" % hd)
