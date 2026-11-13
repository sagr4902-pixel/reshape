"""Generate voice-over takes with ElevenLabs (with character timestamps).

Usage: python3 vo_generate.py <model_id> <take_tag> [line_ids...]
The API key is injected by the session's network proxy; nothing is read from env.
"""
import base64, json, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = json.loads((ROOT / "scripts" / "vo2_script.json").read_text())
OUT = ROOT / "public" / "audio" / "vo2" / "takes"
OUT.mkdir(parents=True, exist_ok=True)

SETTINGS = {
    "eleven_multilingual_v2": {"stability": 0.45, "similarity_boost": 0.85, "style": 0.2, "use_speaker_boost": True, "speed": 1.0},
    "eleven_v3": {"stability": 0.5, "similarity_boost": 0.85, "style": 0.0, "use_speaker_boost": True},
    "eleven_v4": {"stability": 0.62, "similarity_boost": 0.88, "style": 0.0, "use_speaker_boost": True},
}

def call(model, line, prev_text, next_text, use_context=True):
    body = {"text": line["text"], "model_id": model, "voice_settings": SETTINGS.get(model, SETTINGS["eleven_v3"])}
    if use_context:
        if prev_text: body["previous_text"] = prev_text
        if next_text: body["next_text"] = next_text
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{SCRIPT['voice_id']}/with-timestamps?output_format=mp3_44100_192"
    r = subprocess.run(["curl", "-sS", "--max-time", "120", "-X", "POST", url,
                        "-H", "Content-Type: application/json", "-d", json.dumps(body, ensure_ascii=False)],
                       capture_output=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"error": r.stdout[:400].decode("utf8", "replace") + r.stderr[:200].decode("utf8", "replace")}

def main():
    model, tag = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    lines = SCRIPT["lines"]
    for i, line in enumerate(lines):
        if only and line["id"] not in only:
            continue
        prev_text = lines[i - 1]["text"] if i > 0 else None
        next_text = lines[i + 1]["text"] if i + 1 < len(lines) else None
        d = call(model, line, prev_text, next_text)
        if "audio_base64" not in d:
            d = call(model, line, prev_text, next_text, use_context=False)
        if "audio_base64" not in d:
            print(line["id"], model, "FAILED", str(d)[:300]); continue
        stem = f"{line['id']}_{model}_{tag}"
        (OUT / f"{stem}.mp3").write_bytes(base64.b64decode(d["audio_base64"]))
        (OUT / f"{stem}.json").write_text(json.dumps({"text": line["text"], "model": model,
            "alignment": d.get("alignment"), "normalized_alignment": d.get("normalized_alignment")}, ensure_ascii=False))
        a = d.get("alignment") or {}
        end = (a.get("character_end_times_seconds") or [0])[-1]
        print(stem, f"speech_end={end:.2f}s")

main()
