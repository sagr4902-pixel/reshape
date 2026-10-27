"""
Procedural cinematic bed for RESHAPE — fully synthesised (no samples), so it is
royalty-free by construction. Minimal, atmospheric, subtle electronic textures:
  0–5 s   suspense: low drone + filtered noise swell
  5–34 s  calm progression: soft pad chords, slow sub pulse
  34–43 s uplifting: brighter pad voicing, gentle pluck arpeggio
  43–48.5 resolution: swell into a held chord, long decay
Output: music.wav (48 kHz stereo, peak -6 dBFS before mix)
"""
import json, math, numpy as np, wave, sys, os
SR = 48000
T = json.load(open(os.path.join(os.path.dirname(__file__), 'timeline.json')))['total']
N = int(SR * T)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def env(a, d, s, r, dur):
    n = int(dur * SR); e = np.zeros(n)
    na, nd, nr = int(a*SR), int(d*SR), int(r*SR)
    na = max(1, min(na, n)); e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na); e[na:na+nd] = np.linspace(1, s, nd) if nd > 0 else e[na:na+nd]
    e[na+nd:] = s
    nr = min(nr, n); e[n-nr:] *= np.linspace(1, 0, nr) if nr > 0 else 1
    return e

def lp(x, cutoff):
    # one-pole lowpass, applied twice
    a = math.exp(-2*math.pi*cutoff/SR); y = np.zeros_like(x); z = 0.0
    for _ in range(2):
        for i in range(len(x)):
            z = (1-a)*x[i] + a*z; y[i] = z
        x = y.copy()
    return y

def pad(freq, start, dur, amp, bright=1.0, detune=0.004):
    n = int(dur*SR); tt = np.arange(n)/SR
    sig = np.zeros(n)
    for k, f in enumerate([freq*(1-detune), freq, freq*(1+detune)]):
        ph = rng.uniform(0, 2*np.pi)
        sig += np.sin(2*np.pi*f*tt + ph)
        sig += 0.35*bright*np.sin(2*np.pi*f*2*tt + ph*1.3)
        sig += 0.12*bright*np.sin(2*np.pi*f*3*tt + ph*0.7)
    # slow vibrato shimmer
    sig *= (1 + 0.03*np.sin(2*np.pi*0.21*tt))
    e = env(min(2.5, dur*0.4), 0.5, 0.85, min(2.5, dur*0.45), dur)
    out = np.zeros(N); s = int(start*SR); e_n = min(n, N - s)
    out[s:s+e_n] = sig[:e_n]*e[:e_n]*amp/3
    return out

def sub(freq, start, dur, amp):
    n = int(dur*SR); tt = np.arange(n)/SR
    sig = np.sin(2*np.pi*freq*tt)
    e = env(0.02, 0.25, 0.3, dur-0.3, dur)
    out = np.zeros(N); s = int(start*SR); e_n = min(n, N-s)
    out[s:s+e_n] = sig[:e_n]*e[:e_n]*amp
    return out

def pluck(freq, start, amp, dur=1.6):
    n = int(dur*SR); tt = np.arange(n)/SR
    sig = np.sin(2*np.pi*freq*tt) + 0.4*np.sin(2*np.pi*freq*2*tt) + 0.15*np.sin(2*np.pi*freq*3*tt)
    e = np.exp(-tt*3.2) * (1 - np.exp(-tt*400))
    out = np.zeros(N); s = int(start*SR); e_n = min(n, N-s)
    out[s:s+e_n] = sig[:e_n]*e[:e_n]*amp
    return out

def noise_swell(start, dur, amp, cutoff=900):
    n = int(dur*SR)
    x = rng.standard_normal(n)
    # cheap band-limit via moving averages
    k = int(SR/cutoff); x = np.convolve(x, np.ones(k)/k, 'same')
    x = np.convolve(x, np.ones(k)/k, 'same')
    e = np.sin(np.linspace(0, np.pi, n))**2
    out = np.zeros(N); s = int(start*SR); e_n = min(n, N-s)
    out[s:s+e_n] = x[:e_n]*e[:e_n]*amp
    return out

NOTE = lambda n: 440*2**((n-69)/12)
# D minor world: D2=38, F=41, A=45, C=48, D3=50, F3=53, A3=57, Bb=58, C4=60, D4=62, E4=64, F4=65, G4=67, A4=69
mix = np.zeros(N)

# --- suspense 0-5.2
mix += sub(NOTE(38), 0.0, 5.4, 0.22)
mix += pad(NOTE(50), 0.0, 5.6, 0.10, bright=0.4)
mix += pad(NOTE(56), 0.8, 4.8, 0.05, bright=0.3)       # Ab tension (tritone colour)
mix += noise_swell(0.0, 5.3, 0.06, 600)

# --- calm progression 5.2-33.6: chord per scene
chords = [
    (5.2, 14.2, [50, 53, 57, 60]),   # Dm7   brain
    (14.2, 21.6, [46, 53, 57, 60]),  # Bbmaj7 immune
    (21.6, 28.6, [48, 52, 55, 59]),  # Cmaj7  heart
    (28.6, 33.6, [45, 52, 57, 60]),  # Am7    regular
]
for s, e, notes in chords:
    d = e - s + 1.2
    for i, n in enumerate(notes):
        mix += pad(NOTE(n), s - 0.6 if s > 0 else s, d, 0.07 if i else 0.09, bright=0.6)
    mix += sub(NOTE(notes[0]-12), s, d, 0.14)
    # slow heartbeat-like pulse every 2 s (very subtle)
    for p in np.arange(s, e, 2.0):
        mix += sub(NOTE(notes[0]-12), p, 0.5, 0.06)

# --- uplifting 33.6-42.8 : F major colour + arpeggio
for i, n in enumerate([53, 57, 60, 64]):      # Fmaj7
    mix += pad(NOTE(n), 33.0, 10.4, 0.085, bright=0.9)
mix += sub(NOTE(41), 33.6, 9.5, 0.14)
arp = [65, 69, 72, 76, 72, 69]
for k, st in enumerate(np.arange(34.2, 42.4, 0.5)):
    mix += pluck(NOTE(arp[k % len(arp)]), st, 0.045)
mix += noise_swell(41.3, 1.6, 0.05, 1200)

# --- resolution 42.8-48.5 : Dmaj (picardy) swell + decay
for i, n in enumerate([50, 54, 57, 62]):
    mix += pad(NOTE(n), 42.8, 5.7, 0.10, bright=0.8, detune=0.003)
mix += sub(NOTE(38), 42.8, 5.6, 0.18)
mix += pluck(NOTE(74), 46.6, 0.06, 2.0)

# gentle "room": short feedback delay as reverb substitute
def reverb(x, delays=(0.029, 0.037, 0.0411, 0.053), fb=0.55, wet=0.28):
    y = x.copy()
    for d in delays:
        k = int(d*SR); buf = np.zeros_like(x)
        for i in range(k, len(x), 1):
            buf[i] = x[i-k] + fb*buf[i-k]
        y += wet*buf/len(delays)
    return y
mix = reverb(mix)
mix = lp(mix, 5200)
# stereo widen: slight delay on right
L = mix; R = np.concatenate([np.zeros(int(0.011*SR)), mix[:-int(0.011*SR)]])
st = np.stack([L*0.92+R*0.08, R*0.92+L*0.08], 1)
peak = np.max(np.abs(st)); st = st/peak*0.5     # -6 dBFS
out = (st*32767).astype(np.int16)
w = wave.open(os.path.join(os.path.dirname(__file__), 'music.wav'), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('music.wav', st.shape[0]/SR, 's')
