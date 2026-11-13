"""Build the v2 quiz SFX cue sheet from the voice timings (frames), then run the mixer."""
import json, pathlib, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
d = json.loads((ROOT / "src/vo2_timing.json").read_text())["lines"]
CD = 1.5
SEQ = [('H1',0.3),('H2',0.12),('H3',0.15),('H4',0.15),('R1a',0.6),('R1b',0.12),('R1c',0.14),('R2a',CD+0.25),('R2b',0.12),('R2c',0.12),('R3a',CD+0.25),('R3b',0.12),('R3c',0.14),('A1',CD+0.3),('A2',0.15),('A3',0.12),('A4',0.15),('T1',0.45),('P1',0.35),('P2',0.15),('P3',0.15),('C1',0.3)]
t = 0; AT = {}; END = {}
for i, g in SEQ:
    t += g; AT[i] = round(t * 30); t += d[i]['duration']; END[i] = round(t * 30)
W = lambda i, k: AT[i] + d[i]['words'][min(k, len(d[i]['words']) - 1)]['start'] * 30
TOTAL = END['C1'] + 72
SEC = {'r1': AT['R1a'] - 14, 'r2': AT['R2a'] - 14, 'r3': AT['R3a'] - 14, 'reveal': AT['A1'] - 16, 'mosaic': AT['T1'] - 12, 'pitch': AT['P1'] - 12, 'cta': AT['C1'] - 14}
c = []
add = lambda s, f, db, **k: c.append({"s": s, "f": round(f, 1), "db": db, **k})
# hook
add("whoosh_light_2", 4, -15, pan=-0.5); add("word_accent", AT['H1'] + 1, -13); add("hoop_hop", AT['H1'] + 6, -18)
add("word_accent", AT['H2'] + 1, -9); add("hoop_hop", AT['H2'] + 4, -18)
add("whoosh_light_1", AT['H3'] - 2, -10, pan=0.4); add("whoosh_light_2", AT['H3'] + 4, -12, pan=-0.4)
add("word_accent", W('H3', 2), -11, pan=0.3); add("word_accent", W('H3', 4), -11, pan=-0.3)
add("split_whoosh", AT['H4'] - 4, -11)
add("word_accent", W('H4', 0), -10); add("check_stamp", W('H4', 4), -6); add("sub_impact_soft", W('H4', 4), -13)
# section entries
for k, f in SEC.items():
    add("whoosh_deep_1" if k in ('r1', 'r3', 'mosaic', 'cta') else "whoosh_deep_2", f + 4, -11)
# rounds
for r, li in (("r1", "R1"), ("r2", "R2"), ("r3", "R3")):
    add("block_rise_2", SEC[r] + 12, -15)
    add("marker_tick", AT[li + 'b'] - 2, -15)
    add("hoop_hop", AT[li + 'c'] + 3, -13)
    for k, db in ((0, -10), (15, -10), (30, -8)):
        add("marker_tick", END[li + 'c'] + 2 + k, db)
# round 1 details
add("word_accent", W('R1b', 2), -14)
for k in range(6):
    add("marker_tick", W('R1b', 8) + k * 5, -20)
for k in range(3):
    add("hands_floor", AT['R1b'] + 26 * k + 13, -22)
# round 2 details: play on the phone, the copier falls
add("tick_spark", W('R2b', 0), -14)
wc = W('R2b', 2)
f = wc
while f < END['R2c'] + 45:
    ph = ((f - wc + 400) % 54) / 54
    if 0.985 < ph or ph < 0.015:
        add("land_mat", f, -17); f += 40
    f += 1
# round 3 details: plan checks, weekly bars
wp, ws = W('R3b', 2), W('R3b', 6)
for k in range(3):
    add("check_stamp", wp + 9 + k * 7, -17)
for k in range(4):
    add(["block_rise_1", "block_rise_2", "block_rise_3", "block_rise_1"][k], ws - 4 + k * 5, -18)
# reveal
a2, a3, a4, a4b = W('A2', 2), W('A3', 2), W('A4', 0), W('A4', 2)
add("word_accent", AT['A1'] - 4, -12)
add("whoosh_light_3", a2 - 8, -14); add("whoosh_light_3", a2 - 3, -14); add("whoosh_light_3", a3 - 6, -12)
add("check_stamp", a3 + 4, -6); add("glow_shimmer", a3 + 6, -17)
add("word_accent", a4 - 4, -13); add("hoop_hop", a4b - 3, -14)
# mosaic + band
add("whoosh_deep_2", SEC['mosaic'] + 2, -10); add("split_whoosh", W('T1', 1) - 6, -12); add("sub_impact_soft", W('T1', 4), -11)
# pitch
add("word_accent", W('P1', 1), -12); add("word_accent", W('P1', 2), -12)
add("whoosh_light_1", AT['P2'] - 8, -12); add("hoop_hop", W('P2', 2), -13); add("hoop_hop", W('P2', 3), -13)
s0, s1 = W('P2', 4) - 4, END['P3'] - 10
for k in range(5):
    add(["block_rise_1", "block_rise_2", "block_rise_3", "block_rise_2", "block_rise_1"][k], s0 + (s1 - s0) * k / 4, -16)
add("word_accent", W('P3', 3) - 4, -13)
# CTA
add("glow_shimmer", SEC['cta'] + 6, -14); add("sub_impact_soft", W('C1', 1) - 4, -10); add("word_accent", W('C1', 1) - 2, -12)
add("marker_tick", W('C1', 2) + 6, -16); add("marker_tick", W('C1', 2) + 10, -17)
cues = {"total_frames": TOTAL, "timing": "src/vo2_timing.json", "out_dir": "public/audio/mix2", "out_name": "quiz_mix",
        "vo": {k: AT[k] for k in AT}, "duck_db": -7.0, "sfx": sorted(c, key=lambda x: x["f"])}
(ROOT / "scripts/cues2.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1))
print(len(c), "cues; total", TOTAL, "frames")
subprocess.run(["python3", str(ROOT / "scripts/mix.py"), str(ROOT / "scripts/cues2.json")], check=True)
