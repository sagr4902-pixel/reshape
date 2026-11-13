"""v3 hype voice-over: python3 vo3_generate.py <tag> <stability> [tagword]   (ONLY=V3,V4 to limit lines)"""
import base64, json, os, subprocess, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
S = json.loads((ROOT / "scripts" / "vo3_script.json").read_text())
OUT = ROOT / "public" / "audio" / "vo3" / "takes"
tag, stab = sys.argv[1], float(sys.argv[2])
prefix = (sys.argv[3] + " ") if len(sys.argv) > 3 else ""
lines = S["lines"]
only = set(filter(None, os.environ.get("ONLY", "").split(",")))
for i, l in enumerate(lines):
    if only and l["id"] not in only: continue
    body = {"text": prefix + l["text"], "model_id": "eleven_v4",
            "voice_settings": {"stability": stab, "similarity_boost": 0.88, "style": 0.0, "use_speaker_boost": True}}
    if i > 0: body["previous_text"] = lines[i - 1]["text"]
    if i + 1 < len(lines): body["next_text"] = lines[i + 1]["text"]
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{S['voice_id']}/with-timestamps?output_format=mp3_44100_192"
    r = subprocess.run(["curl", "-sS", "--max-time", "120", "-X", "POST", url, "-H", "Content-Type: application/json", "-d", json.dumps(body, ensure_ascii=False)], capture_output=True)
    try:
        d = json.loads(r.stdout)
    except Exception:
        print(l["id"], "FAILED", r.stdout[:200]); continue
    if "audio_base64" not in d:
        print(l["id"], "FAILED", str(d)[:200]); continue
    stem = f"{l['id']}_{tag}"
    (OUT / f"{stem}.mp3").write_bytes(base64.b64decode(d["audio_base64"]))
    (OUT / f"{stem}.json").write_text(json.dumps({"text": l["text"], "alignment": d.get("alignment")}, ensure_ascii=False))
    print(stem, round((d.get("alignment") or {}).get("character_end_times_seconds", [0])[-1], 2), "s")
