"""Render the final RESHAPE SFX library from the selected candidates, then write manifest + QA sheet.

Usage:
  python3 sfx_finalize.py                      # render every final into public/audio/sfx/, manifest, contact sheet
  python3 sfx_finalize.py --out DIR name ...   # preview selected entries (or alternates "name@alt") into DIR

Per one-shot:  source take (ElevenLabs: declip + 200 Hz-comb de-whine; procedural: as rendered) -> window
-> optional filter -> trim leading silence to 10 ms before the attack -> fade-out -> -1 dBFS peak ->
48 kHz / stereo / 24-bit WAV.  Ambiences: no trim/fade (seamless loops), gain to -20 LUFS integrated.
"""
import json
import pathlib
import sys

import numpy as np
import pyloudnorm as pyln

from sfx_common import (SFX, SR, TAKES, band_flatness, butter_zp, db, declip, decomb, env_rms, flatness,
                        harmonicity, load, onset_index, save, tonal_lines)

PRE_ROLL = 0.010
EL_DEFAULT_HP = 40.0      # subsonic clean-up for every ElevenLabs take (4th-order, zero-phase)
PEAK_DBFS = -1.0
AMB_LUFS = -20.0

GEN = {e["take_id"]: e for e in json.loads((TAKES / "takes_log.json").read_text())}

# name: source ("el:<take>" | "proc:<design>"), win (s, in the take), hp (Hz, 4th-order zero-phase),
#       fade_out (s), fade_in (s, only when the window starts inside a sound), thr (onset threshold, dB
#       re peak), declip max run, kind, notes
SEL = {
    "tick_spark": dict(src="proc:tick_spark", fade_out=0.06,
                       notes="Snap + 6 decaying micro-crackles + 6.5 kHz sizzle + tiny bright room; no resonant filters, so no pitch."),
    "whoosh_light_1": dict(src="proc:whoosh_light_1", fade_out=0.06,
                           notes="Symmetric fast pass-by, pans left -> right. Peak = closest approach."),
    "whoosh_light_2": dict(src="proc:whoosh_light_2", fade_out=0.08,
                           notes="Sharp swipe: fast approach, airy receding tail, slightly right of centre."),
    "whoosh_light_3": dict(src="proc:whoosh_light_3", fade_out=0.06,
                           notes="Swell-in: long brightening build, quick release (element arriving), right -> centre. Peak is late."),
    "whoosh_deep_1": dict(src="proc:whoosh_deep_1", fade_out=0.12,
                          notes="Deep smooth camera-move pass-by with light sub layer, right -> left."),
    "whoosh_deep_2": dict(src="proc:whoosh_deep_2", fade_out=0.12,
                          notes="Deep swell with later peak, wide and centred, more sub."),
    "line_draw": dict(src="proc:line_draw", thr=-60, fade_out=0.0,
                      notes="Continuous soft air/hiss (centre ~3.6 kHz, slowly drifting) + very sparse faint fizz; 0.4 s fade-in / 0.65 s fade-out built in. Trim/loop freely in the middle."),
    "sub_impact_soft": dict(src="proc:sub_impact_soft", fade_out=0.2,
                            notes="Short pitch-falling knock (85->42 Hz, 85 ms decay) + low-passed noise body + 140-550 Hz presence so it still reads on phone speakers; dark short room."),
    "bar_settle": dict(src="el:bar_settle_b", win=(0.0, 0.86), fade_out=0.16,
                       notes="Two-stage steel clunk (seat + settle rattle) with short natural metal ring (partials ~1.6-3.7 kHz, physical, decays < 0.4 s)."),
    "grip_bar": dict(src="el:grip_bar_c", win=(0.50, 0.92), fade_out=0.1,
                     notes="Palm slap onto steel bar + short grip squeeze."),
    "jump_takeoff": dict(src="el:jump_takeoff_b", win=(0.0, 0.34), hp=90, fade_in=0.002, fade_out=0.08,
                         notes="Sneaker scuffs + push-off thump (90 Hz HP keeps it from turning into a stomp). The take began on the sound itself, so 10 ms of silence is prepended with a 2 ms fade-in."),
    "land_mat": dict(src="el:land_mat_a", win=(0.09, 0.56), fade_out=0.12,
                     notes="Padded two-foot landing thud with short mat compression; a later bounce in the take is faded out."),
    "cloth_1": dict(src="el:cloth_b", win=(0.12, 0.62), hp=160, fade_out=0.12,
                    notes="Quick sportswear swish + rustle. 160 Hz high-pass removes a body/handling thump in the take."),
    "cloth_2": dict(src="el:cloth_a", win=(0.60, 1.0), hp=160, declip=24, fade_out=0.1,
                    notes="Short sharp fabric 'fwip' (second event of the take). Declipped (runs up to 17 samples) + 160 Hz high-pass."),
    "exhale_effort": dict(src="el:exhale_effort_d", win=(0.48, 1.10), hp=110, fade_out=0.12,
                          notes="Single controlled unvoiced exhale (no stable pitch: f0 autocorrelation < 0.8 on every frame). Inhale before it trimmed off; 110 Hz HP removes mic breath-blast rumble."),
    "block_rise_1": dict(src="el:block_rise_a", win=(0.33, 0.95), hp=45, fade_out=0.12,
                         notes="Heavier clunk with two small settle knocks; deep body (45 Hz HP trims sub rumble)."),
    "block_rise_2": dict(src="el:block_rise_b", win=(0.28, 0.90), fade_out=0.12,
                         notes="Latch click then muted thunk ~0.1 s later (peak_time points at the thunk)."),
    "block_rise_3": dict(src="el:block_rise_d", win=(0.58, 1.0), fade_out=0.1,
                         notes="Single compact muted clunk (take ends at 1.0 s, so this variant is ~0.4 s)."),
    "hands_floor": dict(src="el:hands_floor_b", win=(0.09, 0.42), hp=60, fade_out=0.08,
                        notes="Palms slapped down on a mat: crisp skin slap + soft low thud."),
    "word_accent": dict(src="proc:word_accent", fade_out=0.08,
                        notes="Soft 'thock': low-passed noise thud (110-800 Hz) + very short 230->120 Hz knock (20 ms) + faint 1.5-4.5 kHz tick + small dark room."),
    "split_whoosh": dict(src="proc:split_whoosh", fade_out=0.15,
                         notes="Two independent air layers start together (L/R correlation 0.94) and recede to hard left / hard right (correlation 0.09 by the end)."),
    "rings_clank": dict(src="el:rings_clank_b", win=(0.33, 0.95), fade_out=0.12,
                        notes="Light buckle/carabiner clank + short strap creak; creak and clank partials are physical and short."),
    "kid_steps": dict(src="el:kid_steps_a", win=(0.09, 1.62), fade_out=0.1,
                      notes="Quick light child footsteps on a sports floor (~8 steps). Cadence is natural, not a beat."),
    "hoop_hop": dict(src="el:hoop_hop_b", win=(0.05, 0.48), fade_out=0.1,
                     notes="Small two-foot hop landing with a natural double touch (~50 ms apart)."),
    "high_five": dict(src="el:high_five_b", win=(0.20, 0.52), fade_in=0.008, fade_out=0.08,
                      notes="Crisp skin slap; hand-approach swish before it shortened with an 8 ms fade-in."),
    "room_tone_gym": dict(src="proc:room_tone_gym", kind="ambience", loop=True,
                          notes="Seamless 12 s loop (frequency-domain synthesis, exact period). HVAC-like air bed with slow drift + two barely audible distant reverberant thuds (from ElevenLabs foley takes land_mat_a and block_rise_b, low-passed and reverberated). No tonal lines, no rhythm."),
    "kids_area_air": dict(src="proc:kids_area_air", kind="ambience", loop=True,
                          notes="Bright soft air bed + distant light activity (steps, a hop, a mat pat: ElevenLabs foley takes kid_steps_a/b, hoop_hop_a, hands_floor_b, low-passed + hall reverb). No voices. Also loops seamlessly (8 s)."),
    "marker_tick": dict(src="proc:marker_tick", fade_out=0.06,
                        notes="Soft noise tick (1.2-6 kHz burst, 0.9 ms decay) + light body + faint airy glow; no resonant filter, no pitch."),
    "check_stamp": dict(src="el:check_stamp_b", win=(0.40, 0.80), fade_out=0.1,
                        notes="Self-inking stamp: muted thump on paper + its spring click ~60 ms later."),
    "riser_air": dict(src="proc:riser_air", thr=-60, fade_out=0.0, kind="riser",
                      notes="Non-tonal noise riser: band sweeps 320 Hz -> 9 kHz, widening, + reversed-reverb swell, rising hiss and light rumble. Ends at full level (6 ms cut) - place the hit at the file end (peak_time_s)."),
    "converge_swirl": dict(src="proc:converge_swirl", thr=-50, fade_out=0.1,
                           notes="Three air layers orbit (accelerating 0.65 -> 3.2 Hz, front/back brightness) and collapse to centre at ~1.6 s with a soft air 'whump'; short tail."),
    "logo_impact": dict(src="proc:logo_impact", fade_out=0.5,
                        notes="Crack + punch + low-passed-noise body/sub (textured, no sustained sine; 60->34 Hz knock decays in 70 ms) + air release + dark hall tail (~1.3 s)."),
    "glow_shimmer": dict(src="proc:glow_shimmer", thr=-50, fade_out=0.2,
                         notes="Airy 4 -> 10.7 kHz band sweep + sparse noise micro-grain sparkle through a bright short reverb; no sinusoids, so no pitch."),
}

ALT = {
    "grip_bar@a": dict(src="el:grip_bar_a", win=(0.25, 0.66), fade_out=0.1, notes=""),
    "jump_takeoff@a": dict(src="el:jump_takeoff_a", win=(0.0, 0.34), fade_out=0.08, notes=""),
    "bar_settle@a": dict(src="el:bar_settle_a", win=(0.0, 0.86), fade_out=0.16, notes=""),
    "cloth_2@c": dict(src="el:cloth_c", win=(0.12, 0.64), hp=160, fade_in=0.04, fade_out=0.15, notes=""),
    "word_accent@el": dict(src="el:word_accent_b", win=(0.29, 0.6), fade_out=0.08, notes=""),
    "exhale_effort@b": dict(src="el:exhale_effort_b", win=(0.0, 0.62), hp=110, fade_in=0.004, fade_out=0.15, notes=""),
}


def recipe_text(src):
    kind, ref = src.split(":", 1)
    if kind == "el":
        e = GEN[ref]
        return (f"ElevenLabs sound-generation ({e['model_id']}, {e['duration_seconds']} s, prompt_influence "
                f"{e['prompt_influence']}{', loop' if e.get('loop') else ''}; take '{ref}'): \"{e['prompt']}\"")
    return f"procedural: scripts/sfx_synth.py -> {ref}() (numpy/scipy, fixed seed)"


def render(cfg):
    kind, ref = cfg["src"].split(":", 1)
    x = load(TAKES / (f"{ref}.flac" if kind == "el" else f"proc_{ref}.flac"))
    proc = []
    if kind == "el":
        x, nfix, nlong = declip(x, max_run=cfg.get("declip", 16))
        x = decomb(x)
        proc.append(f"declipped {nfix} short runs" if nfix else "no clipping")
        if nlong:
            proc.append(f"{nlong} clipped runs too long to repair")
        proc.append("200 Hz-comb de-whine")
    if cfg.get("win"):
        a, b = cfg["win"]
        x = x[int(a * SR):int(b * SR)].copy()
    hp = cfg.get("hp", EL_DEFAULT_HP if kind == "el" else None)
    if hp:
        x = butter_zp(x, "highpass", hp, 4)
        proc.append(f"HP {hp} Hz")
    if cfg.get("kind") == "ambience":
        meter = pyln.Meter(SR)
        lufs = meter.integrated_loudness(x)
        x = x * 10 ** ((AMB_LUFS - lufs) / 20)
        proc.append(f"gain to {AMB_LUFS:.0f} LUFS (was {lufs:.1f} at -1 dBFS peak)")
        return x, proc
    # leading-silence trim: 10 ms before the attack
    on = onset_index(x, rel_db=cfg.get("thr", -40.0))
    pre = int(PRE_ROLL * SR)
    if on >= pre:
        x = x[on - pre:]
    else:
        x = np.vstack([np.zeros((pre - on, 2)), x])
    # gentle ramp across the pre-roll (+ an explicit fade-in when the window starts inside a sound)
    ramp_len = pre + int(cfg.get("fade_in", 0.0) * SR)
    x[:ramp_len] *= (np.sin(np.linspace(0, np.pi / 2, ramp_len)) ** 2)[:, None]
    fo = cfg.get("fade_out", 0.08)
    if fo > 0:
        n = int(fo * SR)
        x[-n:] *= (np.cos(np.linspace(0, np.pi / 2, n)) ** 2)[:, None]
    x = x * (10 ** (PEAK_DBFS / 20) / np.abs(x).max())
    proc.append(f"trim to {PRE_ROLL * 1000:.0f} ms pre-roll, fade-out {fo:.2f} s, peak {PEAK_DBFS:.0f} dBFS")
    return x, proc


def analyse(x):
    hm, _ = harmonicity(x)
    tl, tf, tfrac = tonal_lines(x)
    return {"flatness": round(flatness(x), 4), "band_flatness": round(band_flatness(x), 3),
            "harmonicity": round(hm, 3), "tonal_run_s": round(tl, 3), "tonal_hz": round(tf, 1)}


def contact_sheet(names, out_png, outdir):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy import signal as sg
    cols = 6
    rows = -(-len(names) // cols)
    fig, axes = plt.subplots(rows, cols, figsize=(cols * 3.3, rows * 2.25), facecolor="#111")
    for ax in axes.flat:
        ax.set_facecolor("#111")
        ax.axis("off")
    for ax, nm in zip(axes.flat, names):
        x = load(outdir / f"{nm}.wav")
        m = x.mean(axis=1)
        nper = 4096 if len(m) > 96000 else 2048
        hop = max(64, len(m) // 400)
        f, t, S = sg.spectrogram(m, fs=SR, nperseg=nper, noverlap=max(0, nper - hop), window="hann")
        Sdb = 10 * np.log10(S + 1e-14)
        Sdb -= Sdb.max()
        sel = f >= 35
        ax.axis("on")
        ax.pcolormesh(t, f[sel], Sdb[sel], vmin=-90, vmax=0, cmap="magma", shading="auto", rasterized=True)
        ax.set_yscale("log")
        ax.set_ylim(30, 20000)
        ax.set_title(f"{nm}  {len(m) / SR:.2f}s", color="w", fontsize=8, pad=2)
        ax.tick_params(colors="#aaa", labelsize=5, length=2)
        ax.set_yticks([100, 1000, 10000])
        ax.set_yticklabels(["100", "1k", "10k"])
        for s in ax.spines.values():
            s.set_color("#444")
    fig.suptitle("RESHAPE SFX - final spectrograms (log freq 30 Hz-20 kHz, 90 dB range, per-file normalised)",
                 color="w", fontsize=10)
    fig.tight_layout(rect=(0, 0, 1, 0.97))
    fig.savefig(out_png, dpi=110, facecolor="#111")


def main():
    args = sys.argv[1:]
    outdir = SFX
    if "--out" in args:
        i = args.index("--out")
        outdir = pathlib.Path(args[i + 1])
        del args[i:i + 2]
    names = args or list(SEL)
    outdir.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for nm in names:
        cfg = SEL.get(nm) or ALT[nm]
        x, proc = render(cfg)
        fn = nm.replace("@", "_alt_")
        save(outdir / f"{fn}.wav", x)
        a = analyse(x)
        entry = {
            "file": f"audio/sfx/{fn}.wav",
            "duration_s": round(len(x) / SR, 3),
            "peak_time_s": round(float(np.argmax(env_rms(x, SR, 10.0)) / SR), 3),
            "source": "elevenlabs" if cfg["src"].startswith("el:") else "procedural",
            "prompt_or_recipe": recipe_text(cfg["src"]),
            "flatness": a["flatness"],
            "notes": cfg.get("notes", ""),
            "qa": {"band_flatness": a["band_flatness"], "harmonicity": a["harmonicity"],
                   "longest_tonal_line_s": a["tonal_run_s"], "tonal_line_hz": a["tonal_hz"],
                   "peak_dbfs": round(float(db(np.abs(x).max())), 2), "processing": "; ".join(proc)},
        }
        if cfg.get("kind") == "ambience":
            entry["qa"]["integrated_lufs"] = round(pyln.Meter(SR).integrated_loudness(x), 2)
            entry["loop"] = True
        manifest[nm] = entry
        print(f"{nm:<16} {entry['source']:<10} {entry['duration_s']:.3f}s pk_t={entry['peak_time_s']:.3f} "
              f"flat={a['flatness']:.3f} bflat={a['band_flatness']:.2f} harm={a['harmonicity']:.2f} "
              f"tonal={a['tonal_run_s']:.2f}s@{a['tonal_hz']:.0f} pk={entry['qa']['peak_dbfs']:.1f}"
              + (f" LUFS={entry['qa']['integrated_lufs']}" if "integrated_lufs" in entry["qa"] else ""))
    if outdir == SFX and not args:
        (SFX / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
        contact_sheet(list(SEL), SFX / "_qa_spectrograms.png", SFX)
        print("wrote manifest.json and _qa_spectrograms.png")
    else:
        (outdir / "preview_manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
