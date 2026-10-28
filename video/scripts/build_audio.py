"""Build the RESHAPE commercial soundtrack.

Outputs (48 kHz, 24-bit stereo WAV, all exactly 35.0 s and sample-aligned):
  public/audio/vo.wav     - Saudi Arabic voice-over, cut from the approved ElevenLabs takes
  public/audio/music.wav  - original score, synthesised here from scratch (no samples, no
                            third-party music), ducked under the voice
  public/audio/sfx.wav    - impacts, whooshes, text accents (also synthesised here)
  src/lib/timeline.json   - scene cuts + VO word timings that drive the typography and SRT

Remotion plays the three stems at volume 1; their sum is the loudness-normalised mix
(-14 LUFS integrated, peaks limited to -1 dBFS).

Usage: python3 scripts/build_audio.py   (run from the video/ folder)
"""

import json
import subprocess

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d

SR = 48000
DUR = 35.0
N = int(SR * DUR)
BPM = 120
BEAT = 60 / BPM  # 0.5 s
BAR = 4 * BEAT  # 2.0 s
RNG = np.random.default_rng(7)

# ----------------------------------------------------------------------------------------
# Edit decision list for the voice-over.
# Source word times come from a blind ElevenLabs Scribe transcription of each take.
# "at" = where the first word of the line lands on the 35 s timeline.
# ----------------------------------------------------------------------------------------
TAKE_A = "audio-src/vo_full_take_saadoun_A.mp3"
LINE3 = "audio-src/vo_line3_group_alt_B.mp3"
LINE5 = "audio-src/vo_line5_cta_alt_A.mp3"

VO_LINES = [
    {
        "id": "hook",
        "src": TAKE_A,
        "window": (0.0, (4.44, 4.94)),  # cut between the end of تشكيلك and the start of في
        "at": 0.65,
        "words": [
            ("مو", 0.14, 0.26), ("كل", 0.30, 0.46), ("تمرين", 0.50, 0.82), ("يغيّرك…", 0.86, 1.44),
            ("بس", 2.00, 2.18), ("فيه", 2.20, 2.34), ("تمرين…", 2.40, 2.92),
            ("يعيد", 3.36, 3.74), ("تشكيلك.", 3.78, 4.44),
        ],
    },
    {
        "id": "brand",
        "src": TAKE_A,
        "window": ((4.44, 4.94), (10.46, 10.78)),
        "at": 6.15,
        "words": [
            ("في", 4.94, 5.04), ("ريشيب،", 5.08, 5.56), ("كل", 5.82, 6.00), ("حصّة", 6.06, 6.40),
            ("هي", 6.44, 6.56), ("خطوة", 6.62, 6.92), ("جديدة…", 6.98, 7.58),
            ("لقوّتك،", 7.66, 8.46), ("ولياقتك،", 8.50, 9.20), ("وثقتك", 9.40, 9.94), ("بنفسك.", 9.96, 10.46),
        ],
    },
    {
        "id": "group",
        "src": LINE3,
        "window": (0.0, None),
        "at": 12.45,
        "words": [
            ("حصص", 0.10, 0.40), ("جماعية،", 0.44, 1.00), ("أجواء", 1.22, 1.62), ("حماسية،", 1.70, 2.26),
            ("وتحدّي", 2.60, 3.18), ("يخلّيك", 3.20, 3.52), ("تطلع", 3.56, 4.00), ("أفضل", 4.00, 4.44),
            ("من", 4.48, 4.68), ("كل", 4.72, 4.90), ("تمرين.", 4.94, 5.38),
        ],
    },
    {
        "id": "motivation",
        "src": TAKE_A,
        "window": ((15.62, 15.92), (19.10, 19.48)),
        "at": 20.35,
        "words": [
            ("مهما", 15.92, 16.22), ("كان", 16.26, 16.38), ("مستواك…", 16.42, 16.96),
            ("هنا", 17.32, 17.80), ("تبدا", 17.86, 18.10), ("خطوتك", 18.16, 18.56), ("للأفضل.", 18.60, 19.10),
        ],
    },
    {
        "id": "cta",
        "src": LINE5,
        "window": (0.0, None),
        "at": 26.25,
        "trim": 0.5,
        "words": [
            ("ريشيب…", 0.10, 0.54), ("غيّر", 0.94, 1.24), ("أداءك،", 1.30, 1.78), ("وارفع", 2.00, 2.38),
            ("مستواك.", 2.42, 2.96), ("سجّل", 3.58, 3.86), ("الحين،", 3.88, 4.26), ("وخلّ", 4.52, 4.90),
            ("التحدّي", 4.94, 5.40), ("يبدا!", 5.44, 5.74),
        ],
    },
]

# Scene cuts (seconds). The score is written to these bar lines (120 BPM, 2 s bars).
SCENES = [
    {"id": "hook", "start": 0.0, "end": 6.0},
    {"id": "brand", "start": 6.0, "end": 12.0},
    {"id": "group", "start": 12.0, "end": 20.0},
    {"id": "transformation", "start": 20.0, "end": 26.0},
    {"id": "cta", "start": 26.0, "end": 35.0},
]
END_CARD_AT = 29.5
FINAL_HIT = 32.0
# Visual accents the picture cuts to (kept here so picture and sound share one source of truth).
HITS = {"hookSlam": 2.5, "logo": 6.0, "groupDrop": 12.0, "breakdown": 20.0, "drop": 26.0}


# ----------------------------------------------------------------------------------------
# DSP helpers
# ----------------------------------------------------------------------------------------
def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, hz, order=2):
    return signal.sosfilt(signal.butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=2):
    return signal.sosfilt(signal.butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(freq, t, phase=0.0):
    return 2 * ((freq * t + phase) % 1.0) - 1


def place(buf, x, at, gain=1.0, pan=0.0):
    """Add mono x into stereo buf at time `at` with equal-power pan (-1..1)."""
    i = int(round(at * SR))
    if i >= buf.shape[1]:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    n = min(len(x), buf.shape[1] - i)
    a = (pan + 1) * np.pi / 4
    buf[0, i:i + n] += x[:n] * gain * np.cos(a)
    buf[1, i:i + n] += x[:n] * gain * np.sin(a)


def place_st(buf, st, at, gain=1.0):
    i = int(round(at * SR))
    n = min(st.shape[1], buf.shape[1] - i)
    buf[:, i:i + n] += st[:, :n] * gain


def reverb(x, seconds=2.2, tone=5000, width=1.0):
    """Stereo convolution reverb from decaying filtered noise (a synthetic hall)."""
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    decay = np.exp(-tt * 6.9 / seconds)
    irs = []
    for _ in range(2):
        ir = lp(RNG.standard_normal(n), tone) * decay
        ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    l = signal.fftconvolve(x, irs[0])
    r = signal.fftconvolve(x, irs[1]) * width + l * (1 - width)
    return np.vstack([l, r])


def fade(x, fin=0.005, fout=0.02):
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


# ----------------------------------------------------------------------------------------
# Instruments (all synthesised)
# ----------------------------------------------------------------------------------------
def kick(dur=0.45, punch=1.0):
    t = t_axis(dur)
    f = 44 + 120 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(RNG.standard_normal(len(t)), 2500) * np.exp(-t * 400) * 0.35
    return np.tanh((body + click * punch) * 1.6) * 0.9


def sub_boom(dur=3.0, f0=52, f1=30):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 3.0)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    x += lp(RNG.standard_normal(len(t)), 300) * np.exp(-t * 14) * 0.6
    return np.tanh(x * 2.2) * 0.8


def clap(dur=0.35):
    t = t_axis(dur)
    n = bp(RNG.standard_normal(len(t)), 900, 7000)
    env = np.zeros_like(t)
    for k, d in enumerate([0.0, 0.011, 0.022]):
        e = np.exp(-np.clip(t - d, 0, None) * (90 if k < 2 else 18))
        e[t < d] = 0
        env = np.maximum(env, e)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 35) * 0.35
    return (n * env + tone) * 0.55


def hat(open_=False):
    dur = 0.22 if open_ else 0.05
    t = t_axis(dur)
    x = hp(RNG.standard_normal(len(t)), 7500, 4) * np.exp(-t * (14 if open_ else 95))
    return x * 0.28


def tom(m=45, dur=0.6):
    t = t_axis(dur)
    f = mtof(m) * (1 + 0.6 * np.exp(-t * 25))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    x += lp(RNG.standard_normal(len(t)), 900) * np.exp(-t * 40) * 0.3
    return np.tanh(x * 1.3) * 0.7


def taiko(dur=1.2):
    t = t_axis(dur)
    f = 62 * (1 + 0.5 * np.exp(-t * 18))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    x += lp(RNG.standard_normal(len(t)), 600) * np.exp(-t * 22) * 0.7
    return np.tanh(x * 1.8) * 0.85


def crash(dur=2.5):
    t = t_axis(dur)
    x = hp(RNG.standard_normal(len(t)), 4000, 2) * np.exp(-t * 1.6)
    x += bp(RNG.standard_normal(len(t)), 2500, 9000) * np.exp(-t * 9) * 0.6
    return x * 0.2


def supersaw(m, dur, t0=0.0, voices=7, detune=0.12):
    t = t_axis(dur) + t0
    x = np.zeros(len(t))
    for v in range(voices):
        cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune * 100
        x += saw(mtof(m) * 2 ** (cents / 1200), t, phase=RNG.random())
    return x / voices


def pad(chord, dur, cutoff=1400, attack=0.8, release=0.8):
    x = sum(supersaw(m, dur) for m in chord) / len(chord)
    x = lp(x, cutoff, 2)
    env = np.ones(len(x))
    a, r = int(attack * SR), int(release * SR)
    env[:a] = np.linspace(0, 1, a) ** 1.5
    env[-r:] *= np.linspace(1, 0, r)
    return x * env


def bass_note(m, dur, cutoff=260):
    t = t_axis(dur)
    x = 0.6 * saw(mtof(m), t) + 0.5 * np.sin(2 * np.pi * mtof(m) * t)
    x = lp(x, cutoff, 3)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 2.2)
    return np.tanh(x * env * 1.8) * 0.6


def pluck(m, dur=0.35):
    t = t_axis(dur)
    x = saw(mtof(m), t) + 0.5 * saw(mtof(m) * 1.003, t)
    cutoff_env = 400 + 4200 * np.exp(-t * 18)
    # time-varying lowpass approximated with a short filter bank crossfade
    lo, hi = lp(x, 500), lp(x, 4200)
    mix = (cutoff_env - 400) / 4200
    x = lo * (1 - mix) + hi * mix
    return x * np.exp(-t * 9) * 0.25


def bell(m, dur=1.8):
    t = t_axis(dur)
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 3)
         + 0.18 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 5))
    return x * np.exp(-t * 2.2) * np.minimum(1, t / 0.003) * 0.22


def braam(root=26, dur=3.0):
    t = t_axis(dur)
    x = np.zeros(len(t))
    for m, g in [(root, 1.0), (root + 12, 0.7), (root + 7 + 12, 0.45), (root + 24, 0.25)]:
        for d in (-0.08, 0.0, 0.08):
            x += saw(mtof(m) * 2 ** (d / 12), t, RNG.random()) * g
    cutoff = 180 + 1800 * np.clip(t / 0.35, 0, 1) * np.exp(-np.clip(t - 0.35, 0, None) * 1.2)
    lo, hi = lp(x, 200, 2), lp(x, 2000, 2)
    mix = np.clip((cutoff - 180) / 1800, 0, 1)
    x = lo * (1 - mix) + hi * mix
    env = np.minimum(1, t / 0.02) * np.exp(-t * 1.1)
    return np.tanh(x * env * 0.5) * 0.7


def riser(dur=2.0, f0=250, f1=7000):
    t = t_axis(dur)
    out = np.zeros(len(t))
    noise = RNG.standard_normal(len(t))
    steps = 24
    edges = np.linspace(0, len(t), steps + 1).astype(int)
    for k in range(steps):
        c = f0 * (f1 / f0) ** (k / (steps - 1))
        seg = bp(noise, max(40, c * 0.7), min(SR / 2 - 100, c * 1.4))[edges[k]:edges[k + 1]]
        out[edges[k]:edges[k + 1]] = seg
    tone_f = 110 * 2 ** (np.linspace(0, 2.5, len(t)))
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * 0.15
    env = (t / dur) ** 2.2
    return (out * 0.5 + tone) * env * 0.6


def whoosh(dur=0.7, up=True):
    t = t_axis(dur)
    noise = RNG.standard_normal(len(t))
    steps = 16
    edges = np.linspace(0, len(t), steps + 1).astype(int)
    out = np.zeros(len(t))
    for k in range(steps):
        p = k / (steps - 1)
        c = 300 * (12 if up else 1) ** p if up else 4000 * (0.1) ** p
        out[edges[k]:edges[k + 1]] = bp(noise, max(60, c * 0.6), min(20000, c * 1.6))[edges[k]:edges[k + 1]]
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return out * env * 0.5


def metal_slam(dur=2.2):
    """Barbell/plate impact: inharmonic metal partials + floor thump + crack."""
    t = t_axis(dur)
    x = np.zeros(len(t))
    for ratio, decay, g in [(1.0, 4, 0.5), (2.76, 6, 0.35), (5.40, 9, 0.25), (8.93, 14, 0.15), (13.3, 20, 0.08)]:
        x += np.sin(2 * np.pi * 180 * ratio * t + RNG.random() * 6) * np.exp(-t * decay) * g
    thump = np.sin(2 * np.pi * np.cumsum(55 * (1 + 1.2 * np.exp(-t * 30))) / SR) * np.exp(-t * 5)
    crack = hp(RNG.standard_normal(len(t)), 1500) * np.exp(-t * 60) * 0.6
    return np.tanh((x * 0.6 + thump + crack) * 1.4) * 0.7


def tick(freq=1800):
    t = t_axis(0.09)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t * 60) + hp(RNG.standard_normal(len(t)), 3000) * np.exp(-t * 200) * 0.4
    return x * 0.3


def reverse_swell(dur=1.2):
    t = t_axis(dur)
    x = (crash(dur)[::-1] * 3 + lp(RNG.standard_normal(len(t)), 2000)[::-1] * 0.15) * (t / dur) ** 3
    return x


# ----------------------------------------------------------------------------------------
# Voice-over
# ----------------------------------------------------------------------------------------
def min_energy_time(x, a, b):
    """Quietest 10 ms point between a and b (seconds) - where a cut is inaudible."""
    i0, i1 = int(a * SR), int(b * SR)
    hop = int(0.005 * SR)
    win = int(0.010 * SR)
    best, best_t = 1e9, (a + b) / 2
    for i in range(i0, max(i0 + 1, i1 - win), hop):
        e = np.mean(x[i:i + win] ** 2)
        if e < best:
            best, best_t = e, (i + win / 2) / SR
    return best_t


LINE_METER = pyloudnorm.Meter(SR, block_size=0.4)


def build_vo():
    vo = np.zeros((2, N))
    srcs = {}
    words_out = []
    lines_out = []
    for line in VO_LINES:
        x = srcs.setdefault(line["src"], decode(line["src"]))
        w0, w1 = line["window"]
        s = w0 if not isinstance(w0, tuple) else min_energy_time(x, *w0)
        e = len(x) / SR if w1 is None else min_energy_time(x, *w1)
        seg = fade(x[int(s * SR):int(e * SR)], 0.008, 0.04)
        # even out line-to-line loudness (the takes come from separate generations)
        seg = seg * 10 ** ((-18.0 + line.get("trim", 0.0) - LINE_METER.integrated_loudness(seg)) / 20)
        first = line["words"][0][1]
        offset = line["at"] - first  # timeline = source + offset
        place(vo, seg, s + offset)
        lw = [{"text": w, "start": round(a + offset, 3), "end": round(b + offset, 3)} for w, a, b in line["words"]]
        words_out += lw
        lines_out.append({"id": line["id"], "start": lw[0]["start"], "end": lw[-1]["end"],
                          "text": " ".join(w["text"] for w in lw)})
    # gentle broadcast polish: high-pass rumble, presence lift, light compression
    for ch in range(2):
        y = hp(vo[ch], 70)
        y = y + 0.18 * bp(y, 2500, 6000)
        vo[ch] = y
    env = np.sqrt(lp(vo[0] ** 2, 12) .clip(1e-12))
    thr = np.percentile(env[env > 1e-4], 70)
    gain = np.where(env > thr, (thr / env) ** 0.35, 1.0)
    vo *= gain
    return vo, words_out, lines_out


# ----------------------------------------------------------------------------------------
# Score: D minor, i - VI - III - VII (Dm - Bb - F - C), 120 BPM, bars every 2 s
# ----------------------------------------------------------------------------------------
PROG = [
    {"root": 38, "pad": [50, 53, 57, 62]},  # Dm
    {"root": 34, "pad": [50, 53, 58, 62]},  # Bb
    {"root": 41, "pad": [48, 53, 57, 60]},  # F
    {"root": 36, "pad": [48, 52, 55, 60]},  # C
]
ARP = [0, 7, 12, 15, 12, 7, 3, 7]


def chord_at(bar):
    return PROG[bar % 4]


def build_music():
    m = np.zeros((2, N))
    drums = np.zeros((2, N))
    k = kick()

    # --- 0-6 s: the hook. Black screen boom, low drone, slam at 2.5, riser into the brand reveal
    place(m, sub_boom(3.5), 0.0, 1.0)
    place(m, taiko(), 0.0, 0.8)
    place(m, lp(pad([38, 45, 50], 6.2, cutoff=500, attack=1.5, release=1.0), 600), 0.0, 0.55, -0.1)
    place(m, lp(pad([38, 45, 50], 6.2, cutoff=500, attack=1.5, release=1.0), 600), 0.0, 0.55, 0.1)
    place(m, sub_boom(2.8, 60, 34), HITS["hookSlam"], 0.85)
    place(m, taiko(), HITS["hookSlam"], 0.7)
    for t in (4.0, 4.5, 5.0, 5.25, 5.5, 5.625, 5.75, 5.875):
        place(drums, taiko(0.6), t, 0.32 + 0.06 * (t - 4))
    place(m, riser(2.0), 4.0, 0.55)
    place(m, reverse_swell(1.2), 4.8, 0.7)

    # --- 6-12 s: brand. Beat enters on the logo
    def groove(start, bars, hats16=False, clap_gain=0.55, kick_gain=0.95, four=False):
        for b in range(bars):
            t0 = start + b * BAR
            kicks = [0, 1, 2, 3] if four else [0, 0.75, 2, 2.5]
            for q in kicks:
                place(drums, k, t0 + q * BEAT, kick_gain)
            for q in (1, 3):
                place(drums, clap(), t0 + q * BEAT, clap_gain, 0.05)
            step = BEAT / 4 if hats16 else BEAT / 2
            for i in range(int(BAR / step)):
                acc = 1.0 if i % (4 if hats16 else 2) == 2 else 0.55
                place(drums, hat(open_=(i % 8 == 6 and not hats16)), t0 + i * step, 0.5 * acc, 0.25 if i % 2 else -0.25)

    def bassline(start, bars, gain=0.85, eighths=True):
        for b in range(bars):
            c = chord_at(b)
            t0 = start + b * BAR
            if eighths:
                for i in range(8):
                    place(m, bass_note(c["root"] + (12 if i in (3, 7) else 0), BEAT / 2 * 0.95), t0 + i * BEAT / 2, gain)
            else:
                place(m, bass_note(c["root"], BAR, cutoff=180), t0, gain)

    def pads(start, bars, cutoff, gain, attack=0.4):
        for b in range(bars):
            c = chord_at(b)
            for pan in (-0.35, 0.35):
                place(m, pad(c["pad"], BAR + 0.3, cutoff, attack, 0.35), start + b * BAR, gain, pan)

    place(m, braam(26, 3.0), 6.0, 0.55)
    place(m, crash(), 6.0, 0.8)
    groove(6.0, 3)
    bassline(6.0, 3, 0.7)
    pads(6.0, 3, 900, 0.32)

    # --- 12-20 s: group training. Full groove, 16th hats, arpeggio, fill into the breakdown
    place(m, crash(), 12.0, 0.9)
    place(m, sub_boom(1.5, 70, 40), 12.0, 0.45)
    groove(12.0, 4, hats16=True, clap_gain=0.62)
    bassline(12.0, 4, 0.85)
    pads(12.0, 4, 1500, 0.3)
    for b in range(4):
        c = chord_at(b)
        for i in range(16):
            n = c["pad"][0] + 12 + ARP[i % 8]
            place(m, pluck(n), 12.0 + b * BAR + i * BEAT / 4, 0.55 if i % 4 == 0 else 0.38, (-0.4, 0.4)[i % 2])
    place(m, crash(), 16.0, 0.6)
    for i, tt in enumerate(np.arange(19.0, 20.0, BEAT / 4)):
        place(drums, tom(50 - i, 0.4), tt, 0.38, (-0.5 + i / 8))
    place(m, whoosh(0.8), 19.3, 0.5)

    # --- 20-26 s: transformation. Breakdown, warm pads, bell motif, build from 24 s
    place(m, sub_boom(2.5, 48, 30), 20.0, 0.6)
    place(m, reverse_swell(0.9), 19.15, 0.5)
    for b in range(3):
        c = chord_at(b)
        for pan in (-0.5, 0.5):
            place(m, pad([n + 12 for n in c["pad"]], BAR + 0.6, 2400, 0.5, 0.25, ), 20.0 + b * BAR, 0.36, pan)
            place(m, pad(c["pad"], BAR + 0.6, 1100, 0.6, 0.5), 20.0 + b * BAR, 0.3, -pan)
        place(m, bass_note(c["root"], BAR, cutoff=160), 20.0 + b * BAR, 0.75)
        place(drums, k, 20.0 + b * BAR, 0.55)
    melody = [(74, 20.0), (72, 20.75), (69, 21.0), (70, 22.0), (69, 22.75), (65, 23.0), (69, 24.0), (67, 24.75), (72, 25.0)]
    for n, tt in melody:
        place(m, bell(n), tt, 0.6, 0.15)
    # snare/clap roll accelerating into the drop + quarter kicks
    roll = list(np.arange(24.0, 25.0, BEAT / 2)) + list(np.arange(25.0, 25.5, BEAT / 4)) + list(np.arange(25.5, 25.85, BEAT / 8))
    for i, tt in enumerate(roll):
        place(drums, clap(0.2), tt, 0.18 + 0.4 * i / len(roll), 0.1)
    for tt in np.arange(24.0, 25.85, BEAT):
        place(drums, k, tt, 0.75)
    place(m, riser(1.9, 200, 9000), 24.0, 0.7)

    # --- 26-35 s: climax and branded finish
    place(m, braam(26, 3.2), 26.0, 0.75)
    place(m, sub_boom(2.5, 60, 32), 26.0, 0.8)
    place(m, crash(), 26.0, 1.0)
    groove(26.0, 3, hats16=True, clap_gain=0.66, four=True)
    bassline(26.0, 3, 0.9)
    pads(26.0, 3, 2200, 0.34)
    for b in range(3):
        c = chord_at(b)
        for i in range(16):
            place(m, pluck(c["pad"][0] + 12 + ARP[i % 8]), 26.0 + b * BAR + i * BEAT / 4, 0.45, (-0.4, 0.4)[i % 2])
    place(m, braam(31, 2.0), END_CARD_AT, 0.4)
    # final hit: everything lands on the last word, then rings out under the end card
    place(m, braam(26, 4.5), FINAL_HIT, 0.85)
    place(m, sub_boom(3.5, 58, 28), FINAL_HIT, 0.95)
    place(m, crash(3.0), FINAL_HIT, 1.0)
    place(m, taiko(), FINAL_HIT, 0.8)
    for pan in (-0.4, 0.4):
        place(m, pad([50, 57, 62, 65, 69], 3.0, 1800, 0.05, 2.4), FINAL_HIT, 0.32, pan)

    # drums glue: parallel saturation, then sidechain the tonal bed to the kick pattern
    drums = np.tanh(drums * 1.3) / 1.3
    kick_env = np.zeros(N)
    for tt in np.arange(6.0, 12.0, BAR):
        for q in (0, 0.75, 2, 2.5):
            kick_env[int((tt + q * BEAT) * SR)] = 1
    for tt in np.arange(12.0, 20.0, BAR):
        for q in (0, 0.75, 2, 2.5):
            kick_env[int((tt + q * BEAT) * SR)] = 1
    for tt in np.arange(26.0, 32.0, BEAT):
        kick_env[int(tt * SR)] = 1
    duck = signal.lfilter([1], [1, -np.exp(-1 / (0.09 * SR))], kick_env)
    duck = 1 - 0.45 * np.clip(duck, 0, 1)
    m *= duck

    wet = reverb((m[0] + m[1]) * 0.5, 2.4, 4500)[:, :N]
    out = m + drums + 0.22 * wet
    return out


def build_sfx():
    s = np.zeros((2, N))
    place(s, metal_slam(), HITS["hookSlam"], 0.75)
    for tt, up in [(5.75, True), (11.7, True), (19.65, False), (25.55, True), (END_CARD_AT - 0.35, True)]:
        place(s, whoosh(0.75, up), tt, 0.55, -0.3)
        place(s, whoosh(0.75, up), tt + 0.02, 0.55, 0.3)
    # text-reveal accents (these times match the typography in src/scenes)
    for tt, f in [(0.65, 1500), (1.5, 2100), (6.0, 1300), (8.0, 1700), (9.0, 1900), (10.1, 2100),
                  (12.45, 1600), (13.65, 1800), (15.05, 2000), (20.35, 1500), (22.0, 1800),
                  (END_CARD_AT, 1400), (29.83, 1900), (30.6, 2200)]:
        place(s, tick(f), tt, 0.6, 0.0)
    for tt in (12.0, 26.0):
        place(s, metal_slam(1.6), tt, 0.35)
    place(s, metal_slam(2.6), FINAL_HIT, 0.5)
    wet = reverb((s[0] + s[1]) * 0.5, 1.6, 6000)[:, :N]
    return s + 0.25 * wet


# ----------------------------------------------------------------------------------------
# Mix
# ----------------------------------------------------------------------------------------
def env_follow(x, attack=0.02, release=0.3):
    """Envelope follower: fast one-pole for the attack, slow one-pole for the release."""
    rect = np.abs(x)
    a, r = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    slow = signal.lfilter([1 - r], [1, -r], rect)
    fast = signal.lfilter([1 - a], [1, -a], rect)
    return np.maximum(slow, fast * 0.8)


def main():
    vo, words, lines = build_vo()
    music = build_music()
    sfx = build_sfx()

    # level the stems before ducking
    meter = pyloudnorm.Meter(SR)
    def gain_to(x, target):
        return 10 ** ((target - meter.integrated_loudness(x.T)) / 20)
    vo *= gain_to(vo, -16.0)
    music *= gain_to(music, -20.0)
    sfx *= gain_to(sfx, -24.0)

    # duck music (-9 dB) and sfx (-3 dB) under the voice
    v = env_follow(vo[0], 0.015, 0.35)
    v = np.clip(v / (np.percentile(v[v > 1e-5], 90) + 1e-9), 0, 1)
    music *= 1 - (1 - 10 ** (-9 / 20)) * v
    sfx *= 1 - (1 - 10 ** (-3 / 20)) * v

    # fade the very end
    tail = int(1.2 * SR)
    fade_out = np.ones(N)
    fade_out[-tail:] = np.linspace(1, 0, tail) ** 1.5
    music *= fade_out
    sfx *= fade_out

    mix = vo + music + sfx
    g = gain_to(mix, -14.0)
    vo, music, sfx, mix = vo * g, music * g, sfx * g, mix * g

    # linked true-peak limiter (-1.5 dBTP, peaks measured 4x oversampled so the AAC encode
    # cannot overshoot to 0 dBFS); the same gain curve is applied to every stem
    ceiling = 10 ** (-1.5 / 20)
    up = signal.resample_poly(mix, 4, 1, axis=1)
    peak = np.max(np.abs(up), axis=0)[: N * 4].reshape(N, 4).max(axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    look = int(0.005 * SR)
    # smooth gain reduction: 5 ms look-ahead (min-filter), 80 ms release
    need = minimum_filter1d(need, size=2 * look + 1)
    rel = np.exp(-1 / (0.08 * SR))
    smooth = signal.lfilter([1 - rel], [1, -rel], need - 1) + 1
    gr = np.minimum(need, smooth)
    vo, music, sfx = vo * gr, music * gr, sfx * gr
    mix = vo + music + sfx

    print(f"mix loudness {meter.integrated_loudness(mix.T):.1f} LUFS, peak {20*np.log10(np.abs(mix).max()):.2f} dBFS")
    for name, x in [("vo", vo), ("music", music), ("sfx", sfx)]:
        sf.write(f"public/audio/{name}.wav", x.T, SR, subtype="PCM_24")
    sf.write("out/RESHAPE_mix_reference.wav", mix.T, SR, subtype="PCM_24")

    timeline = {
        "fps": 30,
        "durationSeconds": DUR,
        "bpm": BPM,
        "scenes": SCENES,
        "endCardAt": END_CARD_AT,
        "finalHit": FINAL_HIT,
        "hits": HITS,
        "voLines": lines,
        "words": words,
    }
    with open("src/lib/timeline.json", "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False, indent=1)
    print(json.dumps(lines, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
