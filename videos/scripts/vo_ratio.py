"""Voice-to-SFX ratio per voice line in the speech band (300 Hz – 4 kHz)."""
import json, subprocess, pathlib
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-af", "highpass=f=300,lowpass=f=4000", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)
vo = load(ROOT / "public/audio/mix/stem_vo.wav"); fx = load(ROOT / "public/audio/mix/stem_sfx.wav")
cues = json.loads((ROOT / "scripts/cues.json").read_text())
timing = json.loads((ROOT / "src/vo_timing.json").read_text())
for lid, fr in cues["vo"].items():
    s = int(fr / 30 * SR); e = s + int(timing["lines"][lid]["duration"] * SR)
    v = vo[s:e]; x = fx[s:e]
    # only where the voice is active
    win = 2400; n = len(v) // win
    vr = np.sqrt((v[: n * win].reshape(n, win) ** 2).mean(1) + 1e-12); xr = np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(1) + 1e-12)
    act = vr > vr.max() * 0.1
    ratio = 20 * np.log10(vr[act].mean() / xr[act].mean())
    worst = 20 * np.log10(np.min(vr[act] / xr[act]))
    print(f"{lid}: voice above sfx by {ratio:5.1f} dB on average, worst 50ms window {worst:5.1f} dB")
