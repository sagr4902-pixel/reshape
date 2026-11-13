"""Scan a video for single-frame pops: python3 popscan.py video.mp4 [start_frame_offset]"""
import subprocess, sys
import numpy as np
path = sys.argv[1]; off = int(sys.argv[2]) if len(sys.argv) > 2 else 0
w, h = 108, 192
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
med = np.median(d)
print(f"frames={len(fr)} median_diff={med:.2f} max={d.max():.2f}")
# pop = a diff much larger than both neighbours (spike), or a big jump
for i in range(1, len(d) - 1):
    if d[i] > 6 and d[i] > 2.5 * max(d[i - 1], d[i + 1], 0.5):
        print(f"  spike at frame {i + 1 + off}: {d[i]:.2f} (neighbours {d[i-1]:.2f}, {d[i+1]:.2f})")
top = np.argsort(d)[::-1][:12]
print("largest diffs:", ", ".join(f"{i + 1 + off}:{d[i]:.1f}" for i in sorted(top)))
