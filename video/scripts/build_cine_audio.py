"""Pre-mix the RESHAPE cinematic commercial: dry Saudi VO + sound design only (NO MUSIC).

Cue frames mirror src/cine/timeline.ts (30 fps). Ambience beds are ducked under the
voice; the master is loudness-normalised for social (-14 LUFS, -1 dBTP).
Usage: python3 scripts/build_cine_audio.py  ->  public/ad/cine_mix.wav
"""
import subprocess
import numpy as np

SR = 48000
FPS = 30
DUR_S = 1350 / FPS
ROOT = "public/ad"


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def db(g):
    return 10 ** (g / 20)


N = int(DUR_S * SR) + SR
vo = np.zeros((N, 2))
bed = np.zeros((N, 2))
fx = np.zeros((N, 2))


def place(buf, path, frame, gain_db=0.0, dur_f=None, fade_in=0.01, fade_out=0.05, loop=False):
    x = load(path)
    start = int(frame / FPS * SR)
    length = int(dur_f / FPS * SR) if dur_f else len(x)
    if loop and length > len(x):
        reps = int(np.ceil(length / len(x)))
        # crossfade loop seams by 50 ms
        xf = int(0.05 * SR)
        y = x.copy()
        for _ in range(reps):
            a = y[:-xf] if len(y) > xf else y
            ramp = np.linspace(0, 1, xf)[:, None]
            seam = y[-xf:] * (1 - ramp) + x[:xf] * ramp
            y = np.concatenate([a, seam, x[xf:]])
        x = y
    x = x[:length].copy()
    n = len(x)
    fi, fo = int(fade_in * SR), int(fade_out * SR)
    if fi > 0:
        x[:fi] *= np.linspace(0, 1, fi)[:, None]
    if fo > 0:
        x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    end = min(start + n, N)
    buf[start:end] += x[: end - start] * db(gain_db)


# ---- voice-over (normalised takes, -16 LUFS each)
for line, frame in [(1, 18), (2, 102), (4, 362), (5, 476), (6, 566), (7, 748), (8, 880), (9, 1056), (10, 1182)]:
    place(vo, f"{ROOT}/vo/l{line}.wav", frame, 0.0, fade_in=0.005, fade_out=0.03)

S = f"{ROOT}/sfx"
# ---- ambience beds (location sound under each shot)
place(bed, f"{S}/amb_roof.wav", 0, -9, dur_f=228, fade_in=0.6, fade_out=0.25, loop=True)
place(bed, f"{S}/amb_desert.wav", 228, -8, dur_f=120, fade_in=0.08, fade_out=0.25, loop=True)
place(bed, f"{S}/amb_roof.wav", 340, -24, dur_f=225, fade_in=0.3, fade_out=0.3, loop=True)   # phone: near-silent room tone
place(bed, f"{S}/amb_hotel.wav", 558, -6, dur_f=60, fade_in=0.05, fade_out=0.12, loop=True)
place(bed, f"{S}/amb_park.wav", 618, -8, dur_f=60, fade_in=0.05, fade_out=0.12, loop=True)
place(bed, f"{S}/amb_sea.wav", 678, -8, dur_f=62, fade_in=0.05, fade_out=0.2, loop=True)
place(bed, f"{S}/amb_roof.wav", 736, -24, dur_f=310, fade_in=0.3, fade_out=0.3, loop=True)
place(bed, f"{S}/amb_roof.wav", 1044, -9, dur_f=216, fade_in=0.2, fade_out=1.2, loop=True)

# ---- foley + accents
for path, frame, g in [
    ("bar_creak", 30, -9), ("chalk", 100, -3), ("grip", 170, -5), ("boom1", 228, -5),
    ("breath", 238, -12), ("sand", 300, -7), ("whoosh1", 340, -9), ("phone_wake", 350, -7),
    ("tap", 486, -9), ("whoosh2", 552, -10), ("boom2", 558, -8), ("whoosh1", 734, -10),
    ("tap", 800, -13), ("whoosh2", 866, -10), ("medal", 990, -4), ("boom1", 1044, -7),
    ("bar_creak", 1076, -11), ("breath", 1100, -14), ("riser", 1170, -13), ("logo_hit", 1260, -3),
]:
    place(fx, f"{S}/{path}.wav", frame, g, fade_in=0.004, fade_out=0.08)

# ---- duck beds and accents under the voice (smoothed VO envelope)
env = np.abs(vo).max(axis=1)
k = int(0.12 * SR)
env = np.convolve(env, np.ones(k) / k, mode="same")
active = np.clip(env / (env.max() * 0.08 + 1e-9), 0, 1)
duck = 1 - 0.45 * active
mix = vo + bed * duck[:, None] + fx * (1 - 0.25 * active)[:, None]

# soft safety limiter
peak = np.abs(mix).max()
if peak > 0.98:
    mix = np.tanh(mix / peak * 1.2) / np.tanh(1.2) * 0.98

mix = mix[: int(DUR_S * SR)]
raw = mix.astype(np.float32).tobytes()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-ar", str(SR), f"{ROOT}/cine_mix.wav"], input=raw, check=True)
print("wrote", f"{ROOT}/cine_mix.wav", f"{DUR_S:.2f}s")
