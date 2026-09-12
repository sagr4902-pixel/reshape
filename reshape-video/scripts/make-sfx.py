"""Procedurally synthesised RESHAPE sound design.

Generated from scratch (pure sine/noise synthesis) so the template ships with
no third-party audio licensing attached. Replace with licensed sound design by
dropping files of the same name into public/sfx.
"""
import math, random, struct, wave, pathlib

SR = 48000
OUT = pathlib.Path("public/sfx")
OUT.mkdir(parents=True, exist_ok=True)
random.seed(7)


def write(name, samples):
    peak = max(1e-9, max(abs(s) for s in samples))
    norm = 0.89 / peak
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(
            struct.pack("<h", int(max(-1.0, min(1.0, s * norm)) * 32767)) for s in samples
        ))
    print(name, f"{len(samples)/SR:.2f}s")


def impact(dur=1.30):
    """Low sub-bass hit with a short transient click - the AFTER reveal."""
    n = int(SR * dur)
    out = []
    phase = 0.0
    for i in range(n):
        t = i / SR
        # sub sweep 92Hz -> 38Hz, exponential
        f = 38 + 54 * math.exp(-t * 9)
        phase += 2 * math.pi * f / SR
        env = math.exp(-t * 3.4)
        body = math.sin(phase) * env
        # add a second harmonic for weight on small speakers
        harm = 0.30 * math.sin(phase * 2) * math.exp(-t * 6.5)
        # transient click
        click = (random.uniform(-1, 1) * math.exp(-t * 150)) * 0.45
        out.append(body + harm + click)
    return out


def whoosh(dur=0.60):
    """Band-passed noise sweep - the transformation wipe."""
    n = int(SR * dur)
    out = []
    lp = bp = 0.0
    for i in range(n):
        t = i / SR
        p = t / dur
        white = random.uniform(-1, 1)
        # one-pole lowpass whose cutoff rises then falls -> 'whoosh'
        cut = 0.02 + 0.34 * math.sin(math.pi * p) ** 1.4
        lp += cut * (white - lp)
        bp += 0.10 * (lp - bp)          # remove rumble
        env = math.sin(math.pi * p) ** 1.7
        out.append((lp - bp) * env)
    return out


def riser(dur=1.20):
    """Noise + rising tone tension bed leading into the reveal."""
    n = int(SR * dur)
    out = []
    lp = 0.0
    phase = 0.0
    for i in range(n):
        t = i / SR
        p = t / dur
        white = random.uniform(-1, 1)
        lp += (0.03 + 0.22 * p ** 2) * (white - lp)
        f = 180 * (2 ** (2.6 * p))
        phase += 2 * math.pi * f / SR
        tone = math.sin(phase) * 0.30 * p ** 2
        env = p ** 1.5
        out.append((lp * 0.85 + tone) * env)
    return out


def tick(dur=0.13):
    """Tight click for label / graphic snaps."""
    n = int(SR * dur)
    out = []
    phase = 0.0
    for i in range(n):
        t = i / SR
        phase += 2 * math.pi * 1750 / SR
        out.append((math.sin(phase) * 0.55 + random.uniform(-1, 1) * 0.45) * math.exp(-t * 70))
    return out


write("impact.wav", impact())
write("whoosh.wav", whoosh())
write("riser.wav", riser())
write("tick.wav", tick())
