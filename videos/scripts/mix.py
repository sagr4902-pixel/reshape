"""Build the final audio mix: voice-over + sound effects (no music), synced to frames.

Usage: python3 scripts/mix.py [cues.json]
- VO placements come from src/films/reshape/timeline.ts values passed in cues.json ("vo": {"L1": frame, ...}).
- Each SFX cue: {"s": name, "f": frame, "db": gain_dB, "pan": -1..1, "align": "peak"|"start", "dur": optional seconds (trim), "fade": seconds}
  With align=peak the sound's measured transient (manifest peak_time_s) lands exactly on frame f.
- Effects are ducked under the voice (sidechain-style envelope), then the whole mix is loudness-normalised
  to -14 LUFS integrated / -1.5 dBTP (two-pass ffmpeg loudnorm).
"""
import json, subprocess, sys, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
FPS = 30

def load(path, mono=False):
    cmd = ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1" if mono else "2", "-ar", str(SR), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32)
    return a.reshape(-1, 1) if mono else a.reshape(-1, 2)

def write(path, a):
    a = np.clip(a, -1, 1).astype(np.float32)
    p = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", str(path)], input=a.tobytes())
    assert p.returncode == 0

def env_follow(x, attack_s, release_s):
    a = np.exp(-1.0 / (attack_s * SR / 64)); r = np.exp(-1.0 / (release_s * SR / 64))
    # work on 64-sample blocks for speed
    n = len(x) // 64
    blk = np.sqrt(np.mean(x[: n * 64].reshape(n, 64) ** 2, axis=1) + 1e-12)
    out = np.zeros_like(blk); e = 0.0
    for i, v in enumerate(blk):
        c = a if v > e else r
        e = c * e + (1 - c) * v
        out[i] = e
    return np.repeat(out, 64)[: len(x)] if n else np.zeros(len(x))

def main():
    cues_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "scripts" / "cues.json"
    cues = json.loads(cues_path.read_text())
    total_s = cues["total_frames"] / FPS + 0.5
    N = int(total_s * SR)
    vo_bus = np.zeros((N, 2), np.float32)
    fx_bus = np.zeros((N, 2), np.float32)
    amb_bus = np.zeros((N, 2), np.float32)
    timing = json.loads((ROOT / cues.get("timing", "src/vo_timing.json")).read_text())
    for lid, frame in cues["vo"].items():
        v = load(ROOT / "public" / timing["lines"][lid]["file"], mono=True)[:, 0] * 10 ** (cues.get("vo_db", 0) / 20)
        s = int(frame / FPS * SR)
        e = min(N, s + len(v))
        vo_bus[s:e, 0] += v[: e - s]; vo_bus[s:e, 1] += v[: e - s]
    manifest = json.loads((ROOT / "public" / "audio" / "sfx" / "manifest.json").read_text())
    cache = {}
    for c in cues["sfx"]:
        name = c["s"]
        if name not in manifest:
            print("missing sfx:", name); continue
        if name not in cache:
            cache[name] = load(ROOT / "public" / manifest[name]["file"])
        a = cache[name].copy()
        if c.get("dur"):
            a = a[: int(c["dur"] * SR)]
        fade = c.get("fade", 0.03)
        nf = max(1, int(fade * SR))
        a[-nf:] *= np.linspace(1, 0, nf)[:, None]
        if c.get("fadein"):
            ni = int(c["fadein"] * SR)
            a[:ni] *= np.linspace(0, 1, ni)[:, None]
        g = 10 ** (c.get("db", 0) / 20)
        pan = c.get("pan", 0.0)
        a = a * g
        a[:, 0] *= np.sqrt((1 - pan) / 2) * np.sqrt(2); a[:, 1] *= np.sqrt((1 + pan) / 2) * np.sqrt(2)
        offset = manifest[name].get("peak_time_s", 0.0) if c.get("align", "peak") == "peak" else 0.0
        s = int((c["f"] / FPS - offset) * SR)
        if s < 0:
            a = a[-s:]; s = 0
        e = min(N, s + len(a))
        bus = amb_bus if c.get("bus") == "amb" else fx_bus
        bus[s:e] += a[: e - s]
    # duck effects + ambience under the voice
    venv = env_follow(vo_bus[:, 0], 0.02, 0.35)
    duck_db = cues.get("duck_db", -7.0)
    k = np.clip(venv / 0.02, 0, 1)  # 0 when silent, 1 when speaking
    gain = 10 ** ((duck_db * k) / 20)
    fx_bus *= gain[:, None]
    amb_bus *= (10 ** ((duck_db * 0.6 * k) / 20))[:, None]
    mix = vo_bus + fx_bus + amb_bus
    # gentle tail fade
    tf = int(0.6 * SR); mix[-tf:] *= np.linspace(1, 0, tf)[:, None]
    out_dir = ROOT / cues.get("out_dir", "public/audio/mix"); out_dir.mkdir(parents=True, exist_ok=True)
    name = cues.get("out_name", "reshape_mix")
    pre = out_dir / f"{name}_premaster.wav"
    write(pre, mix / max(1.0, np.max(np.abs(mix)) / 0.98))
    for stem, bus in (("stem_vo.wav", vo_bus), ("stem_sfx.wav", fx_bus + amb_bus)):
        write(out_dir / stem, bus)
    # two-pass loudnorm to -14 LUFS / -1.5 dBTP
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(pre), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    js = r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1]
    m = json.loads(js)
    final = out_dir / f"{name}.wav"
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(pre), "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", str(final)], check=True)
    r2 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(final), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    I = r2.stderr.split("Integrated loudness:")[-1].split("LUFS")[0].split("I:")[-1].strip()
    tp = r2.stderr.split("True peak:")[-1].split("dBFS")[0].split("Peak:")[-1].strip() if "True peak:" in r2.stderr else "?"
    print(f"wrote {final}  integrated={I} LUFS  true_peak={tp} dBFS")

main()
