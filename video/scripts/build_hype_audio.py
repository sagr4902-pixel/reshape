"""Soundtrack for the reshape-online.com ad v2 (19.5 s, 48 kHz stereo): the coach's voice (ElevenLabs
voice "mohammed alsagr", eleven_v4, Saudi white dialect) and a few soft SFX from public/ad/sfx. NO MUSIC.

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
DUR = 19.5
N = int(SR * DUR)

# take, speech start inside the file, and the time its first word lands in the film; phrases are
# (text, start, end) inside the file, measured from the pauses of each take.
LINES = [
    ("h0a", 0.04, 0.30, [("ودّك توصل لأفضل نسخة من جسمك؟", 0.04, 2.12)]),
    ("h3a", 0.10, 3.00, [("في RESHAPE…", 0.10, 0.80), ("برنامجك مبني على مستواك!", 1.28, 3.36)]),
    ("h4a", 0.04, 6.60, [("كل تمرين بفيديو…", 0.04, 1.24), ("وتغذيتك محسوبة لك بالسعرة!", 1.60, 3.38)]),
    ("h5a", 0.04, 10.30, [("وأنا معك…", 0.04, 0.84), ("أتابعك خطوة بخطوة.", 1.24, 2.84)]),
    ("h7a", 0.04, 13.60, [("لا تأجّل…", 0.04, 0.74), ("سجّل الحين!", 1.02, 1.88), ("reshape-online.com", 2.20, 3.60)]),
]
SCENES = [("hook", 0.0, 2.9), ("level", 2.9, 6.5), ("video", 6.5, 8.05), ("nutrition", 8.05, 10.2),
          ("coach", 10.2, 13.4), ("cta", 13.4, 19.5)]


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

# ---------------------------------------------------------------- sfx
def wav(name):
    x, sr = sf.read(f"public/ad/sfx/{name}.wav")
    assert sr == SR
    return x.mean(axis=1) if x.ndim > 1 else x

sfx = np.zeros(N)
for at, name, g in [(0.0, "whoosh1", 0.35), (2.76, "whoosh2", 0.4), (4.18, "tap", 0.45), (6.36, "whoosh1", 0.35),
                    (7.91, "whoosh2", 0.35), (10.06, "whoosh1", 0.35), (13.26, "whoosh2", 0.4), (14.58, "boom2", 0.5),
                    (15.76, "phone_wake", 0.4), (17.3, "logo_hit", 0.55)]:
    place(sfx, wav(name), at, g)

# ---------------------------------------------------------------- mix: duck the pulse and sfx under the voice
env = np.zeros(N)
for a, b in speech:
    env[int(a * SR):int(b * SR)] = 1
env = signal.sosfiltfilt(signal.butter(2, 6, "lowpass", fs=SR, output="sos"), env).clip(0, 1)
bed = sfx * 0.6 * (1 - 0.5 * env)
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
json.dump({"fps": 30, "durationSeconds": DUR,
           "scenes": [{"id": i, "start": a, "end": b} for i, a, b in SCENES], "phrases": phrases},
          open("src/hype/timeline.json", "w"), ensure_ascii=False, indent=1)
for p in phrases:
    print(p)
