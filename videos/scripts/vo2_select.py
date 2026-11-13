"""Pick the v2 takes, write word timings + per-frame loudness (for waveforms) to src/vo2_timing.json."""
import json, pathlib, shutil, subprocess
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
TAKES = ROOT / "public" / "audio" / "vo2" / "takes"
OUT = ROOT / "public" / "audio" / "vo2"
CHOICE = {"H1": "a", "H2": "b", "H3": "a", "H4": "b", "R1a": "a", "R1b": "b", "R1c": "a", "R2a": "b", "R2b": "a", "R2c": "a",
          "R3a": "b", "R3b": "a", "R3c": "a", "A1": "a", "A2": "a", "A3": "b", "A4": "a", "T1": "a", "P1": "a", "P2": "a", "P3": "a", "C1": "a"}
FPS = 30

def words_from_alignment(al):
    out, cur, cs, ce = [], "", None, None
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: out.append({"w": cur, "start": cs, "end": ce}); cur = ""
            continue
        if not cur: cs = s
        cur += ch; ce = e
    if cur: out.append({"w": cur, "start": cs, "end": ce})
    return out

def envelope(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "48000", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32)
    hop = 48000 // FPS
    n = int(np.ceil(len(a) / hop))
    a = np.pad(a, (0, n * hop - len(a)))
    rms = np.sqrt((a.reshape(n, hop) ** 2).mean(1))
    rms = rms / (rms.max() + 1e-9)
    bars = 44
    seg = np.array_split(rms, bars)
    summary = [float(np.sqrt((s ** 2).mean())) if len(s) else 0.0 for s in seg]
    m = max(summary) or 1
    return [round(float(x), 3) for x in rms], [round(x / m, 3) for x in summary], len(a) / 48000

lines = json.loads((ROOT / "scripts" / "vo2_script.json").read_text())["lines"]
res = {"model": "eleven_v4", "voice_id": "96donzfHvBagGuYj2GLW", "lines": {}}
for l in lines:
    lid = l["id"]; stem = f"{lid}_eleven_v4_{CHOICE[lid]}"
    meta = json.loads((TAKES / f"{stem}.json").read_text())
    dst = OUT / f"{lid}.mp3"; shutil.copy(TAKES / f"{stem}.mp3", dst)
    env, bars, dur = envelope(dst)
    res["lines"][lid] = {"file": f"audio/vo2/{lid}.mp3", "take": stem, "text": l["text"], "duration": round(dur, 3),
                         "words": words_from_alignment(meta["alignment"]), "env": env, "bars": bars}
(ROOT / "src" / "vo2_timing.json").write_text(json.dumps(res, ensure_ascii=False))
print("lines:", len(res["lines"]), "total speech:", round(sum(v["duration"] for v in res["lines"].values()), 2), "s")
