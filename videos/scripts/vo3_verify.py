"""Check v3 takes: Scribe transcript + how each qaf is voiced.

python3 vo3_verify.py V3_qx V4_qa ...   (take stems in public/audio/vo3/takes)

For every ق / گ in the take's alignment it measures the quietest 15 ms inside the consonant
(relative to the take's loudest 15 ms). A standard /q/ is a voiceless stop, so its closure is
near-silent (about -30 dB or lower); the colloquial /g/ keeps voicing through the closure
(about -15 to -25 dB).
"""
import json, subprocess, sys, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "public/audio/vo3/takes"
SR = 48000

def transcribe(path):
    cache = path.with_suffix(".stt.json")
    if cache.exists():
        return json.loads(cache.read_text())
    r = subprocess.run(["curl", "-sS", "--max-time", "120", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text",
                        "-F", "model_id=scribe_v1", "-F", "language_code=ar", "-F", "tag_audio_events=false",
                        "-F", f"file=@{path}"], capture_output=True)
    d = json.loads(r.stdout)
    cache.write_text(json.dumps(d, ensure_ascii=False))
    return d

def qaf_closures(stem):
    meta = json.loads((T / f"{stem}.json").read_text())["alignment"]
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(T / f"{stem}.mp3"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32)
    win, hop = int(0.015 * SR), int(0.005 * SR)
    rms = np.array([np.sqrt(np.mean(a[i:i + win] ** 2) + 1e-12) for i in range(0, len(a) - win, hop)])
    ref = rms.max()
    out = []
    for ch, s, e in zip(meta["characters"], meta["character_start_times_seconds"], meta["character_end_times_seconds"]):
        if ch in "قگ":
            i0, i1 = int(max(0, s - 0.03) * SR / hop), int((e + 0.02) * SR / hop)
            seg = rms[i0:max(i1, i0 + 1)]
            out.append((ch, round(s, 2), round(20 * np.log10(seg.min() / ref), 1)))
    return out

for stem in sys.argv[1:]:
    d = transcribe(T / f"{stem}.mp3")
    q = qaf_closures(stem)
    verdict = ", ".join(f"{ch}@{t}s closure {db} dB → {'/q/' if db <= -28 else '/g/?'}" for ch, t, db in q)
    print(f"{stem:7s} «{d.get('text', '').strip()}»  |  {verdict}")
