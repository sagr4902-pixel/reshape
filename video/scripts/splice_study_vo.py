"""Put the coach-approved pronunciations into two lines of the studies reel voice-over.

The model misread «حمل» and «سهل» inside the full lines, so the clause holding each word was generated
again on its own (audition/qarnat_1, audition/sahal_2: the coach picked each by ear) and is cut in here between the
pauses of the original take. Sources stay as s2_src.mp3 / s3_src.mp3; outputs are s2.mp3 / s3.mp3.
Usage: python3 scripts/splice_study_vo.py   (from video/)
"""
import subprocess

import numpy as np

SR = 48000
D = "audio-src/study/"


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def rms(x):
    return np.sqrt(np.mean(x ** 2)) + 1e-9


def join(parts, fade=0.02):
    n = int(fade * SR)
    parts = [p for p in parts if len(p) > n]
    out = parts[0].copy()
    for p in parts[1:]:
        p = p.copy()
        out[-n:] *= np.linspace(1, 0, n)
        p[:n] *= np.linspace(0, 1, n)
        out = np.concatenate([out[:-n], out[-n:] + p[:n], p[n:]])
    return out


def splice(line, clause, head_end, cut0, cut1, tail_start, clause_end):
    """Replace line[cut0:cut1] (the old clause's speech) by clause[:clause_end]; keep line[:head_end] and line[tail_start:]."""
    x, c = load(D + line + "_src.mp3"), load(D + clause)
    s = lambda t: int(t * SR)
    new = c[:s(clause_end)] * (rms(x[s(cut0):s(cut1)]) / rms(c[:s(clause_end)]))
    y = join([x[:s(head_end)], new, x[s(tail_start):]])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", D + line + ".mp3"],
                   input=y.astype(np.float32).tobytes(), check=True)
    print(line, round(len(y) / SR, 2), "s")


# «دراسه يابانيه… قارنت الضغط بالبنش برس بحِمْل متقارب…»: the whole opening, old speech 0.02–4.07 s
# (qarnat_1: «دراسه» with a final h, «قارنت» with a real qaf, «حِمْل» in IPA)
splice("s2", "audition/qarnat_1.mp3", 0, 0.02, 4.07, 4.30, 4.34)
# «…كل ما سَهَلْ عليك، صعّبه…»: old clauses 3.37–5.20 s
splice("s3", "audition/sahal_2.mp3", 3.15, 3.37, 5.20, 5.38, 2.26)
