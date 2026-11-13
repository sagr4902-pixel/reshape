"""Pick v3 takes → public/audio/vo3/*.mp3 and src/vo3_timing.json (word timings + loudness envelope)."""
import json, pathlib, shutil, subprocess
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "public/audio/vo3/takes"; OUT = ROOT / "public/audio/vo3"
CHOICE = {"V1": "x", "V2": "x", "V3": "qf", "V4": "qz", "V5": "b", "V6": "qx", "V7": "a", "V8": "qx", "V9": "a"}  # q*: standard ق (v3.1)
def words(al):
    out, cur, cs, ce = [], "", None, None
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: out.append({"w": cur, "start": cs, "end": ce}); cur = ""
            continue
        if not cur: cs = s
        cur += ch; ce = e
    if cur: out.append({"w": cur, "start": cs, "end": ce})
    # drop audio tags like [excited] from the word list
    return [w for w in out if not (w["w"].startswith("[") and w["w"].endswith("]"))]
res = {"lines": {}}
for lid, tag in CHOICE.items():
    src = T / f"{lid}_{tag}.mp3"; meta = json.loads((T / f"{lid}_{tag}.json").read_text())
    dst = OUT / f"{lid}.mp3"; shutil.copy(src, dst)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(dst), "-f", "f32le", "-ac", "1", "-ar", "48000", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32); hop = 1600; n = int(np.ceil(len(a) / hop)); a2 = np.pad(a, (0, n * hop - len(a)))
    env = np.sqrt((a2.reshape(n, hop) ** 2).mean(1)); env = env / (env.max() + 1e-9)
    ws = words(meta["alignment"])
    t0 = ws[0]["start"] if ws else 0.0  # tag prefix shifts the first word; keep absolute audio times
    res["lines"][lid] = {"file": f"audio/vo3/{lid}.mp3", "text": meta["text"], "duration": round(len(a) / 48000, 3), "words": ws, "env": [round(float(x), 3) for x in env], "first": t0}
(ROOT / "src/vo3_timing.json").write_text(json.dumps(res, ensure_ascii=False))
for k, v in res["lines"].items(): print(k, v["duration"], "first word at", round(v["first"], 2), [w["w"] for w in v["words"]])
