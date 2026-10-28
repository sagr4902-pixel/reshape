"""Write the text/audio deliverables that sit next to the rendered MP4.

  out/RESHAPE_Arabic_Subtitles.srt   - from the VO word timings in src/lib/timeline.json
  out/RESHAPE_Saudi_Voiceover.wav    - the VO stem exactly as used in the mix (48 kHz / 24-bit)

With --motion (the music-free motion-graphics version, after build_motion_audio.py):
  out/RESHAPE_Premium_Motion_Graphics_Arabic_Subtitles.srt  - from src/motion/timeline.json
  out/RESHAPE_Saudi_Voiceover_Corrected.wav                 - public/audio/motion/vo.wav

Usage: python3 scripts/make_deliverables.py [--motion]   (run from the video/ folder)
"""

import json
import shutil
import sys

RLM = "‏"  # keeps trailing Arabic punctuation on the correct side in players that default to LTR

# Words per subtitle cue, per VO line (two cues per line, split at the natural pause).
CUES = {"hook": [4, 5], "brand": [7, 4], "group": [4, 7], "motivation": [3, 4], "cta": [5, 5]}


def ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


VERSIONS = {
    "v1": ("src/lib/timeline.json", "out/RESHAPE_Arabic_Subtitles.srt", "public/audio/vo.wav", "out/RESHAPE_Saudi_Voiceover.wav"),
    "motion": (
        "src/motion/timeline.json",
        "out/RESHAPE_Premium_Motion_Graphics_Arabic_Subtitles.srt",
        "public/audio/motion/vo.wav",
        "out/RESHAPE_Saudi_Voiceover_Corrected.wav",
    ),
}


def main():
    timeline, srt, vo_src, vo_out = VERSIONS["motion" if "--motion" in sys.argv else "v1"]
    tl = json.load(open(timeline, encoding="utf-8"))
    words = tl["words"]
    cues = []
    i = 0
    for line in tl["voLines"]:
        for n in CUES[line["id"]]:
            chunk = words[i:i + n]
            i += n
            cues.append([chunk[0]["start"] - 0.05, chunk[-1]["end"] + 0.35, " ".join(w["text"] for w in chunk)])
    assert i == len(words), "cue split does not cover every VO word"
    for a, b in zip(cues, cues[1:]):
        a[1] = min(a[1], b[0] - 0.04)
        a[1] = max(a[1], a[0] + 1.0)
    with open(srt, "w", encoding="utf-8") as f:
        for n, (s, e, text) in enumerate(cues, 1):
            f.write(f"{n}\n{ts(s)} --> {ts(e)}\n{RLM}{text}{RLM}\n\n")
    shutil.copyfile(vo_src, vo_out)
    print(f"{len(cues)} cues written to {srt}; VO copied to {vo_out}")


if __name__ == "__main__":
    main()
