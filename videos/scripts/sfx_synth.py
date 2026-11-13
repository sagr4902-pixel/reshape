"""Procedural SFX for the RESHAPE ad: numpy/scipy only, fixed seeds, so every file is reproducible.

Usage:  python3 sfx_synth.py [name ...]        (default: all)
Writes 48 kHz stereo candidates to public/audio/sfx/_takes/proc_<name>.flac (24-bit).

Building blocks
  shaped_noise   - noise whose short-time spectrum follows an arbitrary f(t, f) surface (STFT synthesis
                   with random phase -> never tonal), used for every whoosh / riser / air texture.
  whoosh         - physically-motivated pass-by: proximity envelope 1/r^p, Doppler + proximity
                   brightness on the band centre, pan following the angle, turbulence flutter.
  reverb_ir      - synthetic stereo diffuse tail with per-band RT60 (dark highs), early build-up.
  periodic_noise - frequency-domain noise with an exact period (= the file length) -> seamless loops.
"""
import sys

import numpy as np
from scipy import signal

from sfx_common import SR, TAKES, butter, butter_zp, save


# ----------------------------------------------------------------------------- primitives
def tt(dur):
    return np.arange(int(round(dur * SR))) / SR


def cnoise(rng, shape):
    return (rng.standard_normal(shape) + 1j * rng.standard_normal(shape)) / np.sqrt(2)


def norm(x, peak=1.0):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


def g(db_):
    return 10 ** (db_ / 20)


def shaped_noise(dur, mag_fn, rng, nfft=2048, hop=512, corr=0.0):
    """Stereo noise whose STFT magnitude follows mag_fn(t[:,None], f[None,:]); corr = L/R coherence."""
    n = int(round(dur * SR))
    nfr = n // hop + 3
    tc = np.arange(nfr) * hop / SR
    f = np.maximum(np.fft.rfftfreq(nfft, 1 / SR), 1.0)
    M = mag_fn(np.clip(tc, 0, dur)[:, None], f[None, :])
    w = np.hanning(nfft + 1)[:-1]
    buf = np.zeros((nfr * hop + nfft, 2))
    common = cnoise(rng, M.shape)
    for c in range(2):
        Z = (np.sqrt(corr) * common + np.sqrt(1 - corr) * cnoise(rng, M.shape)) * M
        fr = np.fft.irfft(Z, nfft, axis=1) * w[None, :]
        for k in range(nfr):
            buf[k * hop:k * hop + nfft, c] += fr[k]
    return buf[nfft // 2:nfft // 2 + n]


def loggauss(f, fc, sigma_oct):
    return np.exp(-0.5 * (np.log2(f / fc) / sigma_oct) ** 2)


def pan_gains(p):
    """Equal-power pan, p in [-1, 1] -> (gL, gR)."""
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def smooth_noise(n, rate_hz, rng):
    """Zero-mean random modulation signal (unit std) band-limited to ~rate_hz."""
    x = rng.standard_normal(n + 4800)
    x = butter_zp(x, "lowpass", rate_hz, 2)[2400:2400 + n]
    return x / (x.std() + 1e-12)


def burst(dur, tau, rng, attack=0.0003, kind="noise"):
    """Exponentially decaying noise burst (mono)."""
    t = tt(dur)
    e = (1 - np.exp(-t / attack)) * np.exp(-t / tau)
    return rng.standard_normal(len(t)) * e


def reverb_ir(rng, rt=(1.2, 1.0, 0.6, 0.3), dur=None, predelay=0.012, build=0.012):
    """Stereo diffuse IR; rt = RT60 for bands <250 Hz, 250-2k, 2k-7k, >7k (s)."""
    dur = dur or max(rt) * 1.1
    t = tt(dur)
    edges = [(20, 250), (250, 2000), (2000, 7000), (7000, 20000)]
    ir = np.zeros((len(t), 2))
    for c in range(2):
        for (lo, hi), r in zip(edges, rt):
            # independent noise per band: bands add in power, so no notches at the crossovers
            nz = rng.standard_normal(len(t))
            ir[:, c] += butter(nz, "bandpass", [lo, min(hi, 23000)], 2) * np.exp(-6.9078 * t / r)
    ir *= (1 - np.exp(-t / build))[:, None]
    pd = int(predelay * SR)
    ir = np.vstack([np.zeros((pd, 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir):
    """x mono (n,) or stereo (n,2); returns stereo, length len(x)+len(ir)-1."""
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c]) for c in range(2)], 1)


def place(dst, src, at_s):
    i = int(round(at_s * SR))
    n = min(len(src), len(dst) - i)
    if n > 0:
        dst[i:i + n] += src[:n]
    return dst


def fit(x, dur):
    n = int(round(dur * SR))
    return x[:n] if len(x) >= n else np.vstack([x, np.zeros((n - len(x), x.shape[1]))])


def tail_fade(x, sec):
    k = int(sec * SR)
    x = x.copy()
    x[-k:] *= (np.cos(np.linspace(0, np.pi / 2, k)) ** 2)[:, None]
    return x


def finish(x, hp=30.0, peak=0.89):
    x = butter_zp(x, "highpass", hp, 2)
    return norm(x, peak)


# ----------------------------------------------------------------------------- whoosh engine
def whoosh(dur, t0, tau_b, tau_a, rng, p=2.0, fc0=1500.0, bright=0.8, dopp=0.25, bw=1.1,
           fc_lim=(120.0, 9000.0), pan=(-0.6, 0.6), width_db=-8.0, air_db=-16.0, flutter=0.12,
           sub_db=None, sub_fc=70.0, lo_cut=None, fade_in=0.85):
    """Pass-by whoosh. Proximity pr = d/r with separate approach / recede time constants."""
    t = tt(dur)

    def prox(x):
        tau = np.where(x < t0, tau_b, tau_a)
        u = (x - t0) / tau
        return 1 / np.sqrt(1 + u ** 2), u / np.sqrt(1 + u ** 2)

    def mag(tf, f):
        pr, rad = prox(tf)
        fc = np.clip(fc0 * (1 + bright * pr) / (1 + dopp * rad), *fc_lim)
        m = loggauss(f, fc, bw) + g(air_db) * pr * loggauss(f, 2.2 * fc, 1.8)
        if sub_db is not None:
            m = m + g(sub_db) * pr ** 2 * loggauss(f, sub_fc, 0.9)
        if lo_cut:
            m = m / np.sqrt(1 + (lo_cut / f) ** 4)
        return m

    src = shaped_noise(dur, mag, rng, corr=1.0)[:, 0]
    room = shaped_noise(dur, mag, rng, corr=0.0)
    pr, rad = prox(t)
    amp = pr ** p * np.sin(np.pi / 2 * np.clip(t / (fade_in * t0), 0, 1)) ** 2
    if flutter:
        amp = amp * np.clip(1 + flutter * smooth_noise(len(t), 28.0, rng), 0.3, 2)
    gl, gr = pan_gains(pan[0] + (pan[1] - pan[0]) * (rad + 1) / 2)
    y = np.stack([src * gl, src * gr], 1) * amp[:, None]
    y += g(width_db) * room * amp[:, None]
    return y


# ----------------------------------------------------------------------------- designs
def d_whoosh_light_1(rng):
    # quick symmetric pass-by, left -> right
    y = whoosh(0.75, 0.34, 0.075, 0.09, rng, p=2.2, fc0=1700, bright=0.9, dopp=0.3, bw=1.15,
               pan=(-0.65, 0.65), width_db=-9, air_db=-12)
    return finish(tail_fade(y, 0.08))


def d_whoosh_light_2(rng):
    # sharp swipe: fast approach, airy decaying tail, slightly right
    y = whoosh(0.55, 0.10, 0.035, 0.11, rng, p=2.0, fc0=2600, bright=0.7, dopp=0.35, bw=1.0,
               fc_lim=(300, 11000), pan=(0.0, 0.35), width_db=-7, air_db=-10, flutter=0.15)
    return finish(tail_fade(y, 0.1))


def d_whoosh_light_3(rng):
    # swell-in: long build, brightening, quick release (element arriving), right -> centre
    y = whoosh(0.95, 0.74, 0.26, 0.055, rng, p=2.4, fc0=1300, bright=1.4, dopp=0.2, bw=1.2,
               pan=(0.55, 0.0), width_db=-9, air_db=-12)
    return finish(tail_fade(y, 0.08))


def d_whoosh_deep_1(rng):
    # smooth deep camera move, right -> left
    y = whoosh(1.4, 0.66, 0.24, 0.30, rng, p=1.8, fc0=330, bright=1.1, dopp=0.22, bw=1.4,
               fc_lim=(90, 2500), pan=(0.45, -0.45), width_db=-5, air_db=-15, flutter=0.06,
               sub_db=-6, sub_fc=55)
    return finish(tail_fade(y, 0.15), hp=28)


def d_whoosh_deep_2(rng):
    # deep swell with later peak, wide and centred, a little more sub
    y = whoosh(1.25, 0.78, 0.32, 0.20, rng, p=2.0, fc0=260, bright=1.5, dopp=0.18, bw=1.5,
               fc_lim=(80, 2200), pan=(-0.15, 0.15), width_db=-3, air_db=-14, flutter=0.06,
               sub_db=-4, sub_fc=50)
    return finish(tail_fade(y, 0.15), hp=28)


def d_split_whoosh(rng):
    # one whoosh that splits: two independent air layers start together in the centre (mono image)
    # and recede to hard left / hard right while dropping in pitch-free brightness (Doppler recede)
    dur = 1.2
    y = np.zeros((int(dur * SR), 2))
    for side, seed_off in ((-1, 0), (1, 1)):
        y += whoosh(dur, 0.2, 0.06, 0.34, rng, p=1.7, fc0=1900, bright=0.9, dopp=0.45, bw=1.2,
                    fc_lim=(250, 9000), pan=(0.0 - 0.0 * side, 0.98 * side), width_db=-20,
                    air_db=-12, flutter=0.1, fade_in=0.9)
    t = tt(dur)
    b = butter(burst(0.12, 0.02, rng, attack=0.004), "bandpass", [600, 6000], 2)
    y = place(y, np.stack([b, b], 1) * 0.12 * np.abs(y).max() / np.abs(b).max(), 0.12)
    ir = reverb_ir(rng, rt=(0.9, 0.85, 0.65, 0.4), predelay=0.012)
    wet = convolve(y, ir)[:len(t)]
    y = y + g(-15) * wet / (np.abs(wet).max() + 1e-9) * np.abs(y).max()
    return finish(tail_fade(y, 0.2))


def d_converge_swirl(rng):
    dur, T = 2.0, 1.6
    t = tt(dur)
    prog = np.clip(t / T, 0, 1)
    f_rot = 0.65 + 2.6 * prog ** 1.6                       # accelerating swirl (Hz)
    master = np.where(t < T, g(-30) * (1 / g(-30)) ** (prog ** 1.7), np.exp(-np.clip(t - T, 0, None) / 0.06))
    out = np.zeros((len(t), 2))
    for i, lvl in enumerate((0.0, -3.0, -6.0)):
        phase = 2 * np.pi * (i / 3 + 0.1 * rng.random()) + 2 * np.pi * np.cumsum(f_rot) / SR
        radius = (1 - prog ** 1.4) * 0.97
        pan = radius * np.sin(phase)
        depth = radius * np.cos(phase)                    # +1 = front (brighter, louder)

        frames_t = np.arange(len(t) // 512 + 3) * 512 / SR
        depth_f = np.interp(frames_t, t, depth)

        def mag(tf, f, depth_f=depth_f, i=i):
            pr = np.clip(tf / T, 0, 1)
            fc = (420 + 60 * i) * 2 ** (2.6 * pr ** 1.3) * (1 + 0.28 * depth_f[:tf.shape[0]][:, None])
            return loggauss(f, fc, 1.05) + 0.1 * loggauss(f, 3 * fc, 1.2)

        s = shaped_noise(dur, mag, rng, corr=1.0)[:, 0]
        s *= g(lvl + 3.0 * depth) * (1 + 0.1 * smooth_noise(len(t), 20, rng))
        gl, gr = pan_gains(pan)
        out += np.stack([s * gl, s * gr], 1)
    out *= master[:, None]
    # soft arrival "whump" at the convergence point
    wh = butter(burst(0.38, 0.075, rng, attack=0.008), "lowpass", 300, 2)
    wh_air = butter(burst(0.38, 0.06, rng, attack=0.004), "bandpass", [900, 6000], 2)
    whump = norm(wh) + 0.35 * norm(wh_air)
    out = place(out, np.stack([whump, whump], 1) * 0.42 * np.abs(out).max(), T - 0.015)
    ir = reverb_ir(rng, rt=(1.0, 0.9, 0.7, 0.4), predelay=0.01)
    wet = convolve(out, ir)[:len(t)]
    y = out + g(-12) * wet / (np.abs(wet).max() + 1e-9) * np.abs(out).max()
    return finish(tail_fade(y, 0.12))


def d_riser_air(rng):
    dur = 2.5
    t = tt(dur)
    pr = t / dur

    def mag(tf, f):
        p = tf / dur
        fc = 320 * (28 ** (p ** 1.25))
        return loggauss(f, fc, 1.15 - 0.35 * p) + 0.25 * p ** 2 * loggauss(f, 7500, 0.9)

    main = shaped_noise(dur, mag, rng, corr=0.35)
    main *= (g(-36) * (1 / g(-36)) ** (pr ** 1.5))[:, None]
    hiss = butter(rng.standard_normal((len(t), 2)), "highpass", 5500, 2) * (pr ** 5)[:, None]
    rumble = butter(rng.standard_normal(len(t)), "bandpass", [55, 190], 2) * pr ** 2.2
    # reversed reverb swell (an organic, non-tonal build)
    b = butter(burst(0.25, 0.05, rng), "bandpass", [400, 7000], 2)
    ir = reverb_ir(rng, rt=(2.2, 2.0, 1.6, 1.0), predelay=0.0, dur=2.6)
    rev = convolve(b, ir)[::-1]
    rev = rev[-len(t):] if len(rev) >= len(t) else np.vstack([np.zeros((len(t) - len(rev), 2)), rev])
    y = (norm(main) + 0.32 * norm(hiss) + 0.14 * np.stack([norm(rumble)] * 2, 1) + 0.55 * norm(rev))
    y[-int(0.006 * SR):] *= np.linspace(1, 0, int(0.006 * SR))[:, None]
    return finish(y, hp=35)


def d_glow_shimmer(rng):
    dur = 1.5
    t = tt(dur)
    env = np.where(t < 0.42, np.clip(t / 0.42, 0, 1) ** 1.5, np.exp(-(np.clip(t - 0.42, 0, None) / 0.42) ** 1.3))

    def mag(tf, f):
        fc = 4200 * 2 ** (1.35 * np.clip(tf / 0.9, 0, 1))
        return loggauss(f, fc, 0.75) / np.sqrt(1 + (1800 / f) ** 6)

    air = shaped_noise(dur, mag, rng, corr=0.1) * env[:, None]
    # sparkle: sparse noise micro-grains (no sinusoids -> no pitch), density follows the envelope
    grains = np.zeros((len(t), 2))
    rate = 340 * env
    k = 0
    while k < len(t):
        k += int(rng.exponential(SR / max(rate[k], 8)))
        if k >= len(t) - 400:
            break
        L = int(rng.uniform(0.0008, 0.003) * SR)
        gr = rng.standard_normal(L) * np.hanning(L) * rng.lognormal(0, 0.6) * env[k]
        gl_, gr_ = pan_gains(rng.uniform(-0.9, 0.9))
        grains[k:k + L, 0] += gr * gl_
        grains[k:k + L, 1] += gr * gr_
    grains = butter(grains, "highpass", 5200, 2)
    ir = reverb_ir(rng, rt=(0.6, 0.8, 0.9, 0.8), predelay=0.006)
    gw = butter(convolve(grains, ir)[:len(t)], "highpass", 2500, 2)
    y = norm(air) + 0.7 * norm(grains) + 0.6 * norm(gw)
    return finish(tail_fade(y, 0.25), hp=900)


def d_line_draw(rng):
    dur = 2.5
    t = tt(dur)
    drift = smooth_noise(len(t) // 512 + 3, 0.9 * 512, rng)  # ~0.9 Hz centre drift, at the frame rate

    def mag(tf, f):
        k = np.arange(tf.shape[0])
        fc = 3600 * 2 ** (0.18 * drift[k][:, None])
        return (loggauss(f, fc, 1.25) + 0.3 * loggauss(f, 850, 0.9)) / np.sqrt(1 + (f / 12000) ** 4)

    y = shaped_noise(dur, mag, rng, corr=0.45)
    y *= np.clip(1 + 0.12 * smooth_noise(len(t), 6.0, rng), 0.5, 1.6)[:, None]
    # faint electric fizz: very sparse tiny grains
    fz = np.zeros(len(t))
    for k in np.sort(rng.integers(0, len(t) - 200, 160)):
        L = int(rng.uniform(0.0003, 0.0012) * SR)
        fz[k:k + L] += rng.standard_normal(L) * np.hanning(L) * rng.lognormal(0, 0.7)
    fz = butter(fz, "highpass", 6000, 2)
    y = norm(y) + 0.18 * np.stack([norm(fz)] * 2, 1)
    ramp_in = np.sin(np.clip(t / 0.4, 0, 1) * np.pi / 2) ** 2
    ramp_out = np.sin(np.clip((dur - t) / 0.65, 0, 1) * np.pi / 2) ** 2
    return finish(y * (ramp_in * ramp_out)[:, None], hp=400)


def d_tick_spark(rng):
    dur = 0.32
    n = int(dur * SR)
    y = np.zeros((n, 2))
    pre = int(0.004 * SR)
    # main snap: very short broadband burst, high-passed (no resonance -> no pitch)
    snap = butter(burst(0.006, 0.00045, rng, attack=0.00005), "highpass", 1800, 2)
    body = butter(burst(0.01, 0.0018, rng, attack=0.0001), "bandpass", [600, 3500], 2) * 0.35
    y = place(y, np.stack([snap + body[:len(snap)] if len(body) >= len(snap) else snap] * 2, 1), pre / SR)
    # micro crackles that die away
    times = np.sort(rng.uniform(0.006, 0.085, 6))
    for i, tc in enumerate(times):
        c = butter(burst(0.003, rng.uniform(0.00015, 0.0004), rng, attack=0.00003), "highpass", 3000, 2)
        a = 0.55 * np.exp(-tc / 0.035) * rng.uniform(0.5, 1.0)
        gl, gr = pan_gains(rng.uniform(-0.35, 0.35))
        y = place(y, np.stack([c * gl, c * gr], 1) * a, pre / SR + tc)
    # sizzle tail
    sz = butter(burst(0.25, 0.028, rng, attack=0.0005), "highpass", 6500, 2) * 0.08
    y = place(y, np.stack([sz, butter(burst(0.25, 0.028, rng, attack=0.0005), "highpass", 6500, 2) * 0.08], 1), pre / SR)
    # room tail = the (smooth-spectrum) IR itself, not the IR coloured by this one random snap,
    # so the tail carries no fixed spectral peaks
    ir = butter(reverb_ir(rng, rt=(0.3, 0.35, 0.35, 0.25), predelay=0.004), "highpass", 1500, 2)
    wet = place(np.zeros((n, 2)), ir, pre / SR)
    y = y + g(-17) * wet / (np.abs(wet).max() + 1e-9) * np.abs(y).max()
    return finish(tail_fade(y, 0.08), hp=250)


def d_marker_tick(rng):
    dur = 0.3
    n = int(dur * SR)
    y = np.zeros((n, 2))
    pre = 0.004
    tick = butter(burst(0.02, 0.0009, rng, attack=0.00012), "bandpass", [1200, 6000], 2)
    body = butter(burst(0.03, 0.003, rng, attack=0.0003), "bandpass", [280, 1300], 2) * 0.32
    k = tick + body[:len(tick)]
    y = place(y, np.stack([k, k], 1), pre)
    # soft airy "glow" right after the tick (lighting up), noise only
    gl_ = butter(rng.standard_normal((int(0.16 * SR), 2)), "bandpass", [3500, 9000], 2)
    gl_ *= np.hanning(len(gl_))[:, None] * 0.028
    y = place(y, gl_, pre + 0.01)
    ir = butter(reverb_ir(rng, rt=(0.2, 0.22, 0.2, 0.15), predelay=0.003), "bandpass", [900, 8000], 2)
    wet = place(np.zeros((n, 2)), ir, pre)
    y = y + g(-20) * wet / (np.abs(wet).max() + 1e-9) * np.abs(y).max()
    y = butter(y, "lowpass", 9000, 2)
    return finish(tail_fade(y, 0.08), hp=200)


def d_word_accent(rng):
    dur = 0.4
    n = int(dur * SR)
    t = tt(dur)
    y = np.zeros((n, 2))
    pre = 0.003
    thud = butter(butter(burst(0.15, 0.016, rng, attack=0.0008), "lowpass", 800, 4), "highpass", 110, 2)
    f = 230 * (120 / 230) ** np.clip(t[:int(0.15 * SR)] / 0.035, 0, 1)
    punch = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t[:len(f)] / 0.001)) * np.exp(-t[:len(f)] / 0.02)
    click = butter(burst(0.01, 0.0011, rng, attack=0.0001), "bandpass", [1500, 4500], 2)
    body = norm(thud) + 0.4 * norm(punch)
    body[:len(click)] += 0.25 * norm(click)
    y = place(y, np.stack([body, body], 1), pre)
    ir = reverb_ir(rng, rt=(0.35, 0.3, 0.2, 0.12), predelay=0.005)
    wet = butter(convolve(y, ir)[:n], "lowpass", 3000, 2)
    y = y + g(-18) * wet / (np.abs(wet).max() + 1e-9) * np.abs(y).max()
    return finish(tail_fade(y, 0.1), hp=70)


def d_sub_impact_soft(rng):
    dur = 1.0
    n = int(dur * SR)
    t = tt(dur)
    pre = 0.004
    f = 85 * (42 / 85) ** np.clip(t / 0.12, 0, 1)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.085)
    body = butter(burst(dur, 0.11, rng, attack=0.003), "lowpass", 170, 4)
    pres = butter(burst(dur, 0.035, rng, attack=0.001), "bandpass", [140, 550], 2)
    click = butter(burst(0.02, 0.002, rng, attack=0.0002), "lowpass", 2500, 2)
    dry = g(-2) * norm(sub) + norm(body) + g(-11) * norm(pres)
    dry[:len(click)] += g(-26) * norm(click)
    y = place(np.zeros((n, 2)), np.stack([dry, dry], 1), pre)
    ir = reverb_ir(rng, rt=(1.0, 0.8, 0.4, 0.2), predelay=0.012)
    wet = butter(convolve(y, ir)[:n], "lowpass", 1200, 2)
    y = y + g(-15) * wet / (np.abs(wet).max() + 1e-9) * np.abs(y).max()
    return finish(tail_fade(y, 0.25), hp=25)


def d_logo_impact(rng):
    dur = 2.5
    n = int(dur * SR)
    t = tt(dur)
    pre = 0.004
    crack = butter(butter(burst(0.05, 0.003, rng, attack=0.0001), "highpass", 300, 2), "lowpass", 9000, 2)
    punch = butter(burst(0.3, 0.013, rng, attack=0.0004), "lowpass", 3000, 2)
    body = butter(burst(1.0, 0.12, rng, attack=0.003), "lowpass", 300, 4)
    subn = butter(burst(1.5, 0.2, rng, attack=0.006), "lowpass", 90, 4)           # textured, non-tonal sub
    f = 60 * (34 / 60) ** np.clip(t[:int(0.6 * SR)] / 0.12, 0, 1)
    knock = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t[:len(f)] / 0.003)) * np.exp(-t[:len(f)] / 0.07)
    lowmid = butter(burst(1.0, 0.16, rng, attack=0.004), "bandpass", [120, 600], 2)
    dry = np.zeros(int(1.5 * SR))
    for sig, lvl in ((crack, -8), (punch, -1), (body, 0), (subn, -2), (knock, -7), (lowmid, -5)):
        dry[:len(sig)] += g(lvl) * norm(sig)
    y = place(np.zeros((n, 2)), np.stack([dry, dry], 1), pre)
    airr = butter(rng.standard_normal((int(1.6 * SR), 2)), "bandpass", [900, 6000], 2)
    airr *= ((1 - np.exp(-tt(1.6) / 0.012)) * np.exp(-tt(1.6) / 0.22))[:, None]
    y = place(y, g(-13) * norm(airr), pre + 0.002)
    ir = reverb_ir(rng, rt=(1.3, 1.4, 1.0, 0.55), predelay=0.016, dur=2.3)
    wet = convolve(y, ir)[:n]
    wet = butter(wet, "lowpass", 5000, 2)
    y = y + g(-11) * wet / (np.abs(wet).max() + 1e-9) * np.abs(y).max()
    return finish(tail_fade(y, 0.6), hp=24)


# ----------------------------------------------------------------------------- ambiences
def periodic_noise(dur, shape_fn, rng, corr_fn=lambda f: 0.0 * f):
    """Noise that repeats exactly every `dur` seconds (seamless loop), spectrum shape_fn(f)."""
    n = int(round(dur * SR))
    f = np.maximum(np.fft.rfftfreq(n, 1 / SR), 0.01)
    A = shape_fn(f)
    rho = np.clip(corr_fn(f), 0, 1)
    common = cnoise(rng, len(f))
    out = np.zeros((n, 2))
    for c in range(2):
        Z = (np.sqrt(rho) * common + np.sqrt(1 - rho) * cnoise(rng, len(f))) * A
        Z[0] = 0
        out[:, c] = np.fft.irfft(Z, n)
    return out / np.abs(out).max()


def periodic_mod(n, rng, max_hz=0.35, depth=0.1):
    """Slow smooth modulation (1 + depth*m) that is itself periodic over n samples."""
    F = np.zeros(n // 2 + 1, complex)
    kmax = max(2, int(max_hz * n / SR))
    F[1:kmax] = cnoise(rng, kmax - 1)
    m = np.fft.irfft(F, n)
    return 1 + depth * m / (np.abs(m).max() + 1e-12)


def circ_hp(y, fc, order=2):
    """High-pass applied in the frequency domain over the whole (periodic) buffer: keeps the loop exact."""
    f = np.maximum(np.fft.rfftfreq(len(y), 1 / SR), 1e-3)
    H = 1 / np.sqrt(1 + (fc / f) ** (2 * order))
    return np.fft.irfft(np.fft.rfft(y, axis=0) * H[:, None], len(y), axis=0)


def circ_place(dst, src, at_s):
    i = int(round(at_s * SR)) % len(dst)
    for k in range(0, len(src), len(dst)):
        chunk = src[k:k + len(dst)]
        idx = (np.arange(len(chunk)) + i) % len(dst)
        np.add.at(dst, idx, chunk)
    return dst


def ev_thud(rng, tau=0.05, lp=600.0):
    """Soft distant thud (mat / body weight), smooth spectrum."""
    b = burst(0.6, tau, rng, attack=0.002)
    return butter(butter(b, "lowpass", lp, 2), "highpass", 70, 2)


def ev_step(rng):
    heel = butter(burst(0.15, rng.uniform(0.012, 0.02), rng, attack=0.001), "bandpass", [120, 1800], 2)
    sc = butter(burst(0.06, 0.008, rng, attack=0.0005), "bandpass", [1500, 5000], 2)
    heel[:len(sc)] += 0.25 * sc * np.abs(heel).max() / (np.abs(sc).max() + 1e-12)
    return heel


def ev_steps(rng, n=5, spacing=0.27, jitter=0.035):
    y = np.zeros(int((n * spacing + 0.4) * SR))
    t0 = 0.0
    for _ in range(n):
        s = ev_step(rng) * rng.uniform(0.55, 1.0)
        i0 = int(t0 * SR)
        y[i0:i0 + len(s)] += s[:len(y) - i0]
        t0 += spacing + rng.uniform(-jitter, jitter)
    return y


def ev_clatter(rng, n=4):
    """Small piece of equipment set down: a few quick light knocks (band-passed noise, no modes)."""
    y = np.zeros(int(0.5 * SR))
    for _ in range(n):
        b = butter(burst(0.05, rng.uniform(0.004, 0.01), rng, attack=0.0003), "bandpass", [400, 3500], 2)
        i0 = int(rng.uniform(0, 0.25) * SR)
        y[i0:i0 + len(b)] += b[:len(y) - i0] * rng.uniform(0.3, 1.0)
    return y


def distance(seg, lp, ir, wet_db=0.0, dry_db=-14.0):
    """Push a close sound far away: low-pass (air), mostly reverb, little direct sound."""
    if seg.ndim == 1:
        seg = np.stack([seg, seg], 1)
    d = butter(seg, "lowpass", lp, 2)
    w = convolve(d, ir)
    w = w / (np.abs(w).max() + 1e-12)
    d = d / (np.abs(d).max() + 1e-12)
    out = g(wet_db) * w
    out[:len(d)] += g(dry_db) * d
    return out


def d_room_tone_gym(rng):
    dur = 12.0
    n = int(dur * SR)

    def low_shape(f):
        hp = 1 / np.sqrt(1 + (38 / f) ** 8)
        return hp * (np.maximum(f, 70) / 70) ** -0.5 * (1 + 0.3 * loggauss(f, 90, 0.7)) / np.sqrt(1 + (f / 420) ** 4)

    def high_shape(f):
        hp = 1 / np.sqrt(1 + (300 / f) ** 4)
        return hp * (f / 400) ** -0.5 * (1 + 0.55 * loggauss(f, 2600, 1.0)) / np.sqrt(1 + (f / 7000) ** 4)

    low = periodic_noise(dur, low_shape, rng, corr_fn=lambda f: 0.75 * np.exp(-f / 300))
    high = periodic_noise(dur, high_shape, rng, corr_fn=lambda f: 0.15 + 0 * f)
    low *= periodic_mod(n, rng, 0.3, 0.09)[:, None]
    high *= periodic_mod(n, rng, 0.4, 0.07)[:, None]
    bed = low + g(-1) * high
    # two barely-there distant events (far reverberant thuds), placed circularly so the loop stays seamless
    ir = reverb_ir(rng, rt=(1.1, 1.5, 1.1, 0.5), predelay=0.03, dur=2.0)
    ev = np.zeros((n, 2))
    ev = circ_place(ev, distance(ev_thud(rng, 0.06, 650), 900, ir), 3.1)
    ev = circ_place(ev, distance(ev_clatter(rng), 1600, ir), 8.35)
    bed, ev = bed / np.abs(bed).max(), ev / (np.abs(ev).max() + 1e-12)
    if PARTS:
        return bed, g(EV_DB.get("room_tone_gym", -16)) * ev
    y = bed + g(EV_DB.get("room_tone_gym", -16)) * ev
    return norm(circ_hp(y, 30), 0.89)


def d_kids_area_air(rng):
    dur = 8.0
    n = int(dur * SR)

    def shape(f):
        hp = 1 / np.sqrt(1 + (90 / f) ** 6)
        return hp * (f / 300) ** -0.45 * (1 + 0.5 * loggauss(f, 3800, 0.9)) / np.sqrt(1 + (f / 9000) ** 4)

    bed = periodic_noise(dur, shape, rng, corr_fn=lambda f: 0.5 * np.exp(-f / 250) + 0.1)
    bed *= periodic_mod(n, rng, 0.45, 0.08)[:, None]
    ir = reverb_ir(rng, rt=(0.9, 1.3, 1.1, 0.7), predelay=0.025, dur=1.8)
    ev = np.zeros((n, 2))
    # distant light activity: a short run of light steps, a two-foot hop, a mat pat, another run
    hop = ev_thud(rng, 0.03, 900)
    hop2 = np.zeros(len(hop) + int(0.045 * SR))
    hop2[:len(hop)] += hop
    hop2[int(0.045 * SR):] += 0.7 * ev_thud(rng, 0.03, 900)
    ev = circ_place(ev, distance(ev_steps(rng, 5, 0.26), 2600, ir, dry_db=-12), 0.9)
    ev = circ_place(ev, distance(hop2, 2400, ir, dry_db=-12), 3.65)
    ev = circ_place(ev, distance(ev_thud(rng, 0.02, 1500), 2800, ir, dry_db=-12), 5.4)
    ev = circ_place(ev, distance(ev_steps(rng, 4, 0.3), 2200, ir, dry_db=-12), 6.6)
    bed, ev = bed / np.abs(bed).max(), ev / (np.abs(ev).max() + 1e-12)
    if PARTS:
        return bed, g(EV_DB.get("kids_area_air", -9)) * ev
    y = bed + g(EV_DB.get("kids_area_air", -9)) * ev
    return norm(circ_hp(y, 60), 0.89)


PARTS = False                     # analysis hook: ambience designs return (bed, events)
EV_DB = {"room_tone_gym": -7.0, "kids_area_air": -2.0}   # distant-event level vs bed peak (dB)

DESIGNS = {
    "tick_spark": (d_tick_spark, 11),
    "whoosh_light_1": (d_whoosh_light_1, 21),
    "whoosh_light_2": (d_whoosh_light_2, 22),
    "whoosh_light_3": (d_whoosh_light_3, 23),
    "whoosh_deep_1": (d_whoosh_deep_1, 31),
    "whoosh_deep_2": (d_whoosh_deep_2, 32),
    "line_draw": (d_line_draw, 41),
    "sub_impact_soft": (d_sub_impact_soft, 51),
    "word_accent": (d_word_accent, 61),
    "split_whoosh": (d_split_whoosh, 71),
    "marker_tick": (d_marker_tick, 81),
    "riser_air": (d_riser_air, 91),
    "converge_swirl": (d_converge_swirl, 101),
    "logo_impact": (d_logo_impact, 111),
    "glow_shimmer": (d_glow_shimmer, 121),
    "room_tone_gym": (d_room_tone_gym, 131),
    "kids_area_air": (d_kids_area_air, 141),
}


def render(name, seed=None):
    fn, s = DESIGNS[name]
    rng = np.random.default_rng(s if seed is None else seed)
    return fn(rng)


def main():
    names = [a for a in sys.argv[1:] if not a.startswith("--")] or list(DESIGNS)
    for nm in names:
        y = render(nm)
        save(TAKES / f"proc_{nm}.flac", y)
        print(f"proc_{nm:<18} {len(y) / SR:.2f}s peak={20 * np.log10(np.abs(y).max()):.1f} dBFS")


if __name__ == "__main__":
    main()
