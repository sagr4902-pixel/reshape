"""Transcribe every VO take with ElevenLabs Scribe and score it against the script.

Prints per take: transcript, word/char similarity, duration, leading silence, longest pause, loudness.
"""
import json, re, subprocess, sys, pathlib, difflib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TAKES = ROOT / "public" / "audio" / "vo" / "takes"
DIAC = re.compile(r"[\u064B-\u0652\u0670\u0640]")

def norm(s):
    s = re.sub(r"(?i)\breshape\b", "ريشيب", s)
    s = re.sub(r"(?i)(الـ\s*)?\bcalisthenics\b", "الكالستنكس", s)
    s = DIAC.sub("", s)
    s = re.sub(r"[أإآ]", "ا", s).replace("ى", "ي").replace("ة", "ه")
    s = re.sub(r"[^\w\s]", " ", s)
    return " ".join(s.split())

def transcribe(path):
    cache = path.with_suffix(".stt.json")
    if cache.exists():
        return json.loads(cache.read_text())
    r = subprocess.run(["curl", "-sS", "--max-time", "120", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text",
                        "-F", "model_id=scribe_v1", "-F", "language_code=ar", "-F", "timestamps_granularity=word",
                        "-F", "tag_audio_events=false", "-F", f"file=@{path}"], capture_output=True)
    d = json.loads(r.stdout)
    cache.write_text(json.dumps(d, ensure_ascii=False))
    return d

def audio_stats(path):
    # silence map + loudness via ffmpeg
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
                        "silencedetect=noise=-38dB:d=0.12,ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    err = r.stderr
    dur = float(re.findall(r"Duration: (\d+):(\d+):([\d.]+)", err)[0][2]) + 60 * int(re.findall(r"Duration: (\d+):(\d+)", err)[0][1])
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    lead = ends[0] if starts and starts[0] < 0.01 and ends else 0.0
    pauses = [e - s for s, e in zip(starts, ends) if s > 0.05 and e < dur - 0.05]
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", err)
    return dur, lead, max(pauses) if pauses else 0.0, float(I[-1]) if I else None

def main():
    script = {l["id"]: l["text"] for l in json.loads((ROOT / "scripts" / "vo_script.json").read_text())["lines"]}
    rows = []
    for mp3 in sorted(TAKES.glob("*.mp3")):
        lid = mp3.stem.split("_")[0]
        if len(sys.argv) > 1 and not any(a in mp3.stem for a in sys.argv[1:]):
            continue
        d = transcribe(mp3)
        text = d.get("text", "") if isinstance(d, dict) else ""
        ref, hyp = norm(script[lid]), norm(text)
        wsim = difflib.SequenceMatcher(None, ref.split(), hyp.split()).ratio()
        csim = difflib.SequenceMatcher(None, ref.replace(" ", ""), hyp.replace(" ", "")).ratio()
        dur, lead, pause, lufs = audio_stats(mp3)
        rows.append((mp3.stem, wsim, csim, dur, lead, pause, lufs, text))
    for r in rows:
        print(f"{r[0]:<34} words={r[1]:.2f} chars={r[2]:.2f} dur={r[3]:.2f}s lead={r[4]:.2f}s maxpause={r[5]:.2f}s I={r[6]} LUFS\n    -> {r[7]}")

main()
