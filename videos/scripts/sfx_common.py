"""Shared helpers for the RESHAPE SFX pipeline: audio I/O, DSP utilities and objective QA metrics.

All audio is handled as float64 arrays shaped (n_samples, 2) at 48 kHz.
"""
import json
import pathlib
import subprocess

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import maximum_filter, median_filter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SFX = ROOT / "public" / "audio" / "sfx"
TAKES = SFX / "_takes"
SR = 48000


# ----------------------------------------------------------------------------- I/O
def load(path, sr=SR):
    """Load any audio file as float64 (n, 2) at `sr`."""
    path = pathlib.Path(path)
    if path.suffix.lower() in (".wav", ".flac"):
        x, fs = sf.read(str(path), dtype="float64", always_2d=True)
        if fs != sr:
            g = np.gcd(int(fs), int(sr))
            x = signal.resample_poly(x, sr // g, fs // g, axis=0)
    else:
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2",
                            "-af", f"aresample={sr}:resampler=soxr:precision=28", "-"],
                           capture_output=True, check=True)
        x = np.frombuffer(r.stdout, dtype="<f4").astype(np.float64).reshape(-1, 2)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    return x[:, :2]


def save(path, x, sr=SR, subtype="PCM_24"):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fmt = "FLAC" if path.suffix.lower() == ".flac" else "WAV"
    sf.write(str(path), np.asarray(x, dtype=np.float64), sr, subtype=subtype, format=fmt)


def stereo(x):
    x = np.asarray(x, dtype=np.float64)
    return np.stack([x, x], axis=1) if x.ndim == 1 else x


def mono(x):
    return x.mean(axis=1) if x.ndim == 2 else x


def db(v):
    return 20 * np.log10(np.maximum(np.abs(v), 1e-12))


# ----------------------------------------------------------------------------- DSP
def butter(x, kind, freq, order=2, sr=SR):
    sos = signal.butter(order, freq, btype=kind, fs=sr, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def butter_zp(x, kind, freq, order=2, sr=SR):
    """Zero-phase Butterworth (no phase smear on transients)."""
    sos = signal.butter(order, freq, btype=kind, fs=sr, output="sos")
    return signal.sosfiltfilt(sos, x, axis=0)


def declip(x, thr=0.998, max_run=16, ctx=5):
    """Repair short hard-clipped runs by cubic fit through the neighbouring good samples.
    Returns (repaired, n_runs_fixed, n_runs_too_long)."""
    y = x.copy()
    fixed = toolong = 0
    for c in range(y.shape[1]):
        v = y[:, c]
        m = np.abs(v) >= thr
        if not m.any():
            continue
        idx = np.flatnonzero(m)
        starts = idx[np.r_[True, np.diff(idx) > 1]]
        ends = idx[np.r_[np.diff(idx) > 1, True]] + 1
        for s, e in zip(starts, ends):
            if e - s > max_run:
                toolong += 1
                continue
            left = np.arange(max(0, s - ctx), s)
            right = np.arange(e, min(len(v), e + ctx))
            nb = np.r_[left, right]
            nb = nb[np.abs(v[nb]) < thr]
            if len(nb) < 4:
                continue
            p = np.polyfit(nb - s, v[nb], 3)
            est = np.polyval(p, np.arange(s, e) - s)
            sign = np.sign(v[s])
            est = np.where(sign * est > np.abs(v[s:e]), est, v[s:e])
            v[s:e] = est
            fixed += 1
    return y, fixed, toolong


def clip_runs(x, thr=0.998, min_len=2):
    """Count runs of >= min_len consecutive samples at/over full scale (hard clipping)."""
    n = 0
    for c in range(x.shape[1]):
        m = np.abs(x[:, c]) >= thr
        if not m.any():
            continue
        idx = np.flatnonzero(m)
        starts = idx[np.r_[True, np.diff(idx) > 1]]
        ends = idx[np.r_[np.diff(idx) > 1, True]] + 1
        n += int(np.sum((ends - starts) >= min_len))
    return n


def env_rms(x, sr=SR, win_ms=10.0):
    """RMS envelope of the mono mix, same length as x (centered moving window)."""
    m = mono(x) if x.ndim == 2 else x
    w = max(1, int(sr * win_ms / 1000))
    k = np.ones(w) / w
    return np.sqrt(np.convolve(m * m, k, mode="same"))


def onset_index(x, rel_db=-40.0, abs_db=-70.0, sr=SR):
    """First sample where the 2 ms envelope rises above max(peak+rel_db, abs_db)."""
    e = env_rms(x, sr, 2.0)
    thr = max(e.max() * 10 ** (rel_db / 20), 10 ** (abs_db / 20))
    above = np.flatnonzero(e > thr)
    return int(above[0]) if len(above) else 0


def peak_time(x, sr=SR):
    """Time (s) of the loudest transient: maximum of the 10 ms RMS envelope."""
    e = env_rms(x, sr, 10.0)
    return float(np.argmax(e) / sr)


def fade(x, fade_in_s=0.0, fade_out_s=0.0, sr=SR, shape="cos"):
    y = x.copy()
    n = len(y)
    if fade_in_s > 0:
        k = min(n, int(fade_in_s * sr))
        r = np.linspace(0, 1, k)
        g = np.sin(r * np.pi / 2) ** 2 if shape == "cos" else r
        y[:k] *= g[:, None]
    if fade_out_s > 0:
        k = min(n, int(fade_out_s * sr))
        r = np.linspace(1, 0, k)
        g = np.sin(r * np.pi / 2) ** 2 if shape == "cos" else r ** 2
        y[n - k:] *= g[:, None]
    return y


def decomb(x, sr=SR, f0=200.0, nfft=4800, hop=600, thr_db=6.0, extra_lines_hz=(), fmin=150.0,
           target_db=-6.0, keep_hz=(), fmax=None, half=2, nb=(4, 10)):
    """Remove the ElevenLabs decoder artifact: faint narrow lines at exact multiples of f0 (200 Hz =
    the model's 240-sample frame rate; a weaker 50 Hz family also exists). The STFT size puts every
    comb line on an exact bin; in each frame, comb bins (+-`half`) that stick out more than `thr_db`
    above the local floor (median of bins `nb[0]`..`nb[1]` away, i.e. between the lines) are pulled
    down to `target_db` below that floor (below, so the phase-coherent residual does not re-emerge as
    a line in finer analyses). Broadband transient frames are left untouched because the comb bins do
    not stick out there. `extra_lines_hz` adds other stationary lines (e.g. a hum); `keep_hz` protects
    real partials."""
    bpk = int(round(f0 * nfft / sr))
    fmax = fmax or sr / 2
    out = np.empty_like(x)
    for c in range(x.shape[1]):
        f, t, Z = signal.stft(x[:, c], fs=sr, window="hann", nperseg=nfft, noverlap=nfft - hop)
        A = np.abs(Z)
        nbins = A.shape[0]
        G = np.ones_like(A)
        centers = [k * bpk for k in range(1, nbins // bpk + 1) if fmin <= k * f0 <= fmax]
        centers += [int(round(h * nfft / sr)) for h in extra_lines_hz]
        keep = [int(round(h * nfft / sr)) for h in keep_hz]
        tg = 10 ** (target_db / 20)
        for cb in centers:
            if any(abs(cb - kb) <= half + 1 for kb in keep):
                continue
            if cb - nb[1] < 0 or cb + nb[1] >= nbins:
                continue
            neigh = np.r_[cb - nb[1]:cb - nb[0] + 1, cb + nb[0]:cb + nb[1] + 1]
            floor = np.median(A[neigh], axis=0) + 1e-12
            for b in range(cb - half, cb + half + 1):
                ratio = A[b] / floor
                g = np.where(ratio > 10 ** (thr_db / 20), tg * floor / (A[b] + 1e-12), 1.0)
                G[b] = np.minimum(G[b], g)
        _, y = signal.istft(Z * G, fs=sr, window="hann", nperseg=nfft, noverlap=nfft - hop)
        y = y[:len(x)]
        if len(y) < len(x):
            y = np.pad(y, (0, len(x) - len(y)))
        out[:, c] = y
    return out


def el_clean(x):
    """De-whine for an ElevenLabs take: removes the 200 Hz codec comb (the strong, audible one: lines
    +20-30 dB above the floor in quiet tails). The weaker 50 Hz family (+3-5 dB in 100-600 Hz) is left
    alone: notching it on short LF-heavy one-shots changed their envelopes by 2-10 dB (it sits on real
    body modes), which is worse than the artifact."""
    return decomb(x)


def persistent_peaks(x, sr=SR, fmin=80.0, fmax=12000.0, min_med_db=10.0, min_frac=0.7):
    """Narrow spectral peaks that stay >= min_med_db above the local (+-200 Hz, excluding +-30 Hz) median
    in most active frames: candidate whistles / hums (or real physical partials - judge by context).
    Returns [(freq_hz, median_prominence_db, fraction_of_frames)]."""
    m = mono(x)
    f, t, Z = signal.stft(m, fs=sr, nperseg=4096, noverlap=4096 - 512)
    D = 20 * np.log10(np.abs(Z) + 1e-12)
    e = (np.abs(Z) ** 2).sum(0)
    act = e > e.max() * 1e-2
    if act.sum() < 3:
        return []
    df = f[1] - f[0]
    k_in, k_out = int(30 / df), int(200 / df)
    kern = np.ones(2 * k_out + 1)
    kern[k_out - k_in:k_out + k_in + 1] = 0
    out = []
    Da = D[:, act]
    from scipy.ndimage import median_filter as _mf
    fp = np.zeros(2 * k_out + 1, bool)
    fp[:k_out - k_in] = True
    fp[k_out + k_in + 1:] = True
    med = _mf(Da, footprint=fp[:, None], mode="nearest")
    pk = maximum_filter(Da, size=(3, 1))
    prom = pk - med
    medp = np.median(prom, axis=1)
    frac = np.mean(prom > 8, axis=1)
    cand = np.flatnonzero((medp > min_med_db) & (frac >= min_frac) & (f >= fmin) & (f <= fmax))
    for i in cand:
        if medp[i] == medp[max(0, i - 3):i + 4].max():
            out.append((round(float(f[i]), 1), round(float(medp[i]), 1), round(float(frac[i]), 2)))
    return out


def peq(x, f0, gain_db, q, sr=SR):
    """RBJ peaking EQ, zero-phase (applied forward+backward, each pass with half the gain)."""
    A = 10 ** (gain_db / 2 / 40)
    w0 = 2 * np.pi * f0 / sr
    alpha = np.sin(w0) / (2 * q)
    b = np.array([1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A])
    a = np.array([1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A])
    return signal.filtfilt(b / a[0], a / a[0], x, axis=0)


def suppress_lines(x, freqs_hz, thr_db=6.0, target_db=-6.0):
    """Pull specific narrow stationary lines (whistles / hum) down to the surrounding noise floor."""
    return decomb(x, f0=1e9, extra_lines_hz=tuple(freqs_hz), thr_db=thr_db, target_db=target_db)


def decomb_sync(x, period=240, win_s=0.8, sr=SR):
    """Time-domain removal of an exactly periodic component (period in samples) for stationary
    material (ambiences): subtract a sliding Hann-weighted synchronous average of the surrounding
    periods. Equivalent to ~1 Hz-wide notches at every multiple of sr/period."""
    from scipy.ndimage import convolve1d
    n = len(x)
    K = -(-n // period)
    W = max(3, int(win_s * sr / period) | 1)
    w = np.hanning(W + 2)[1:-1]
    out = np.empty_like(x)
    for c in range(x.shape[1]):
        v = np.pad(x[:, c], (0, K * period - n))
        M = v.reshape(K, period)
        num = convolve1d(M, w, axis=0, mode="constant")
        den = convolve1d(np.ones_like(M), w, axis=0, mode="constant")
        out[:, c] = (M - num / den).reshape(-1)[:n]
    return out


def find_stationary_lines(x, sr=SR, min_db=8.0, fmin=40.0, fmax=16000.0):
    """Frequencies of narrow lines that persist through the whole file (hum / whine) - for ambiences."""
    m = mono(x)
    f, P = signal.welch(m, fs=sr, nperseg=9600)
    D = 10 * np.log10(P + 1e-24)
    base = median_filter(D, size=41, mode="nearest")
    pk = (D - base > min_db) & (D >= maximum_filter(D, size=5)) & (f >= fmin) & (f <= fmax)
    return [float(v) for v in f[pk]]


# ----------------------------------------------------------------------------- QA metrics
def _stft(m, sr, nfft, hop):
    f, t, Z = signal.stft(m, fs=sr, nperseg=nfft, noverlap=nfft - hop, window="hann",
                          boundary="even", padded=True)
    return f, t, np.abs(Z)


def flatness(x, sr=SR, fmin=60.0, fmax=16000.0):
    """Global spectral flatness (geo/arith mean of the power spectrum, fmin..fmax),
    energy-weighted over frames within 30 dB of the loudest frame. White noise ~0.56, pure tone ~0."""
    m = mono(x)
    f, t, M = _stft(m, sr, 2048, 512)
    band = (f >= fmin) & (f <= fmax)
    P = M[band] ** 2 + 1e-20
    e = P.sum(axis=0)
    act = e >= e.max() * 1e-3
    fl = np.exp(np.mean(np.log(P), axis=0)) / np.mean(P, axis=0)
    return float(np.sum(fl[act] * e[act]) / np.sum(e[act]))


def band_flatness(x, sr=SR, fmin=200.0, fmax=16000.0):
    """Energy-weighted mean of 1/3-octave-band flatness. Noise-like bands ~0.5, tonal bands < 0.2."""
    m = mono(x)
    f, t, M = _stft(m, sr, 4096, 1024)
    P = M ** 2 + 1e-20
    e_frame = P.sum(axis=0)
    act = e_frame >= e_frame.max() * 1e-3
    P = P[:, act]
    edges = fmin * 2 ** (np.arange(0, 40) / 3.0)
    edges = edges[edges <= fmax]
    num = den = 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        sel = (f >= lo) & (f < hi)
        if sel.sum() < 4:
            continue
        Pb = P[sel]
        fl = np.exp(np.mean(np.log(Pb), axis=0)) / np.mean(Pb, axis=0)
        w = Pb.sum(axis=0)
        num += np.sum(fl * w)
        den += np.sum(w)
    return float(num / den) if den > 0 else float("nan")


def harmonicity(x, sr=SR, fmin=70.0, fmax=500.0):
    """Classic pitch-periodicity strength: peak of the normalised autocorrelation (window-corrected)
    in the 70-500 Hz pitch range, after a 150 Hz high-pass; energy-weighted over active frames.
    Returns (weighted mean, fraction of active frames above 0.8). Broadband noise ~0.1-0.3, voice /
    notes > 0.7. Narrow-band material (e.g. a low thump, a strong resonance) also reads high, so this is
    read together with tonal_lines() and the spectrogram."""
    m = butter(mono(x), "highpass", 150.0, 2, sr)
    n, hop = 2048, 512
    if len(m) < n:
        m = np.pad(m, (0, n - len(m)))
    w = np.hanning(n)
    wac = np.correlate(w, w, "full")[n - 1:]
    wac = wac / wac[0]
    lo, hi = int(sr / fmax), int(sr / fmin)
    vals, ens = [], []
    for s in range(0, len(m) - n + 1, hop):
        fr = m[s:s + n] * w
        en = np.sum(fr ** 2)
        if en <= 0:
            continue
        P = np.abs(np.fft.rfft(fr - fr.mean(), 2 * n)) ** 2
        ac = np.fft.irfft(P)[:n]
        ac = ac / (ac[0] + 1e-20) / np.maximum(wac, 1e-3)
        vals.append(float(np.clip(ac[lo:hi].max(), 0, 1)))
        ens.append(en)
    vals, ens = np.array(vals), np.array(ens)
    if not len(vals):
        return 0.0, 0.0
    act = ens >= ens.max() * 1e-3
    hm = float(np.sum(vals[act] * ens[act]) / np.sum(ens[act]))
    return hm, float(np.mean(vals[act] > 0.8))


def _tonal_pass(m, sr, nfft, hop, med_bins, fmin, fmax):
    if len(m) < 2 * nfft:
        m = np.pad(m, (0, 2 * nfft - len(m)))
    f, t, M = _stft(m, sr, nfft, hop)
    D = db(M)
    e = (M ** 2).sum(axis=0)
    act = e >= e.max() * 10 ** (-40 / 10)
    base = median_filter(D, size=(med_bins, 1), mode="nearest")
    locmax = D >= maximum_filter(D, size=(5, 1))
    loud = D >= D.max(axis=0, keepdims=True) - 45
    band = ((f >= fmin) & (f <= fmax))[:, None]
    pk = ((D - base) > 12) & locmax & loud & act[None, :] & band
    mask = maximum_filter(pk.astype(np.uint8), size=(3, 1)) > 0
    best, best_f = 0, 0.0
    for i in np.flatnonzero(mask.any(axis=1)):
        d = np.diff(np.r_[0, mask[i].astype(np.int8), 0])
        r = (np.flatnonzero(d == -1) - np.flatnonzero(d == 1)).max()
        if r > best:
            best, best_f = r, f[i]
    P = M ** 2
    pk_d = maximum_filter(pk.astype(np.uint8), size=(5, 1)) > 0
    frac = float(P[pk_d].sum() / (P[:, act].sum() + 1e-20))
    return best * hop / sr, float(best_f), frac


def tonal_lines(x, sr=SR):
    """Longest-lasting narrow spectral peak (>= 12 dB above the local spectral median, a local maximum,
    within 45 dB of the frame maximum). Two resolutions: 150 Hz-20 kHz with 11.7 Hz bins (median over
    +-240 Hz) and 25-300 Hz with 2.9 Hz bins (median over +-30 Hz, so the steep low end of thumps is not
    mistaken for a tone while a sustained sub sine still is). Returns (longest_run_s, freq_hz, energy
    fraction of the flagged peaks in that pass)."""
    m = mono(x)
    hi = _tonal_pass(m, sr, 4096, 512, 41, 150.0, 20000.0)
    lo = _tonal_pass(m, sr, 16384, 1024, 21, 25.0, 300.0)
    return hi if hi[0] >= lo[0] else lo


def rhythm_score(x, sr=SR):
    """Periodicity of the onset envelope (0..1) for lags 0.2-2 s: >0.4 suggests a rhythmic bed."""
    m = mono(x)
    f, t, M = _stft(m, sr, 1024, 512)
    L = np.log(M + 1e-6)
    flux = np.maximum(np.diff(L, axis=1), 0).sum(axis=0)
    flux = flux - flux.mean()
    if np.allclose(flux, 0) or len(flux) < 100:
        return 0.0
    ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
    ac = ac / ac[0]
    fr = sr / 512
    lo, hi = int(0.2 * fr), min(int(2.0 * fr), len(ac) - 1)
    return float(ac[lo:hi].max()) if hi > lo else 0.0


def metrics(x, sr=SR):
    pk = np.abs(x).max()
    hm, hfrac = harmonicity(x, sr)
    tl, tf, tfrac = tonal_lines(x, sr)
    e10 = env_rms(x, sr, 10.0)
    corr = float(np.corrcoef(x[:, 0], x[:, 1])[0, 1]) if x[:, 0].std() > 0 and x[:, 1].std() > 0 else 1.0
    return {
        "dur_s": round(len(x) / sr, 3),
        "peak_dbfs": round(float(db(pk)), 2),
        "clip_runs": clip_runs(x),
        "onset_s": round(onset_index(x) / sr, 3),
        "peak_t_s": round(peak_time(x, sr), 3),
        "crest_db": round(float(db(pk) - db(np.sqrt(np.mean(x ** 2)) + 1e-12)), 1),
        "tail_db": round(float(db(e10[-int(0.02 * sr):].max() + 1e-12) - db(e10.max())), 1),
        "flatness": round(flatness(x, sr), 4),
        "band_flat": round(band_flatness(x, sr), 3),
        "harm": round(hm, 3),
        "harm_frac": round(hfrac, 3),
        "tonal_run_s": round(tl, 3),
        "tonal_hz": round(tf, 1),
        "tonal_frac": round(tfrac, 3),
        "rhythm": round(rhythm_score(x, sr), 3),
        "lr_corr": round(corr, 3),
    }


def fmt_metrics(mt):
    return (f"dur={mt['dur_s']:.2f}s pk={mt['peak_dbfs']:+.1f} clip={mt['clip_runs']} on={mt['onset_s']:.3f} "
            f"pkT={mt['peak_t_s']:.3f} crest={mt['crest_db']:.0f} tail={mt['tail_db']:.0f} "
            f"flat={mt['flatness']:.3f} bflat={mt['band_flat']:.2f} harm={mt['harm']:.2f}/{mt['harm_frac']:.2f} "
            f"tonal={mt['tonal_run_s']:.2f}s@{mt['tonal_hz']:.0f}Hz({mt['tonal_frac']:.2f}) "
            f"rhy={mt['rhythm']:.2f} lr={mt['lr_corr']:.2f}")


def envelope_line(x, sr=SR, block_ms=20):
    """Compact dB envelope string (rel. to peak) for eyeballing event structure."""
    blk = int(sr * block_ms / 1000)
    m = mono(x)
    vals = [np.sqrt(np.mean(m[i:i + blk] ** 2)) for i in range(0, len(m), blk)]
    ref = max(vals) + 1e-12
    return " ".join(f"{int(round(db(v / ref))):d}" for v in vals)


# ----------------------------------------------------------------------------- spectrogram images
def spec_png(audio_path, png_path, w=640, h=512, title=None):
    """ffmpeg showspectrumpic (log frequency 20 Hz-20 kHz, with legend)."""
    vf = (f"showspectrumpic=s={w}x{h}:mode=combined:color=intensity:scale=log:fscale=log:"
          f"start=20:stop=20000:drange=100:legend=1")
    if title:
        safe = title.replace(":", " ").replace("'", "")
        vf += f",drawtext=text='{safe}':x=8:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(audio_path), "-lavfi", vf, str(png_path)],
                   check=True)


def tile(pngs, out, cols=2, pad=6, bg=(16, 16, 16)):
    from PIL import Image
    ims = [Image.open(p).convert("RGB") for p in pngs]
    cw = max(i.width for i in ims)
    ch = max(i.height for i in ims)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cw + (cols + 1) * pad, rows * ch + (rows + 1) * pad), bg)
    for k, im in enumerate(ims):
        r, c = divmod(k, cols)
        sheet.paste(im, (pad + c * (cw + pad), pad + r * (ch + pad)))
    sheet.save(out)


def read_json(p, default):
    p = pathlib.Path(p)
    return json.loads(p.read_text()) if p.exists() else default
