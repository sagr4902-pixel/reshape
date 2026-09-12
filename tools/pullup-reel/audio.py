import numpy as np, wave, os
SP = os.path.dirname(os.path.abspath(__file__))
SR  = 48000
FPS = 30000/1001
INTRO, OUTRO = 122, 54
F_START, F_END = 108, 979
MAIN  = F_END - F_START + 1
TOTAL = INTRO + MAIN + OUTRO
DUR   = TOTAL/FPS
REPS  = [171,200,228,257,286,316,348,380,411,444,477,511,545,580,616,653,744,784,882,979]

def read_wav(p):
    w = wave.open(p,"rb")
    n, ch = w.getnframes(), w.getnchannels()
    a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)/32768.0
    w.close()
    return a.reshape(-1, ch)

src = read_wav(f"{SP}/src_audio.wav")
out = np.zeros((int(DUR*SR)+16, 2), np.float32)

def add(sig, t0, gain=1.0):
    i = int(t0*SR)
    if sig.ndim == 1: sig = np.stack([sig, sig], 1)
    n = min(len(sig), len(out)-i)
    if n > 0: out[i:i+n] += sig[:n]*gain

def env(n, attack, decay, power=2.2):
    a = int(attack*SR); e = np.ones(n, np.float32)
    if a > 0: e[:a] = np.linspace(0, 1, a)
    d = np.linspace(0, 1, max(n-a, 1))
    e[a:] = (1-d)**power
    return e

def tick(f0=1150.0, dur=0.085, bright=0.5):
    n = int(dur*SR); t = np.arange(n)/SR
    s  = np.sin(2*np.pi*f0*t)*1.0
    s += np.sin(2*np.pi*f0*2.02*t)*bright*0.55
    s += np.sin(2*np.pi*f0*3.05*t)*bright*0.18
    return (s*env(n, 0.0012, dur, 5.0)).astype(np.float32)

def chime():
    n = int(0.85*SR); t = np.arange(n)/SR
    s = (np.sin(2*np.pi*784*t) + 0.7*np.sin(2*np.pi*1175*t) + 0.4*np.sin(2*np.pi*1568*t))
    return (s*env(n, 0.004, 0.85, 3.2)).astype(np.float32)

def riser(dur=1.35):
    n = int(dur*SR); t = np.arange(n)/SR
    ph = 2*np.pi*np.cumsum(np.linspace(70, 210, n))/SR
    s  = np.sin(ph)*0.9 + np.sin(ph*2)*0.25
    return (s*(np.linspace(0,1,n)**2.4)*np.hanning(n)**0.4).astype(np.float32)

def thud():
    n = int(0.55*SR); t = np.arange(n)/SR
    ph = 2*np.pi*np.cumsum(np.linspace(150, 52, n))/SR
    return (np.sin(ph)*env(n, 0.001, 0.55, 3.0)).astype(np.float32)

def whoosh(dur=0.42):
    n = int(dur*SR)
    rng = np.random.default_rng(7)
    x = rng.standard_normal(n).astype(np.float32)
    # one-pole low-pass sweeping upward, then an amplitude arc
    y = np.zeros(n, np.float32); z = 0.0
    cut = np.linspace(0.02, 0.28, n)
    for i in range(n):
        z += cut[i]*(x[i]-z); y[i] = z
    return (y*np.hanning(n)**1.5*1.4).astype(np.float32)

INTRO_T = INTRO/FPS

# --- intro bed: minimal, just motion cues ---
add(whoosh(0.40), 0.10, 0.16)
add(riser(1.30),  0.16, 0.055)
add(thud(),       1.50, 0.20)          # anatomy highlight lands
add(whoosh(0.36), 1.46, 0.13)
add(tick(660, 0.16, 0.35), 2.16, 0.05) # label settles

# --- main: original audio, trimmed to the live segment ---
a0, a1 = int(F_START/FPS*SR), int((F_END+1)/FPS*SR)
seg = src[a0:a1].copy()
fi = int(0.30*SR); seg[:fi] *= np.linspace(0,1,fi)[:,None]
add(seg, INTRO_T, 1.0)

# --- outro: let the room tone ring on, then duck it away ---
tail = src[a1:a1+int(0.9*SR)].copy()
if len(tail):
    tail *= np.linspace(1, 0, len(tail))[:,None]
    add(tail, INTRO_T + MAIN/FPS, 0.85)

# --- rep ticks, locked to the verified completion frames ---
for i, f in enumerate(REPS):
    t = INTRO_T + (f - F_START)/FPS
    g = 0.085 + 0.035*(i/19)                    # creep up slightly through the set
    add(tick(1080 + 14*i, 0.085), t, g)
    add(tick(540 + 7*i, 0.12, 0.2), t, g*0.35)  # body under the click

# --- completion ---
oc = INTRO_T + MAIN/FPS
add(thud(),   oc + 0.30, 0.22)
add(chime(),  oc + 0.32, 0.085)

# --- master: soft-clip, fade out with the picture ---
fo = int(0.40*SR); n = len(out)
fs = int((oc + 1.42)*SR)
if fs + fo < n: out[fs:fs+fo] *= np.linspace(1,0,fo)[:,None]; out[fs+fo:] = 0
out = np.tanh(out*1.05)*0.96
pk = np.abs(out).max()
if pk > 0.99: out *= 0.99/pk
w = wave.open(f"{SP}/mix.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out*32767).astype(np.int16).tobytes()); w.close()
print("audio", len(out)/SR, "s  peak", round(float(pk),3))
