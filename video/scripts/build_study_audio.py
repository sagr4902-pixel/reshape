"""Soundtrack for the studies reel (48.9 s, 48 kHz stereo): the coach's voice (ElevenLabs voice
"mohammed alsagr", eleven_v4, Saudi white dialect) and a few soft SFX from public/ad/sfx. NO MUSIC.

Outputs: public/audio/study/mix.wav (-14 LUFS, -1 dBTP), public/audio/study/vo.wav
Usage: python3 scripts/build_study_audio.py   (from video/)
"""
import subprocess

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy import signal

SR = 48000
DUR = 48.9
N = int(SR * DUR)

# take, speech start inside the file, the time its first word lands in the film, speech end inside the file
LINES = [
    ("s0a", 0.04, 0.20, 2.28),    # ودّك توصل لأفضل نسخة من جسمك؟
    ("s0b", 0.02, 2.70, 1.86),    # اسمع وش تقول الدراسات!
    ("s1", 0.02, 4.95, 4.09),     # تحسب لازم حديد عشان تبني عضل؟ العلم يقول: لا!
    ("s2", 0.02, 9.60, 7.44),     # دراسة يابانية قارنت الضغط بالبنش برس…
    ("s3", 0.02, 17.55, 7.50),    # والسر مو في التمرين… السر في التدرّج…
    ("s4", 0.02, 25.50, 4.95),    # وكل عضلة تحتاج عشر مجموعات بالأسبوع أو أكثر…
    ("s5", 0.02, 30.90, 6.38),    # وبروتينك اليومي؟ واحد فاصلة ستة غرام لكل كيلو…
    ("s6", 0.02, 37.75, 3.02),    # المعلومة سهلة… التطبيق هو الصعب.
    ("s7", 0.02, 41.20, 6.77),    # في RESHAPE نرتّبها لك كلها… reshape-online.com
]


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
speech = []
for take, s0, at, s1 in LINES:
    x = decode(f"audio-src/study/{take}.mp3")
    x = sos("highpass", 70, x)
    x = x / (np.sqrt(np.mean(x[int(s0 * SR):int(s1 * SR)] ** 2)) + 1e-9) * 0.08      # level the takes against each other
    fade = int(0.01 * SR)
    x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
    place(vo, x, at - s0)
    speech.append((at, at - s0 + s1))
vo *= 0.9 / np.abs(vo).max()

# ---------------------------------------------------------------- sfx
def wav(name):
    x, sr = sf.read(f"public/ad/sfx/{name}.wav")
    assert sr == SR
    return x.mean(axis=1) if x.ndim > 1 else x

sfx = np.zeros(N)
for at, name, g in [(4.66, "whoosh1", 0.35), (8.55, "tap", 0.4), (9.16, "whoosh2", 0.4), (17.3, "tap", 0.35), (21.0, "tap", 0.3),
                    (22.3, "tap", 0.3), (25.3, "tap", 0.35), (30.7, "tap", 0.35), (37.1, "whoosh1", 0.3), (40.86, "whoosh2", 0.4),
                    (41.3, "logo_hit", 0.5)]:
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
os.makedirs("public/audio/study", exist_ok=True)
sf.write("public/audio/study/mix.wav", stereo, SR, subtype="PCM_24")
sf.write("public/audio/study/vo.wav", np.stack([vo, vo], axis=1), SR, subtype="PCM_24")
