"""Acoustic check of how a TTS take pronounces the brand name (and calibration vowels).

For a word segment it finds the /ʃ/ (the "sh": unvoiced, energy concentrated above 2.5 kHz),
then measures the vowel right after it (the "SHAYP" vowel): duration and F1/F2 at 20/50/80 %.
  /iː/ (ريشيب "sheeb") -> low F1 (~250-330 Hz), high F2
  /eː~eɪ/ ("shape")    -> mid F1 (~380-520 Hz), F1 falling / F2 rising if diphthongal
  /aː/ (ريشاب "shaab") -> high F1 (~600+ Hz), low F2
Usage: python3 vowel_probe.py <audio> <start> <end> [label]   (or import measure())
"""
import subprocess, sys
import numpy as np
import parselmouth

SR = 24000


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def frames(x, hop=0.005, win=0.02):
    h, w = int(hop * SR), int(win * SR)
    out = []
    for i in range(0, len(x) - w, h):
        seg = x[i:i + w] * np.hanning(w)
        spec = np.abs(np.fft.rfft(seg)) ** 2
        f = np.fft.rfftfreq(w, 1 / SR)
        tot = spec.sum() + 1e-12
        out.append(((i + w / 2) / SR, 10 * np.log10(tot), spec[f > 2500].sum() / tot))
    return np.array(out)


def measure(x, t0, t1, max_formant=5000):
    """Find the longest /ʃ/ in [t0, t1] and measure the vowel that follows it."""
    seg = x[int(t0 * SR):int(t1 * SR)]
    snd = parselmouth.Sound(seg, SR)
    fr = frames(seg)
    db, hf = fr[:, 1], fr[:, 2]
    loud = db > db.max() - 30
    sh = loud & (hf > 0.55)
    idx = np.where(sh)[0]
    if len(idx) == 0:
        return {"error": "no /ʃ/ found"}
    runs, start = [], idx[0]
    for a, b in zip(idx, idx[1:]):
        if b != a + 1:
            runs.append((start, a)); start = b
    runs.append((start, idx[-1]))
    s0, s1 = max(runs, key=lambda r: r[1] - r[0])
    # vowel: from the end of the sh to the silent closure of the final stop (p/b): the level
    # falls >= 20 dB under the vowel peak. Robust for front vowels, whose energy sits high.
    v = s1 + 1
    look = fr[v:v + 50]
    if len(look) < 4:
        return {"error": "no vowel after /ʃ/"}
    peak = look[:, 1].max()
    while v < len(fr) and (db[v] < peak - 10 or hf[v] > 0.85):
        v += 1
    v_end = v
    while v_end < len(fr) and db[v_end] > peak - 20:
        v_end += 1
    if v_end - v < 4:
        return {"error": "vowel too short to measure"}
    vt0, vt1 = fr[v, 0], fr[v_end - 1, 0]
    form = snd.to_formant_burg(time_step=0.005, max_number_of_formants=5, maximum_formant=max_formant)
    def at(p):
        # median over a 20 ms window, robust to single-frame formant-tracker glitches
        ts = vt0 + p * (vt1 - vt0) + np.arange(-0.01, 0.0101, 0.005)
        f1 = np.nanmedian([form.get_value_at_time(1, t) for t in ts])
        f2 = np.nanmedian([form.get_value_at_time(2, t) for t in ts])
        return f1, f2

    pts = {p: at(p) for p in (0.2, 0.5, 0.8)}
    pre = np.where(loud[:s0] & (hf[:s0] < 0.35))[0]
    first = None
    if len(pre) > 3:
        tm = fr[pre[int(len(pre) * 0.6)], 0]
        first = (form.get_value_at_time(1, tm), form.get_value_at_time(2, tm))
    return {
        "sh": (round(t0 + fr[s0, 0], 3), round(t0 + fr[s1, 0], 3)),
        "vowel": (round(t0 + vt0, 3), round(t0 + vt1, 3)),
        "dur_ms": int(round((vt1 - vt0) * 1000)),
        "F1": [int(round(pts[p][0])) for p in (0.2, 0.5, 0.8)],
        "F2": [int(round(pts[p][1])) for p in (0.2, 0.5, 0.8)],
        "first_vowel_F1F2": None if first is None else [int(round(first[0])), int(round(first[1]))],
    }


def vowel_only(x, t0, t1, max_formant=5000):
    """Formants of the steadiest voiced stretch of a short word (calibration words)."""
    seg = x[int(t0 * SR):int(t1 * SR)]
    snd = parselmouth.Sound(seg, SR)
    pitch = snd.to_pitch_ac(time_step=0.005, pitch_floor=60, pitch_ceiling=350)
    form = snd.to_formant_burg(time_step=0.005, max_number_of_formants=5, maximum_formant=max_formant)
    fr = frames(seg)
    voiced = [t for t, db, hf in fr if db > fr[:, 1].max() - 12 and not np.isnan(pitch.get_value_at_time(t)) and pitch.get_value_at_time(t) > 0]
    if not voiced:
        return None
    mid = voiced[len(voiced) // 2]
    return round(form.get_value_at_time(1, mid)), round(form.get_value_at_time(2, mid))


if __name__ == "__main__":
    x = load(sys.argv[1])
    print(sys.argv[4] if len(sys.argv) > 4 else "", measure(x, float(sys.argv[2]), float(sys.argv[3])))


def stress(x, t0, t1):
    """Loudness (dB) and pitch (Hz) of syllable 1 ("ree") vs the SHAYP vowel: ree-SHAYP should
    have the second syllable at least as prominent as the first."""
    m = measure(x, t0, t1)
    if "error" in m:
        return m
    snd = parselmouth.Sound(x, SR)
    pitch = snd.to_pitch_ac(time_step=0.005, pitch_floor=60, pitch_ceiling=350)
    inten = snd.to_intensity(minimum_pitch=75)

    def stats(a, b):
        ts = np.arange(a, b, 0.005)
        db = max(inten.get_value(t) for t in ts)
        f0 = [pitch.get_value_at_time(t) for t in ts]
        f0 = [v for v in f0 if v == v and v > 0]
        return round(db, 1), (round(float(np.median(f0))) if f0 else None)

    s1 = stats(max(t0, m["sh"][0] - 0.16), m["sh"][0])
    s2 = stats(*m["vowel"])
    return {**m, "syl1_dB_F0": s1, "syl2_dB_F0": s2}


def verdict(m):
    """Pass/fail for the brand vowel against the speaker's own /eɪ/ ("shape") calibration."""
    if "error" in m:
        return False, m["error"]
    f1, f2 = m["F1"], m["F2"]
    reasons = []
    if m["dur_ms"] < 110:  # the speaker's own isolated English "Reshape" is ~110 ms
        reasons.append("vowel too short (clipped 'ريشِب')")
    if np.mean(f1) < 340:
        reasons.append("F1 too low ('ee' as in ريشيب)")
    if np.mean(f1) > 620:
        reasons.append("F1 too high ('aa' as in ريشاب)")
    if f2[2] - f2[0] < -120:
        reasons.append("F2 falls (centralising, not the 'ay' glide)")
    if not 1850 <= np.mean(f2) <= 2350:
        reasons.append("F2 outside the 'shape' range")
    return (not reasons), "; ".join(reasons) or "ok: /eɪ/ like the speaker's own 'shape'"
