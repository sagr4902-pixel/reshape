"""Copy the chosen VO takes to public/audio/vo/ and write word timings (vo_timing.json).

Choice (eleven_v4, all takes transcribe 100% correct; picked for pause shape and no digital-silence gaps):
"""
import json, pathlib, shutil, subprocess, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TAKES = ROOT / "public" / "audio" / "vo" / "takes"
OUTDIR = ROOT / "public" / "audio" / "vo"
CHOICE = {"L1": "a", "L2": "a", "L3": "b", "L4": "a", "L5": "a", "L6": "b"}
MODEL = "eleven_v4"

def words_from_alignment(al):
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, cs, ce = [], "", None, None
    for ch, s, e in zip(chars, st, en):
        if ch.isspace():
            if cur:
                words.append({"w": cur, "start": cs, "end": ce}); cur = ""
            continue
        if not cur: cs = s
        cur += ch; ce = e
    if cur: words.append({"w": cur, "start": cs, "end": ce})
    return words

def dur(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip())

out = {"model": MODEL, "voice_id": "96donzfHvBagGuYj2GLW", "lines": {}}
for lid, tag in CHOICE.items():
    stem = f"{lid}_{MODEL}_{tag}"
    meta = json.loads((TAKES / f"{stem}.json").read_text())
    dst = OUTDIR / f"{lid}.mp3"
    shutil.copy(TAKES / f"{stem}.mp3", dst)
    words = words_from_alignment(meta["alignment"])
    out["lines"][lid] = {"file": f"audio/vo/{lid}.mp3", "take": stem, "text": meta["text"],
                         "duration": round(dur(dst), 3), "speech_start": words[0]["start"], "speech_end": words[-1]["end"],
                         "words": words}
(ROOT / "src" ).mkdir(exist_ok=True)
(ROOT / "src" / "vo_timing.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
for lid, d in out["lines"].items():
    print(lid, d["take"], f"dur={d['duration']:.2f}", " | ".join(f"{w['w']}@{w['start']:.2f}" for w in d["words"]))
