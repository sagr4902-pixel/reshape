"""«لوحة تقدّمك» (BoardV1) SFX cue sheet — UI sounds only, no music, no voice. Frames mirror src/films/board/Board.tsx."""
import json, pathlib, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
T = dict(build=0, cal=45, str=118, clock=178, skill=236, next=318, ring=376, route=426, pull=486, end=546, total=612)
c = []
add = lambda s, f, db, **k: c.append({"s": s, "f": round(f, 2), "db": db, **k})
# build + title
add("whoosh_light_3", 10, -16); add("word_accent", 8, -12)
for i in range(7): add("marker_tick", 6 + i * 4, -17, pan=(0.3 if i % 2 else -0.3))
# camera glides between widgets (soft)
for k in ("cal", "str", "clock", "skill", "next", "ring", "route"):
    add("whoosh_light_1", T[k] - 6, -22)
# calendar: one tick per training day, count lands
for k in range(12): add("marker_tick", T["cal"] + 8 + k * 4, -13, pan=(0.2 if k % 2 else -0.2))
add("word_accent", T["cal"] + 8 + 11 * 4 + 2, -12)
# strength steps 2 → 5 → 8
for t, s in ((T["str"] + 4, "block_rise_1"), (T["str"] + 20, "block_rise_2"), (T["str"] + 36, "block_rise_3")):
    add(s, t, -15); add("word_accent", t, -17)
# clock spin + settle
for t in range(T["clock"] + 6, T["clock"] + 34, 3): add("marker_tick", t, -20)
add("check_stamp", T["clock"] + 34, -13)
# handstand progress + done
for t in range(T["skill"] + 8, T["skill"] + 62, 6): add("tick_spark", t, -20)
add("check_stamp", T["skill"] + 62, -11); add("glow_shimmer", T["skill"] + 63, -17)
# next session: typing + check
a = T["next"] + 4
for s0, n in ((a + 2, 12), (a + 12, 8), (a + 24, 6)):
    for k in range(n): add("marker_tick", s0 + k * 1.4 / 1.4 * 1.0 + k * 0.4, -22)
add("check_stamp", a + 34, -11)
# streak ring
for t in range(T["ring"] + 6, T["ring"] + 38, 3): add("marker_tick", t, -22)
add("word_accent", T["ring"] + 38, -12)
# milestone route
add("line_draw", T["route"] + 8, -17, align="start", dur=1.6, fade=0.25, fadein=0.08)
for fr in (0.0, 0.33, 0.66, 1.0): add("marker_tick", T["route"] + 8 + fr * 46, -11)
add("check_stamp", T["route"] + 55, -12)
# pull-back + line
add("whoosh_deep_1", T["pull"] + 12, -12); add("word_accent", T["pull"] + 20, -14); add("sub_impact_soft", T["pull"] + 20, -16)
# end card
add("whoosh_deep_2", T["end"] - 2, -14); add("logo_impact", T["end"], -9); add("word_accent", T["end"] + 10, -11); add("marker_tick", T["end"] + 20, -16)
cues = {"total_frames": T["total"], "timing": "src/vo3_timing.json", "out_dir": "public/audio/mix4", "out_name": "board_mix", "vo": {}, "duck_db": 0.0,
        "sfx": sorted(c, key=lambda x: x["f"])}
(ROOT / "scripts/cues4.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1))
print(len(c), "cues")
subprocess.run(["python3", str(ROOT / "scripts/mix.py"), str(ROOT / "scripts/cues4.json")], check=True)
