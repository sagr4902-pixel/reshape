"""Final QA for a rendered "One Day" film.

  python3 scripts/qa_oneday.py <video.mp4> <yunet_models_dir>

Checks: resolution / fps / duration, integrated loudness and true peak, the brand vowel of
«ريشيب» measured inside the final mix (lines od4 and od11, cue frames from build_oneday_audio.py),
and a YuNet face scan of every 3rd frame (hits are saved for review by eye).
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
import vowel_probe  # noqa: E402

video, models = sys.argv[1], sys.argv[2]
FPS = 30
BRAND_CUES = {"od4": (200, 1.4), "od11": (1333, 1.2)}  # cue frame, window (s) that holds the brand word

probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", video],
                                  capture_output=True, text=True, check=True).stdout)
v = next(s for s in probe["streams"] if s["codec_type"] == "video")
a = next(s for s in probe["streams"] if s["codec_type"] == "audio")
print(f"video {v['width']}x{v['height']} {v['r_frame_rate']} {v['codec_name']} {v.get('pix_fmt')} | audio {a['codec_name']} {a['sample_rate']} Hz | {float(probe['format']['duration']):.2f}s")

ebu = subprocess.run(["ffmpeg", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", ebu)[-1]
P = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", ebu)[-1]
print(f"loudness {I} LUFS, true peak {P} dBTP")

wav = "/tmp/_qa_oneday.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-ac", "1", "-ar", "24000", wav], check=True)
x = vowel_probe.load(wav)
for name, (frame, win) in BRAND_CUES.items():
    t0 = frame / FPS
    m = vowel_probe.measure(x, t0, t0 + win)
    print(f"brand vowel in mix ({name} @ {t0:.2f}s): F1 {m.get('F1')} F2 {m.get('F2')} -> {vowel_probe.verdict(m)}")

out = os.path.splitext(video)[0] + "_faces"
r = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "qa_faces.py"), video, models, out, "3", "0.6"],
                   capture_output=True, text=True)
print("\n".join(r.stdout.splitlines()[:2]), f"(crops in {out})")
