"""Detect completed pull-up repetitions in a fixed-camera bar video.

The athlete is dark (black kit) against a flat bright wall, so a simple
persistent-background subtraction isolates them cleanly. Occupancy of a
horizontal band just below the bar rises to a sharp peak at the top of every
rep and falls back to zero at the bottom, which makes rep segmentation exact
rather than heuristic.

Usage: python3 analyze.py <video>
"""
import subprocess, sys
import numpy as np

PW, PH = 180, 320          # analysis resolution
FPS = 30000 / 1001
BAR_Y = 160                # bar row at PH=320, measured from the source
BAND = slice(168, 205)     # band just below the bar
COLS = slice(55, 125)      # central columns: the athlete's corridor
HI, LO = 900, 120          # top / bottom thresholds on band occupancy


def load(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={PW}:{PH}",
         "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
        stdout=subprocess.PIPE, check=True).stdout
    n = len(raw) // (PW * PH * 3)
    return np.frombuffer(raw, np.uint8)[:n * PW * PH * 3].reshape(n, PH, PW, 3)


def detect(vid):
    dark = vid.max(axis=3) < 80
    static = dark.mean(axis=0) > 0.90          # bar, brackets, fixed shadow
    ath = dark & ~static[None]
    band = ath[:, BAND, COLS].sum(axis=(1, 2)).astype(float)

    reps, i, n = [], 0, len(band)
    above = band >= HI
    while i < n:
        if not above[i]:
            i += 1
            continue
        j = i
        while j < n and above[j]:
            j += 1
        peak = i + int(np.argmax(band[i:j]))
        back = np.nonzero(band[peak:peak + 35] <= 40)[0]   # returned to bottom
        reps.append((peak, peak + int(back[0]) if back.size else peak + 18))
        i = j
    return band, reps


if __name__ == "__main__":
    band, reps = detect(load(sys.argv[1]))
    print(f"{len(reps)} completed repetitions")
    for k, (peak, done) in enumerate(reps, 1):
        print(f"  rep {k:2d}  top {peak/FPS:6.2f}s (f{peak})"
              f"   completed {done/FPS:6.2f}s (f{done})")
