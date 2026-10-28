"""Soundtrack for the motion-graphics version: voice-over + a few restrained SFX. NO MUSIC.

Outputs (48 kHz / 24-bit stereo, 35.0 s, sample-aligned):
  public/audio/motion/vo.wav    - Saudi Arabic VO with the corrected RESHAPE pronunciation
  public/audio/motion/sfx.wav   - 8 non-musical accents (soft whooshes / impacts), nothing tonal
  src/motion/timeline.json      - scene cuts + every VO word time (drives type + SRT)
  out/RESHAPE_Motion_mix_reference.wav

The brand name is spoken "ree-SHAYP" /riːˈʃeɪp/: lines 2 and 5 were regenerated from the IPA
spelling and verified acoustically (scripts/vowel_probe.py) and by blind transcription.

Usage: python3 scripts/build_motion_audio.py   (from video/)
"""

import json

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d

from build_audio import (LINE3, SR, TAKE_A, bp, decode, fade, hp, lp, min_energy_time, place,
                         reverb, t_axis)

DUR = 35.0
N = int(SR * DUR)
RNG = np.random.default_rng(11)

BRAND = "audio-src/vo_line2_brand_ipa_A.mp3"  # "[confident] في /riːˈʃeɪp/، كل حصّة ..."
CTA = "audio-src/vo_line5_cta_ipa_A.mp3"  # "[confident] /riːˈʃeɪp/… غيّر أداءك ..."

# Word times are from blind ElevenLabs Scribe transcriptions of each source take.
VO_LINES = [
    {"id": "hook", "src": TAKE_A, "window": (0.0, (4.44, 4.94)), "at": 0.6, "words": [
        ("مو", 0.14, 0.26), ("كل", 0.30, 0.46), ("تمرين", 0.50, 0.82), ("يغيّرك…", 0.86, 1.44),
        ("بس", 2.00, 2.18), ("فيه", 2.20, 2.34), ("تمرين…", 2.40, 2.92), ("يعيد", 3.36, 3.74), ("تشكيلك.", 3.78, 4.44)]},
    {"id": "brand", "src": BRAND, "window": (0.0, None), "at": 6.1, "words": [
        ("في", 0.12, 0.26), ("RESHAPE،", 0.30, 0.70), ("كل", 1.24, 1.44), ("حصّة", 1.50, 1.86), ("هي", 1.90, 2.10),
        ("خطوة", 2.16, 2.46), ("جديدة…", 2.50, 2.90), ("لقوّتك،", 3.24, 4.08), ("ولياقتك،", 4.14, 4.88),
        ("وثقتك", 5.22, 5.82), ("بنفسك.", 5.86, 6.38)]},
    {"id": "group", "src": LINE3, "window": (0.0, None), "at": 13.5, "words": [
        ("حصص", 0.10, 0.40), ("جماعية،", 0.44, 1.00), ("أجواء", 1.22, 1.62), ("حماسية،", 1.70, 2.26),
        ("وتحدّي", 2.60, 3.18), ("يخلّيك", 3.20, 3.52), ("تطلع", 3.56, 4.00), ("أفضل", 4.00, 4.44),
        ("من", 4.48, 4.68), ("كل", 4.72, 4.90), ("تمرين.", 4.94, 5.38)]},
    {"id": "motivation", "src": TAKE_A, "window": ((15.62, 15.92), (19.10, 19.48)), "at": 20.2, "words": [
        ("مهما", 15.92, 16.22), ("كان", 16.26, 16.38), ("مستواك…", 16.42, 16.96),
        ("هنا", 17.32, 17.80), ("تبدا", 17.86, 18.10), ("خطوتك", 18.16, 18.56), ("للأفضل.", 18.60, 19.10)]},
    {"id": "cta", "src": CTA, "window": (0.0, None), "at": 25.2, "words": [
        ("RESHAPE…", 0.14, 0.70), ("غيّر", 1.16, 1.46), ("أداءك،", 1.50, 2.00), ("وارفع", 2.30, 2.66),
        ("مستواك.", 2.70, 3.24), ("سجّل", 3.86, 4.16), ("الحين،", 4.20, 4.56), ("وخلّ", 4.84, 5.26),
        ("التحدّي", 5.26, 5.76), ("يبدا!", 5.80, 6.14)]},
]

SCENES = [
    {"id": "hook", "start": 0.0, "end": 5.5},
    {"id": "brand", "start": 5.5, "end": 12.9},
    {"id": "group", "start": 12.9, "end": 19.7},
    {"id": "transformation", "start": 19.7, "end": 24.7},
    {"id": "cta", "start": 24.7, "end": 35.0},
]
END_CARD_AT = 28.75  # the end card is built as the VO says "سجّل"
LOGO_HIT = 6.0


def soft_whoosh(dur=0.6):
    """Air whoosh: band-passed noise with a rising-then-falling centre. Non-tonal."""
    t = t_axis(dur)
    noise = RNG.standard_normal(len(t))
    steps = 14
    edges = np.linspace(0, len(t), steps + 1).astype(int)
    out = np.zeros(len(t))
    for k in range(steps):
        p = k / (steps - 1)
        c = 500 + 2600 * np.sin(np.pi * p)
        out[edges[k]:edges[k + 1]] = bp(noise, c * 0.55, min(18000, c * 1.7))[edges[k]:edges[k + 1]]
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2.5
    return out * env * 0.5


def soft_impact(dur=0.7):
    """Restrained low thud: low-passed noise burst with a quick decay (no pitched sine)."""
    t = t_axis(dur)
    body = lp(RNG.standard_normal(len(t)), 140, 4) * np.exp(-t * 9)
    snap = hp(RNG.standard_normal(len(t)), 1800) * np.exp(-t * 90) * 0.12
    return np.tanh((body * 3.0 + snap) * 1.2) * 0.6


def build_vo():
    meter = pyloudnorm.Meter(SR, block_size=0.4)
    vo = np.zeros((2, N))
    srcs, words_out, lines_out = {}, [], []
    for line in VO_LINES:
        x = srcs.setdefault(line["src"], decode(line["src"]))
        w0, w1 = line["window"]
        s = w0 if not isinstance(w0, tuple) else min_energy_time(x, *w0)
        e = len(x) / SR if w1 is None else min_energy_time(x, *w1)
        seg = fade(x[int(s * SR):int(e * SR)], 0.008, 0.05)
        seg = seg * 10 ** ((-18.0 - meter.integrated_loudness(seg)) / 20)
        offset = line["at"] - line["words"][0][1]
        place(vo, seg, s + offset)
        lw = [{"text": w, "start": round(a + offset, 3), "end": round(b + offset, 3)} for w, a, b in line["words"]]
        words_out += lw
        lines_out.append({"id": line["id"], "start": lw[0]["start"], "end": lw[-1]["end"], "text": " ".join(w["text"] for w in lw)})
    # light, transparent polish only: rumble high-pass + gentle leveling (no echo / reverb / bass boost)
    for ch in range(2):
        vo[ch] = hp(vo[ch], 70)
    env = np.sqrt(lp(vo[0] ** 2, 12).clip(1e-12))
    thr = np.percentile(env[env > 1e-4], 70)
    vo *= np.where(env > thr, (thr / env) ** 0.3, 1.0)
    return vo, words_out, lines_out


def build_sfx():
    s = np.zeros((2, N))
    place(s, soft_impact(), 0.0, 0.8)
    for cut in (5.5, 12.9, 19.7, 24.7):
        place(s, soft_whoosh(0.65), cut - 0.38, 0.5, -0.25)
        place(s, soft_whoosh(0.65), cut - 0.36, 0.5, 0.25)
    place(s, soft_impact(0.9), LOGO_HIT, 0.75)
    place(s, soft_impact(0.9), END_CARD_AT, 0.7)
    wet = reverb((s[0] + s[1]) * 0.5, 1.2, 5000)[:, :N]
    return s + 0.12 * wet


def main():
    meter = pyloudnorm.Meter(SR)
    vo, words, lines = build_vo()
    sfx = build_sfx()
    vo *= 10 ** ((-15.0 - meter.integrated_loudness(vo.T)) / 20)
    sfx *= 10 ** ((-27.0 - meter.integrated_loudness(sfx.T)) / 20)
    mix = vo + sfx
    g = 10 ** ((-14.0 - meter.integrated_loudness(mix.T)) / 20)
    vo, sfx, mix = vo * g, sfx * g, mix * g
    # linked true-peak limiter, -1.5 dBTP (4x oversampled peak detection)
    ceiling = 10 ** (-1.5 / 20)
    up = signal.resample_poly(mix, 4, 1, axis=1)
    peak = np.max(np.abs(up), axis=0)[: N * 4].reshape(N, 4).max(axis=1)
    need = minimum_filter1d(np.minimum(1.0, ceiling / np.maximum(peak, 1e-9)), size=2 * int(0.005 * SR) + 1)
    rel = np.exp(-1 / (0.08 * SR))
    gr = np.minimum(need, signal.lfilter([1 - rel], [1, -rel], need - 1) + 1)
    vo, sfx = vo * gr, sfx * gr
    mix = vo + sfx
    print(f"mix {meter.integrated_loudness(mix.T):.1f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS")
    sf.write("public/audio/motion/vo.wav", vo.T, SR, subtype="PCM_24")
    sf.write("public/audio/motion/sfx.wav", sfx.T, SR, subtype="PCM_24")
    sf.write("out/RESHAPE_Motion_mix_reference.wav", mix.T, SR, subtype="PCM_24")
    with open("src/motion/timeline.json", "w", encoding="utf-8") as f:
        json.dump({"fps": 30, "durationSeconds": DUR, "scenes": SCENES, "endCardAt": END_CARD_AT,
                   "logoHit": LOGO_HIT, "voLines": lines, "words": words}, f, ensure_ascii=False, indent=1)
    for l in lines:
        print(f"{l['id']:14s} {l['start']:6.2f}-{l['end']:6.2f}  {l['text']}")


if __name__ == "__main__":
    main()
