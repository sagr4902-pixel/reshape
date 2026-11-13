"""Objective 'no voices' check: run ElevenLabs Scribe speech-to-text (with audio-event tagging) on finals.

Usage: python3 sfx_voicecheck.py name [name ...]
Prints the transcript / tagged events per file and stores them in public/audio/sfx/_takes/voicecheck.json.
An empty transcript (or only non-speech event tags such as footsteps) = no intelligible voice found.
"""
import json
import subprocess
import sys

from sfx_common import SFX, TAKES


def stt(path):
    r = subprocess.run(["curl", "-sS", "--max-time", "180", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text",
                        "-F", "model_id=scribe_v1", "-F", "tag_audio_events=true", "-F", f"file=@{path}"],
                       capture_output=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"error": r.stdout[:300].decode("utf8", "replace")}


def main():
    out_p = TAKES / "voicecheck.json"
    store = json.loads(out_p.read_text()) if out_p.exists() else {}
    for nm in sys.argv[1:]:
        d = stt(SFX / f"{nm}.wav")
        words = [w for w in d.get("words", []) if w.get("type") == "word"]
        events = [w.get("text") for w in d.get("words", []) if w.get("type") == "audio_event"]
        store[nm] = {"text": d.get("text", ""), "n_words": len(words), "events": events,
                     "language": d.get("language_code"), "lang_prob": d.get("language_probability"),
                     "error": d.get("error") or d.get("detail")}
        print(f"{nm:<16} words={len(words):<3} events={events} text={d.get('text', '')!r} "
              f"lang={d.get('language_code')} p={d.get('language_probability')}"
              + (f" ERROR {store[nm]['error']}" if store[nm]["error"] else ""))
    out_p.write_text(json.dumps(store, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
