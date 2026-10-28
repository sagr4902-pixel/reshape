"""Technical QA of the rendered motion-graphics commercial.

  1. container / stream specs            4. NO MUSIC: the mix is silent wherever there is no VO and no SFX event
  2. loudness + true peak (EBU R128)      5. RESHAPE pronunciation measured in the ENCODED audio of the MP4
  3. black / frozen frames

Usage: python3 scripts/qa_motion.py out/RESHAPE_Premium_Motion_Graphics_35s.mp4   (run from video/)
"""
import json
import re
import subprocess
import sys

import numpy as np

sys.path.insert(0, "scripts")
from vowel_probe import load, measure, verdict  # noqa: E402

SR = 48000


def run(*cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.stdout + p.stderr


def decode(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def main(mp4):
    tl = json.load(open("src/motion/timeline.json", encoding="utf-8"))
    report = {}

    # 1. specs
    pr = json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", mp4))
    v = next(s for s in pr["streams"] if s["codec_type"] == "video")
    a = next(s for s in pr["streams"] if s["codec_type"] == "audio")
    report["video"] = f'{v["codec_name"]} {v.get("profile")} {v["width"]}x{v["height"]} {v["r_frame_rate"]} fps, {v["nb_frames"]} frames, {v["pix_fmt"]}, {v.get("color_space")}'
    report["audio"] = f'{a["codec_name"]} {a["sample_rate"]} Hz {a["channels"]} ch {int(a["bit_rate"]) // 1000} kb/s'
    report["duration_s"] = round(float(pr["format"]["duration"]), 3)
    report["size_MB"] = round(int(pr["format"]["size"]) / 1e6, 1)

    # 2. loudness
    e = run("ffmpeg", "-nostats", "-i", mp4, "-filter_complex", "ebur128=peak=true", "-f", "null", "-")
    summ = e[e.rfind("Summary:"):]
    report["integrated_LUFS"] = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
    report["true_peak_dBTP"] = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
    report["LRA_LU"] = float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1))

    # 3. black / frozen frames
    bd = run("ffmpeg", "-i", mp4, "-vf", "blackdetect=d=0.1:pix_th=0.06", "-an", "-f", "null", "-")
    report["black_segments"] = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)
    fd = run("ffmpeg", "-i", mp4, "-vf", "freezedetect=n=0.0005:d=0.5", "-an", "-f", "null", "-")
    report["frozen_segments"] = re.findall(r"freeze_start: ([\d.]+)", fd), re.findall(r"freeze_end: ([\d.]+)", fd)

    # 4. no music: outside VO lines (+/-0.15 s) and SFX events (+/-0.9 s) the mix must be (near) silent
    x = decode(mp4)
    hop = int(0.05 * SR)
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x) - hop, hop)])
    db = 20 * np.log10(rms)
    t = np.arange(len(db)) * 0.05
    busy = np.zeros(len(db), bool)
    for ln in tl["voLines"]:
        busy |= (t >= ln["start"] - 0.15) & (t <= ln["end"] + 0.15)
    sfx = [0.0, tl["logoHit"], tl["endCardAt"]] + [s["start"] for s in tl["scenes"][1:]]
    for s in sfx:
        busy |= (t >= s - 0.9) & (t <= s + 0.9)
    free = db[~busy]
    report["no_music"] = {
        "seconds_without_vo_or_sfx": round(len(free) * 0.05, 2),
        "max_level_there_dBFS": round(float(free.max()), 1) if len(free) else None,
        "median_level_there_dBFS": round(float(np.median(free)), 1) if len(free) else None,
        "pass": bool(len(free) and free.max() < -55),
    }
    # ... and the whole mix is nothing but the two stems: subtract VO + SFX, measure what is left
    stems = decode("public/audio/motion/vo.wav") + decode("public/audio/motion/sfx.wav")
    n = min(len(x), len(stems))
    # x[t] ~ stems[t + lag]  (AAC priming / encoder delay, normally trimmed to 0)
    lag = int(np.argmax(np.correlate(stems[SR - 2048:SR * 3 + 2048], x[SR:SR * 3], "valid"))) - 2048
    ref = np.roll(stems, -lag)[:n]
    g = float(np.dot(x[:n], ref) / np.dot(ref, ref))
    resid = x[:n] - g * ref
    report["no_music"]["residual_after_removing_vo_and_sfx_dB"] = round(10 * np.log10(np.sum(resid ** 2) / np.sum(x[:n] ** 2)), 1)
    report["no_music"]["stem_alignment_samples"] = lag

    # 5. RESHAPE /riːˈʃeɪp/ in the encoded audio
    y = load(mp4)
    hits = [w for w in tl["words"] if w["text"].startswith("RESHAPE")]
    report["reshape"] = []
    for w in hits:
        m = measure(y, w["start"] - 0.08, w["end"] + 0.12)
        ok, why = verdict(m)
        report["reshape"].append({"at": w["start"], "dur_ms": m.get("dur_ms"), "F1": m.get("F1"), "F2": m.get("F2"), "pass": ok, "verdict": why})

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(sys.argv[1])
