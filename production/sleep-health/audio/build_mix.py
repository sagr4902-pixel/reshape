"""Assemble the final audio: cut VO take into segments at the timeline offsets,
place SFX cues, duck the music under the voice, and write
  public/audio/mix.wav              (used by the Remotion composition)
  out/RESHAPE_Sleep_Health_VO.wav   (voice only, same timeline, 48 kHz / 24-bit)
"""
import json, os, subprocess, numpy as np, wave
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.dirname(HERE)
TL = json.load(open(f'{HERE}/timeline.json')); SR = 48000; N = int(TL['total']*SR)

def load(path):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).astype(np.float64)

def place(track, sig, at, gain=1.0, fade=0.012):
    s = int(at*SR); n = min(len(sig), N - s)
    sig = sig[:n].copy(); f = int(fade*SR)
    if f and n > 2*f:
        sig[:f] *= np.linspace(0, 1, f); sig[-f:] *= np.linspace(1, 0, f)
    track[s:s+n] += sig*gain

vo_raw = load(f'{HERE}/vo-takes/take1.mp3')
vo = np.zeros(N)
for seg in TL['segments']:
    a, b = seg['src']; place(vo, vo_raw[int(a*SR):int(b*SR)], seg['dst'], 1.0, 0.02)
# normalise voice to peak -3 dBFS, light high-pass for mud via ffmpeg later
vo *= (10**(-3/20)) / np.max(np.abs(vo))

sfx = np.zeros(N)
for c in TL['sfx']:
    s = load(f'{HERE}/sfx/{c["file"]}.mp3'); s /= (np.max(np.abs(s)) + 1e-9)
    place(sfx, s, c['at'], c['gain'] * 10**(-10/20))

# music (stereo) + ducking under voice
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{HERE}/music.wav', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
music = np.frombuffer(raw, dtype=np.float32).astype(np.float64).reshape(-1, 2)[:N]
if len(music) < N: music = np.vstack([music, np.zeros((N-len(music), 2))])
# envelope follower on voice -> duck gain
win = int(0.05*SR); env = np.sqrt(np.convolve(vo**2, np.ones(win)/win, 'same'))
duck = np.where(env > 0.01, 10**(-9/20), 1.0)
# smooth attack 60 ms / release 500 ms
sm = np.empty_like(duck); g = 1.0
atk = np.exp(-1/(0.06*SR)); rel = np.exp(-1/(0.5*SR))
for i in range(N):
    target = duck[i]; coef = atk if target < g else rel; g = coef*g + (1-coef)*target; sm[i] = g
music *= sm[:, None] * 10**(-14/20)

mix = music + np.stack([vo, vo], 1) + np.stack([sfx, sfx], 1)
# soft limiter
mix = np.tanh(mix*1.1)/1.1
peak = np.max(np.abs(mix)); mix *= min(1.0, 10**(-1/20)/peak)

def write(path, data):
    d = np.clip(data, -1, 1); i24 = (d*8388607).astype(np.int32)
    b = i24.astype('<i4').tobytes()
    # pack 24-bit little-endian
    arr = np.frombuffer(b, dtype=np.uint8).reshape(-1, 4)[:, :3].tobytes()
    w = wave.open(path, 'wb'); w.setnchannels(data.shape[1] if data.ndim > 1 else 1); w.setsampwidth(3); w.setframerate(SR); w.writeframes(arr); w.close()
os.makedirs(f'{P}/public/audio', exist_ok=True); os.makedirs(f'{P}/out', exist_ok=True)
write(f'{P}/public/audio/mix.wav', mix)
write(f'{P}/out/RESHAPE_Sleep_Health_VO.wav', vo[:, None])
print('mix peak dBFS', 20*np.log10(np.max(np.abs(mix))))
