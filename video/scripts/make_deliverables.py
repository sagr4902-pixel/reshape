"""Write the text/audio deliverables that sit next to the rendered MP4.

  out/RESHAPE_Arabic_Subtitles.srt   - from the VO word timings in src/lib/timeline.json
  out/RESHAPE_Saudi_Voiceover.wav    - the VO stem exactly as used in the mix (48 kHz / 24-bit)

Usage: python3 scripts/make_deliverables.py   (run from the video/ folder, after build_audio.py)
"""

import json
import shutil

RLM = "‏"  # keeps trailing Arabic punctuation on the correct side in players that default to LTR

# Words per subtitle cue, per VO line (two cues per line, split at the natural pause).
CUES = {"hook": [4, 5], "brand": [7, 4], "group": [4, 7], "motivation": [3, 4], "cta": [5, 5]}


def ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def main():
    tl = json.load(open("src/lib/timeline.json", encoding="utf-8"))
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
    with open("out/RESHAPE_Arabic_Subtitles.srt", "w", encoding="utf-8") as f:
        for n, (s, e, text) in enumerate(cues, 1):
            f.write(f"{n}\n{ts(s)} --> {ts(e)}\n{RLM}{text}{RLM}\n\n")
    shutil.copyfile("public/audio/vo.wav", "out/RESHAPE_Saudi_Voiceover.wav")
    print(f"{len(cues)} cues written")


if __name__ == "__main__":
    main()
