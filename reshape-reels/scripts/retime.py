# -*- coding: utf-8 -*-
"""Retime the plate and every aligned matte with ONE frame map, so speaker,
isolate and edge stay frame-locked.

  ramp   17.30-17.59s to half speed  (arms coming up; silent, so lip sync is safe)
  freeze 18.09s for 0.90s            (peak double-biceps, in the gap between words)
  hold   last frame for 2.0s         (ending payoff)
"""
import subprocess, json, os
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")
P = "/home/user/reshape/reshape-reels/public"
W, H, FPS, N = 1350, 2400, 30, 763

RAMP0, RAMP1 = 519, 527      # source frames slowed 2x
FREEZE, HOLD = 542, 27       # freeze source frame for 27 extra frames
TAIL = 60                    # extra frames on the last source frame

def repeats(i):
    r = 1
    if RAMP0 <= i <= RAMP1: r = 2
    if i == FREEZE: r += HOLD
    if i == N - 1: r += TAIL
    return r

REPS = [repeats(i) for i in range(N)]
OUT_N = sum(REPS)

def retime(src, dst):
    dec = subprocess.Popen([FF,"-loglevel","error","-i",src,"-f","rawvideo","-pix_fmt","rgb24","-vsync","0","-"],
                           stdout=subprocess.PIPE, bufsize=10**8)
    enc = subprocess.Popen([FF,"-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}",
                            "-r",str(FPS),"-i","-","-c:v","libx264","-preset","veryfast","-crf","17",
                            "-pix_fmt","yuv420p",dst], stdin=subprocess.PIPE, bufsize=10**8)
    fsz = W*H*3
    for i in range(N):
        buf = dec.stdout.read(fsz)
        if len(buf) < fsz: break
        for _ in range(REPS[i]): enc.stdin.write(buf)
    enc.stdin.close(); enc.wait(); dec.stdout.close(); dec.wait()
    print("retimed", dst)

if __name__ == "__main__":
    print(f"source {N} -> output {OUT_N} frames ({OUT_N/FPS:.2f}s)")
    for a, b in (("speaker.mp4","speaker_v3.mp4"), ("isolate.mp4","isolate_v3.mp4"), ("edge.mp4","edge_v3.mp4")):
        retime(f"{P}/{a}", f"{P}/{b}")

    # remap tracking to output frames
    src_track = {r["f"]: r for r in json.load(open(f"{P}/track.json"))}
    out, o = [], 0
    for i in range(N):
        for _ in range(REPS[i]):
            r = dict(src_track.get(i, {})); r["f"] = o; out.append(r); o += 1
    json.dump(out, open(f"{P}/track_v3.json","w"))

    # audio: same map, with silence filling the ramp, the freeze and the tail
    segs = [
        ("cut", 0.0, RAMP0/FPS),
        ("sil", (RAMP1-RAMP0+1)*2/FPS),
        ("cut", (RAMP1+1)/FPS, FREEZE/FPS),
        ("sil", HOLD/FPS),
        ("cut", FREEZE/FPS, N/FPS),
        ("sil", TAIL/FPS),
    ]
    parts = []
    for k, s in enumerate(segs):
        f = f"/tmp/_a{k}.wav"
        if s[0] == "cut":
            subprocess.run([FF,"-loglevel","error","-y","-ss",str(s[1]),"-to",str(s[2]),
                            "-i",f"{P}/voice.wav","-c:a","pcm_s16le",f],check=True)
        else:
            subprocess.run([FF,"-loglevel","error","-y","-f","lavfi","-i",
                            f"anullsrc=r=48000:cl=stereo","-t",str(s[1]),"-c:a","pcm_s16le",f],check=True)
        parts.append(f)
    lst = "/tmp/_alist.txt"
    open(lst,"w").write("".join(f"file '{p}'\n" for p in parts))
    subprocess.run([FF,"-loglevel","error","-y","-f","concat","-safe","0","-i",lst,
                    "-c:a","pcm_s16le",f"{P}/voice_v3.wav"],check=True)
    print("audio retimed")
