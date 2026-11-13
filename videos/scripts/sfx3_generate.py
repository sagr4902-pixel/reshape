"""Extra hype SFX for v3 via ElevenLabs sound-generation (2 variants each), finalised to 48k stereo WAV + manifest entries."""
import json, subprocess, pathlib
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "public/audio/sfx/_takes/v3"; RAW.mkdir(parents=True, exist_ok=True)
OUT = ROOT / "public/audio/sfx"
SPECS = {
  "record_scratch": ("Short DJ vinyl record scratch, comedic freeze-frame stop, dry, no music, no drums", 0.9),
  "tape_rewind": ("VHS cassette tape rewinding fast, mechanical whirring rewind sound, dry, no music", 1.4),
  "impact_hit": ("Punchy cinematic impact hit, deep boom with sharp transient, short tail, no music, no melody", 1.2),
  "ball_bounce": ("Single bounce of a small rubber ball on a hard gym floor, dry, no music", 0.5),
  "ui_click": ("Crisp short user interface button click, dry, no music", 0.3),
  "flash_pop": ("Quick camera flash pop with tiny electronic whine, very short, no music", 0.35),
}
def gen(name, text, dur, k):
    out = RAW / f"{name}_{k}.mp3"
    if out.exists(): return out
    body = {"text": text, "duration_seconds": dur, "prompt_influence": 0.55}
    subprocess.run(["curl", "-sS", "--max-time", "120", "-X", "POST", "https://api.elevenlabs.io/v1/sound-generation", "-H", "Content-Type: application/json",
                    "-d", json.dumps(body), "-o", str(out)], check=True)
    return out
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "f32le", "-ac", "2", "-ar", "48000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
man = json.loads((OUT / "manifest.json").read_text())
for name, (text, dur) in SPECS.items():
    best = None
    for k in (1, 2):
        p = gen(name, text, dur, k)
        try:
            a = load(p)
        except Exception as e:
            print(name, k, "decode failed", e); continue
        m = np.abs(a).max(axis=1)
        if m.max() < 1e-4: continue
        # crest factor as a punchiness proxy; prefer the louder transient for hits
        score = m.max() / (np.sqrt((a ** 2).mean()) + 1e-9)
        if best is None or score > best[0]: best = (score, a, k)
    if best is None: print(name, "no usable take"); continue
    a = best[1]
    env = np.abs(a).max(axis=1)
    start = max(0, int(np.argmax(env > env.max() * 0.08)) - 480)
    a = a[start:]
    end = len(a) - int(np.argmax(np.abs(a[::-1]).max(axis=1) > np.abs(a).max() * 0.01))
    a = a[: max(end, 4800)]
    fade = min(len(a) // 4, 4800); a[-fade:] *= np.linspace(1, 0, fade)[:, None]
    a = a / (np.abs(a).max() + 1e-9) * 0.89
    peak = float(np.argmax(np.abs(a).max(axis=1)) / 48000)
    wav = OUT / f"{name}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", "48000", "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", str(wav)], input=a.astype(np.float32).tobytes(), check=True)
    man[name] = {"file": f"audio/sfx/{name}.wav", "duration_s": round(len(a) / 48000, 3), "peak_time_s": round(peak, 3), "source": "elevenlabs", "prompt_or_recipe": text, "notes": f"v3 hype set, take {best[2]}"}
    print(name, "take", best[2], "dur", round(len(a) / 48000, 2), "peak", round(peak, 3))
(OUT / "manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=1))
# QA sheet
files = [OUT / f"{n}.wav" for n in SPECS if (OUT / f"{n}.wav").exists()]
for f in files:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-lavfi", f"showspectrumpic=s=400x160:legend=0:scale=log,drawtext=text='{f.stem}':fontcolor=white:fontsize=16:x=6:y=4", str(RAW / f"{f.stem}_spec.png")], check=True)
print("done")
