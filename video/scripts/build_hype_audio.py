"""Soundtrack for the reshape-online.com hype ad (27 s, 48 kHz stereo): the coach's voice (ElevenLabs
voice "mohammed alsagr", eleven_v4, Saudi white dialect), a percussion-only pulse at 120 BPM (a beat is
exactly 15 frames at 30 fps, so cuts land on it) and SFX from public/ad/sfx. Nothing tonal.

Outputs: public/audio/hype/mix.wav (-14 LUFS, -1 dBTP), public/audio/hype/vo.wav, src/hype/timeline.json
Usage: python3 scripts/build_hype_audio.py   (from video/)
"""
import json
import subprocess

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy import signal

SR = 48000
DUR = 27.0
N = int(SR * DUR)
RNG = np.random.default_rng(7)
BEAT = 0.5

# take, speech start inside the file, and the time its first word lands in the film; phrases are
# (text, start, end) inside the file, measured from the pauses of each take.
LINES = [
    ("h1a", 0.04, 0.30, [("تتمرن من سنين…", 0.04, 1.32), ("ومكانك ما تغيّر؟!", 1.62, 2.86)]),
    ("h2a", 0.04, 3.50, [("المشكلة مو فيك…", 0.04, 1.10), ("المشكلة إنك", 1.52, 2.18), ("تتمرن بدون خطة!", 2.36, 3.74)]),
    ("h3a", 0.10, 7.50, [("في RESHAPE…", 0.10, 0.80), ("برنامجك مبني على مستواك!", 1.28, 3.36)]),
    ("h4a", 0.04, 11.00, [("كل تمرين بفيديو…", 0.04, 1.24), ("وتغذيتك محسوبة لك بالسعرة!", 1.60, 3.38)]),
    ("h5a", 0.04, 14.60, [("وأنا معك…", 0.04, 0.84), ("أتابعك خطوة بخطوة.", 1.24, 2.84)]),
    ("h6a", 0.04, 17.75, [("أول مسل أب؟", 0.04, 0.84), ("أول فرونت ليفر؟", 1.28, 2.14), ("بتوصل لها!", 2.46, 3.24)]),
    ("h7a", 0.04, 21.25, [("لا تأجّل…", 0.04, 0.74), ("سجّل الحين!", 1.02, 1.88), ("reshape-online.com", 2.20, 3.60)]),
]
SCENES = [("hook", 0.0, 3.5), ("problem", 3.5, 7.5), ("brand", 7.5, 11.0), ("features", 11.0, 14.5),
          ("coach", 14.5, 17.5), ("skills", 17.5, 21.0), ("cta", 21.0, 27.0)]


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def place(buf, x, at, gain=1.0):
    i = int(round(at * SR))
    if i < 0:
        x, i = x[-i:], 0
    x = x[: max(0, len(buf) - i)]
    buf[i:i + len(x)] += x * gain


def sos(kind, f, x, order=2):
    return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output="sos"), x)


# ---------------------------------------------------------------- voice
vo = np.zeros(N)
phrases, speech = [], []
for take, s0, at, parts in LINES:
    x = decode(f"audio-src/hype/{take}.mp3")
    x = sos("highpass", 70, x)
    fade = int(0.01 * SR)
    x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
    off = at - s0
    place(vo, x, off)
    for text, a, b in parts:
        phrases.append({"text": text, "start": round(off + a, 3), "end": round(off + b, 3)})
    speech.append((off + parts[0][1], off + parts[-1][2]))
vo *= 0.9 / np.abs(vo).max()

# ---------------------------------------------------------------- percussion pulse (no pitch content beyond a kick thump)
def kick():
    t = np.arange(int(0.28 * SR)) / SR
    f = 46 + 90 * np.exp(-t * 38)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) + 0.25 * sos("highpass", 2500, RNG.standard_normal(len(t))) * np.exp(-t * 220)

def hat(open_=False):
    t = np.arange(int((0.16 if open_ else 0.05) * SR)) / SR
    return sos("highpass", 7000, RNG.standard_normal(len(t))) * np.exp(-t * (28 if open_ else 95))

def clap():
    t = np.arange(int(0.2 * SR)) / SR
    n = sos("bandpass", [900, 3600], RNG.standard_normal(len(t)))
    e = sum(np.exp(-np.maximum(t - d, 0) * 70) * (t >= d) for d in (0.0, 0.011, 0.023)) / 3
    return n * e

beat = np.zeros(N)
# sections: sparse under the hook, full from the brand hit, break before the CTA slam, out under the end card
for k in range(int(DUR / BEAT)):
    t = k * BEAT
    if t >= 25.5:
        break
    full = 7.5 <= t < 20.0 or 21.0 <= t < 25.5
    drop = 20.0 <= t < 21.0
    if drop:
        continue
    if k % 2 == 0 or full:
        place(beat, kick(), t, 0.95)
    if full and k % 2 == 1:
        place(beat, clap(), t, 0.5)
    if t >= 3.5:
        place(beat, hat(), t + BEAT / 2, 0.22 if full else 0.14)
    if full and k % 4 == 3:
        place(beat, hat(True), t + BEAT * 0.75, 0.16)
beat = sos("highpass", 30, beat)

# ---------------------------------------------------------------- sfx
def wav(name):
    x, sr = sf.read(f"public/ad/sfx/{name}.wav")
    assert sr == SR
    return x.mean(axis=1) if x.ndim > 1 else x

sfx = np.zeros(N)
for at, name, g in [(0.0, "boom1", 0.55), (3.36, "whoosh1", 0.5), (5.82, "boom2", 0.75), (7.2, "whoosh2", 0.55),
                    (7.5, "logo_hit", 0.7), (10.86, "whoosh1", 0.45), (12.56, "tap", 0.5), (14.36, "whoosh2", 0.45),
                    (17.36, "whoosh1", 0.5), (18.0, "riser", 0.5), (20.17, "boom1", 0.8), (20.86, "whoosh2", 0.5),
                    (22.23, "boom2", 0.6), (23.41, "phone_wake", 0.45), (24.9, "logo_hit", 0.6)]:
    place(sfx, wav(name), at, g)

# ---------------------------------------------------------------- mix: duck the pulse and sfx under the voice
env = np.zeros(N)
for a, b in speech:
    env[int(a * SR):int(b * SR)] = 1
env = signal.sosfiltfilt(signal.butter(2, 6, "lowpass", fs=SR, output="sos"), env).clip(0, 1)
bed = (beat * 0.42 + sfx * 0.6) * (1 - 0.55 * env)
mix = vo + bed
stereo = np.stack([mix, mix], axis=1)
meter = pyloudnorm.Meter(SR)
stereo *= 10 ** ((-14.0 - meter.integrated_loudness(stereo)) / 20)
peak = np.abs(signal.resample_poly(stereo[:, 0], 4, 1)).max()
if peak > 10 ** (-1 / 20):
    stereo = np.tanh(stereo / peak * 1.6) / np.tanh(1.6) * 10 ** (-1.2 / 20)
    stereo *= 10 ** ((-14.0 - meter.integrated_loudness(stereo)) / 20)
print("LUFS", round(meter.integrated_loudness(stereo), 2), "true peak dB", round(20 * np.log10(np.abs(signal.resample_poly(stereo[:, 0], 4, 1)).max()), 2))

import os
os.makedirs("public/audio/hype", exist_ok=True)
sf.write("public/audio/hype/mix.wav", stereo, SR, subtype="PCM_24")
sf.write("public/audio/hype/vo.wav", np.stack([vo, vo], axis=1), SR, subtype="PCM_24")
json.dump({"fps": 30, "durationSeconds": DUR, "beat": BEAT,
           "scenes": [{"id": i, "start": a, "end": b} for i, a, b in SCENES], "phrases": phrases},
          open("src/hype/timeline.json", "w"), ensure_ascii=False, indent=1)
for p in phrases:
    print(p)
