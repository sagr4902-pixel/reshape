"""Print a 10 ms acoustic track of a stretch of speech so individual vowels can be checked without ears:
time, intensity (dB), voiced?, F1, F2, and the share of energy above 3 kHz (high = s / sh frication).
Usage: python3 scripts/phone_track.py <audio> <start> <end>
"""
import subprocess
import sys

import numpy as np
import parselmouth

SR = 24000
path, t0, t1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
snd = parselmouth.Sound(x, SR)
pitch = snd.to_pitch(0.01, 60, 350)
form = snd.to_formant_burg(0.01, 5, 5000, 0.025)
inten = snd.to_intensity(100, 0.01)
t = t0
while t < t1:
    i0, i1 = int((t - 0.0125) * SR), int((t + 0.0125) * SR)
    seg = x[max(i0, 0):i1] * np.hanning(i1 - max(i0, 0))
    sp = np.abs(np.fft.rfft(seg)) ** 2
    fr = np.fft.rfftfreq(len(seg), 1 / SR)
    hi = sp[fr > 3000].sum() / (sp.sum() + 1e-12)
    f0 = pitch.get_value_at_time(t)
    v = not np.isnan(f0)
    f1, f2 = form.get_value_at_time(1, t), form.get_value_at_time(2, t)
    db = inten.get_value(t)
    print(f"{t:6.2f}  {db:5.1f} dB  {'V' if v else '-'}  F1 {f1:5.0f}  F2 {f2:5.0f}  hi {hi:4.2f}  {'#' * int(max(0, (db - 40) / 2))}")
    t += 0.01
