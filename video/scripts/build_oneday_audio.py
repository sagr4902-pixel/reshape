"""Pre-mix RESHAPE "One Day" (v2): dry Saudi white-dialect VO + sound design only (NO MUSIC).

Cue frames mirror src/oneday/timeline.ts (30 fps). Location beds follow the picture and duck
under the voice; the master is loudness-normalised for social (-14 LUFS, -1 dBTP).
Usage: python3 scripts/build_oneday_audio.py  ->  public/ad/oneday_mix.wav
"""
import subprocess

import numpy as np

SR = 48000
FPS = 30
DUR_F = 1723
ROOT = "public/ad"
S, S2, VO = f"{ROOT}/sfx", f"{ROOT}/sfx2", f"{ROOT}/vo"


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def db(g):
    return 10 ** (g / 20)


N = int(DUR_F / FPS * SR) + SR
vo = np.zeros((N, 2))
bed = np.zeros((N, 2))
fx = np.zeros((N, 2))


def place(buf, path, frame, gain_db=0.0, dur_f=None, fade_in=0.01, fade_out=0.05, loop=False, rate=1.0):
    x = load(path)
    if rate != 1.0:  # simple resample for pitch/tempo nudges on foley
        idx = np.arange(0, len(x) - 1, rate)
        x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    start = int(frame / FPS * SR)
    length = int(dur_f / FPS * SR) if dur_f else len(x)
    if loop and length > len(x):
        xf = int(0.05 * SR)
        y = x.copy()
        while len(y) < length + xf:
            ramp = np.linspace(0, 1, xf)[:, None]
            seam = y[-xf:] * (1 - ramp) + x[:xf] * ramp
            y = np.concatenate([y[:-xf], seam, x[xf:]])
        x = y
    x = x[:length].copy()
    fi, fo = int(fade_in * SR), int(fade_out * SR)
    if fi > 0:
        x[:fi] *= np.linspace(0, 1, min(fi, len(x)))[:, None]
    if fo > 0:
        x[-fo:] *= np.linspace(1, 0, min(fo, len(x)))[:, None]
    end = min(start + len(x), N)
    buf[start:end] += x[: end - start] * db(gain_db)


# ---- voice-over: his voice carries the day, in a premium Saudi "white" dialect (not Fusha).
# Takes are trimmed to speech, so each frame is where the line starts to be heard.
for line, frame in [
    ("od1", 24), ("od2", 104),           # bedroom: notification -> Account page
    ("od4", 200), ("od5", 314),          # rooftop: today's workout, the session video
    ("od6a", 628), ("od6b", 786), ("od6c", 837),  # at home (rooftop) / travelling (hotel) / wherever (corniche)
    ("od7", 896),                        # kitchen: his food
    ("od8", 1048),                       # weeks later: progress, the medal lands right after the line
    ("od9", 1214),                       # sunset pull-up: the coach
    ("od11", 1333),                      # dusk: he types it, the voice says it
    ("od12", 1620),                      # end card
]:
    place(vo, f"{VO}/{line}.wav", frame, 0.0, fade_in=0.005, fade_out=0.03)

# ---- location beds (each shot keeps its own air)
place(bed, f"{S2}/amb_bedroom.wav", 0, 26, dur_f=172, fade_in=0.4, fade_out=0.2, loop=True)      # near-silent room, birds
place(bed, f"{S}/amb_roof.wav", 160, -8, dur_f=505, fade_in=0.3, fade_out=0.25, loop=True)       # dawn rooftop (c02..c05)
place(bed, f"{S}/amb_desert.wav", 655, -7, dur_f=130, fade_in=0.15, fade_out=0.08, loop=True)
place(bed, f"{S}/amb_hotel.wav", 780, -6, dur_f=56, fade_in=0.04, fade_out=0.08, loop=True)
place(bed, f"{S}/amb_sea.wav", 832, -7, dur_f=58, fade_in=0.04, fade_out=0.08, loop=True)
place(bed, f"{S2}/amb_kitchen.wav", 886, -5, dur_f=131, fade_in=0.05, fade_out=0.3, loop=True)
place(bed, f"{S}/amb_roof.wav", 1040, -11, dur_f=292, fade_in=0.35, fade_out=0.4, loop=True)    # sunset rooftop
place(bed, f"{S2}/amb_dusk.wav", 1312, -6, dur_f=300, fade_in=0.5, fade_out=1.2, loop=True)     # dusk city -> into the site

# ---- foley + accents (the "soul": small human sounds, heartbeat, breath)
for path, frame, g in [
    (f"{S2}/buzz.wav", 6, -6),          # phone wakes him
    (f"{S}/breath.wav", 66, -16),       # waking breath
    (f"{S}/tap.wav", 58, -12),          # opens the notification
    (f"{S2}/door.wav", 156, -6),        # rooftop door, wind rushes in with the bloom
    (f"{S2}/steps.wav", 172, -9),       # walking to the bar
    (f"{S}/tap.wav", 293, -13),         # starts the session
    (f"{S}/chalk.wav", 376, -4),
    (f"{S}/grip.wav", 428, -5),
    (f"{S}/bar_creak.wav", 470, -11),
    (f"{S}/breath.wav", 548, -10),      # the pull-up
    (f"{S}/bar_creak.wav", 572, -10),
    (f"{S2}/heartbeat.wav", 590, -7),   # push into the shirt
    (f"{S}/whoosh1.wav", 640, -9),
    (f"{S}/boom1.wav", 661, -7),        # out into the desert
    (f"{S}/sand.wav", 690, -8),
    (f"{S}/whoosh2.wav", 776, -9),      # whip -> hotel
    (f"{S}/whoosh1.wav", 828, -10),     # whip -> corniche
    (f"{S2}/run.wav", 836, -6),
    (f"{S}/whoosh2.wav", 882, -10),     # whip -> kitchen
    (f"{S}/tap.wav", 932, -14),
    (f"{S2}/heartbeat.wav", 1006, -4),  # "8 weeks later"
    (f"{S}/boom2.wav", 1017, -12),
    (f"{S}/tap.wav", 1060, -14),
    (f"{S}/medal.wav", 1168, -5),       # the badge lands
    (f"{S}/breath.wav", 1236, -13),     # sunset pull-up
    (f"{S}/bar_creak.wav", 1250, -12),
    (f"{S2}/typing.wav", 1329, -8),     # he types the address
    (f"{S}/tap.wav", 1366, -10),        # go
    (f"{S}/whoosh1.wav", 1490, -14),    # into the screen
    (f"{S}/tap.wav", 1531, -16),
    (f"{S}/tap.wav", 1599, -16),
    (f"{S}/logo_hit.wav", 1604, -3),
]:
    place(fx, path, frame, g, fade_in=0.004, fade_out=0.08)

# ---- duck beds and accents under the voice (smoothed VO envelope)
env = np.abs(vo).max(axis=1)
k = int(0.12 * SR)
env = np.convolve(env, np.ones(k) / k, mode="same")
active = np.clip(env / (env.max() * 0.08 + 1e-9), 0, 1)
mix = vo + bed * (1 - 0.45 * active)[:, None] + fx * (1 - 0.25 * active)[:, None]

peak = np.abs(mix).max()
if peak > 0.98:
    mix = np.tanh(mix / peak * 1.2) / np.tanh(1.2) * 0.98

mix = mix[: int(DUR_F / FPS * SR)]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-ar", str(SR), f"{ROOT}/oneday_mix.wav"],
               input=mix.astype(np.float32).tobytes(), check=True)
print("wrote", f"{ROOT}/oneday_mix.wav", f"{DUR_F / FPS:.2f}s")
