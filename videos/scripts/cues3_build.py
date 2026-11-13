"""Build the v3 hype-short SFX cue sheet (no music) from the voice timings, then run the mixer.

Frames mirror src/films/hype/timeline.ts and scenes.tsx (JS Math.round semantics).
"""
import json, math, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
FPS = 30
d = json.loads((ROOT / "src/vo3_timing.json").read_text())["lines"]
AT_S = {"V1": 0.66, "V2": 1.78, "V3": 3.66, "V4": 5.06, "V5": 6.95, "V6": 9.08, "V7": 12.32, "V8": 14.92, "V9": 17.12}
jsround = lambda x: math.floor(x + 0.5)
AT = {k: jsround(v * FPS) for k, v in AT_S.items()}
END = {k: AT[k] + jsround(d[k]["duration"] * FPS) for k in AT}
W = lambda i, k: AT[i] + d[i]["words"][min(k, len(d[i]["words"]) - 1)]["start"] * FPS
TOTAL = END["V9"] + 40
CUTS = {"drop": 109, "toHand": 150, "toLever": 207, "toFlash": 241, "toKids": 272, "toPills": 366, "toFinale": 446}
TR = {"toHand": 8, "toLever": 10, "toKids": 9, "toPills": 12}
FREEZE = 18

c = []
add = lambda s, f, db, **k: c.append({"s": s, "f": round(f, 2), "db": db, **k})

# ── A: home video → freeze → rewind → play → ball ──
add("room_tone_gym", 0, -27, align="start", dur=CUTS["drop"] / FPS, fade=0.02, fadein=0.05, bus="amb")
add("hands_floor", 1, -17)
add("cloth_1", 4, -21)
add("whoosh_light_2", 15, -19, pan=0.3)                  # the topple
add("record_scratch", FREEZE, -5)                         # freeze
add("sub_impact_soft", FREEZE, -13)
add("word_accent", 21, -9)                                # «هذا إنت؟» slam
add("line_draw", 19, -21, align="start", dur=0.32, fade=0.08, fadein=0.03)  # red circle draws on
add("whoosh_light_1", 51, -19)                            # player slides up
add("marker_tick", 58, -13)                               # grab the playhead
add("tape_rewind", 59, -9, align="start", dur=0.86, fade=0.12)
add("marker_tick", 95, -11)                               # click ▶
add("tick_spark", 100, -15)                               # ▶ → ball
add("whoosh_light_3", 106, -14, pan=-0.2)                # ball flies up

# ── B: DROP — «أول عقلة!» ──
hit3 = jsround(W("V3", 1))
add("whoosh_deep_1", CUTS["drop"], -12)
add("sub_impact_soft", CUTS["drop"], -9)
add("ball_bounce", hit3 - 3, -10)                         # ball lands on the bar
add("grip_bar", hit3 - 9, -19)
add("impact_hit", hit3, -7)
add("ball_bounce", 141, -15, pan=0.4)
add("whoosh_light_1", CUTS["toHand"] - 4, -12)            # wipe

# ── C: «أول وقفة يد!» ──
hit4 = jsround(W("V4", 2))
add("cloth_2", hit4 - 8, -20)
add("impact_hit", hit4, -7)
add("tick_spark", hit4 + 1, -17)                          # plumb line snaps
add("whoosh_deep_2", CUTS["toLever"] - 5, -13)            # flip

# ── D: «أول ليفر!» ──
hit5 = jsround(W("V5", 1))
add("grip_bar", CUTS["toLever"] - 2, -19)
add("whoosh_light_2", hit5 - 4, -18, pan=-0.3)
add("impact_hit", hit5, -6)
add("sub_impact_soft", hit5, -13)

# ── E: rapid word flashes (6 × 4 frames) ──
for k in range(6):
    add("word_accent", CUTS["toFlash"] + 4 * k, -10 + (k == 0) * 1, pan=(-0.25 if k % 2 else 0.25))
    add("marker_tick", CUTS["toFlash"] + 4 * k, -19)
add("whoosh_light_1", CUTS["toKids"] - 4, -12)            # slide

# ── F: kids — hops → high five ──
five = jsround(W("V6", 3))
add("kids_area_air", CUTS["toKids"] - TR["toKids"], -27, align="start", dur=(CUTS["toPills"] - CUTS["toKids"] + TR["toKids"]) / FPS, fade=0.25, fadein=0.1, bus="amb")
HOP_END = five - 8; HOP2 = HOP_END - 20; HOP1 = HOP2 - 22  # mirrors scenes.tsx
for h0, h1 in ((HOP1, HOP2), (HOP2, HOP_END)):
    add("jump_takeoff", h0 + 0.3 * (h1 - h0), -18)
    add("hoop_hop", h0 + 0.84 * (h1 - h0), -11)
add("high_five", five, -4)
add("sub_impact_soft", five, -15)
add("whoosh_deep_1", CUTS["toPills"] - 6, -12)            # clock wipe

# ── G: mosaic + glass pills ──
add("glow_shimmer", CUTS["toPills"] - 4, -18)
add("word_accent", W("V7", 0) + 3, -14); add("marker_tick", W("V7", 0) + 3, -18)
add("word_accent", W("V7", 2) + 2, -14); add("marker_tick", W("V7", 2) + 2, -18)

# ── H: progress bar → routes → logo slam → click ──
full = jsround(W("V8", 1))
slam = AT["V9"] + 1
add("whoosh_deep_2", CUTS["toFinale"], -12)
add("sub_impact_soft", CUTS["toFinale"], -14)
for k, f in enumerate((full - 27, full - 20, full - 13, full - 6)):  # bar steps (scenes.tsx LEVEL_FRAMES)
    add("marker_tick", f, -17 + 2 * k)
    add("block_rise_2", f + 1, -21 + k)
add("riser_air", full, -15, skip=1.25, fadein=0.12)
add("impact_hit", full, -6)                               # «ينشاف!»
add("check_stamp", full + 1, -14)
add("converge_swirl", slam - 3, -10, skip=0.75, fadein=0.06)  # routes swirl into the mark
add("logo_impact", slam, -3)
add("glow_shimmer", slam + 14, -14)                       # shine sweep
btnAt = jsround(W("V9", 1)) - 2
clickAt = END["V9"] - 4
add("word_accent", btnAt + 1, -13)
add("marker_tick", clickAt, -8)
add("check_stamp", clickAt + 3, -8)
add("tick_spark", clickAt + 8, -18)

cues = {"total_frames": TOTAL, "timing": "src/vo3_timing.json", "out_dir": "public/audio/mix3", "out_name": "hype_mix",
        "vo": AT, "duck_db": -6.0, "sfx": sorted(c, key=lambda x: x["f"])}
(ROOT / "scripts/cues3.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1))
print(len(c), "cues; total", TOTAL, "frames; AT", AT)
subprocess.run(["python3", str(ROOT / "scripts/mix.py"), str(ROOT / "scripts/cues3.json")], check=True)
