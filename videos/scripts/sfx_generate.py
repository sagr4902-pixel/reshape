"""Generate SFX candidate takes with the ElevenLabs sound-generation API.

Usage:  python3 sfx_generate.py <take_id|all> [...] [--force]
Takes are saved losslessly as 48 kHz stereo FLAC in public/audio/sfx/_takes/<take_id>.flac and logged
in _takes/takes_log.json. The API key is injected by the session's network proxy; nothing is read here.
"""
import json
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

import numpy as np

from sfx_common import TAKES, save

URL = "https://api.elevenlabs.io/v1/sound-generation?output_format=pcm_48000"
MODEL = "eleven_text_to_sound_v2"

# take_id: (sound, prompt, duration_seconds, prompt_influence, extra)
SPECS = {
    # --- physical foley -------------------------------------------------------------------------
    "bar_settle_a": ("bar_settle", "A steel pull-up bar locking into its wall bracket: one short solid metallic clunk with a brief natural ring that settles quickly. Close, dry gym room. No music.", 1.2, 0.5, {}),
    "bar_settle_b": ("bar_settle", "Foley: a heavy steel chin-up bar drops into its metal J-hooks and seats firmly, one dense metallic clunk with a short rattle that settles fast. Close mic, dry room, no music.", 1.2, 0.5, {}),
    "grip_bar_a": ("grip_bar", "Foley close-up: two chalked hands grab a steel pull-up bar, a quick firm skin slap on metal with a soft chalk puff and grip squeeze. Single grab, dry, no music.", 1.0, 0.5, {}),
    "grip_bar_b": ("grip_bar", "Hands slapping onto and tightly gripping a knurled metal gym bar, chalky palms, one short grab sound, close mic, no voice, no music.", 1.0, 0.5, {}),
    "jump_takeoff_a": ("jump_takeoff", "Athletic sneakers pushing off a rubber gym floor for a jump: one quick sole scuff and push-off, no landing. Close foley, dry, no squeak, no music.", 0.8, 0.5, {}),
    "jump_takeoff_b": ("jump_takeoff", "Single explosive jump take-off on a rubberized sports floor, short shoe grip scrape and thump of the push, close mic, no voice, no music.", 0.8, 0.5, {}),
    "land_mat_a": ("land_mat", "An athlete lands on both feet on a thick foam gym mat: one soft heavy padded thud with a short vinyl compression. Close foley, dry room, no music.", 1.0, 0.5, {}),
    "land_mat_b": ("land_mat", "Feet landing on a gymnastics crash mat, deep muffled thump with a brief whoosh of air from the foam, single landing, close mic, no voices, no music.", 1.0, 0.5, {}),
    "cloth_a": ("cloth", "Close foley of athletic sportswear: one quick arm swing in a polyester training shirt, short fabric swish and rustle. No footsteps, no music.", 1.0, 0.5, {}),
    "cloth_b": ("cloth", "A quick body twist in nylon track clothing, short crisp fabric rustle and swoosh, single movement, close mic, dry, no music.", 1.0, 0.5, {}),
    "exhale_effort_a": ("exhale_effort", "One controlled exhale of an athletic man during a pull-up: a short firm breath out through the mouth, airy, not exaggerated. No voice, no grunt, close mic, no music.", 1.0, 0.55, {}),
    "exhale_effort_b": ("exhale_effort", "Close-mic single sharp exhale through pursed lips by a fit adult male at the top of an exercise rep, breathy hhh, controlled and natural, no vocal sound, no music.", 1.0, 0.55, {}),
    "block_rise_a": ("block_rise", "A padded wooden training block platform rises quickly from the floor and locks into place: short smooth slide ending in a soft muted mechanical clunk. Close, dry, no beeps, no music.", 1.0, 0.5, {}),
    "block_rise_b": ("block_rise", "Soft mechanical clunk of a sturdy platform popping up and latching, muted thud with a small latch click, short, foley, no music.", 1.0, 0.5, {}),
    "block_rise_c": ("block_rise", "Short pneumatic lift of a small gym plyo box ending in a firm muted lock clunk, mechanical, dry, no beeps, no music.", 1.0, 0.5, {}),
    "hands_floor_a": ("hands_floor", "Two palms placed flat onto a vinyl training mat: a soft muted double hand pat, close foley, dry, no music.", 0.8, 0.5, {}),
    "hands_floor_b": ("hands_floor", "Close foley of hands pressing down onto a rubber gym floor mat to start a push-up, soft skin slap, single, no music.", 0.8, 0.5, {}),
    "rings_clank_a": ("rings_clank", "Gymnastic rings hanging on nylon straps: a short creak of the webbing and a light clank of the metal buckles as the rings swing. Close, dry, no music.", 1.2, 0.5, {}),
    "rings_clank_b": ("rings_clank", "Someone grabs gym rings: straps pulled taut with a short stretch creak and a soft metallic clink of the carabiners, single movement, foley, no music.", 1.2, 0.5, {}),
    "kid_steps_a": ("kid_steps", "Light quick footsteps of a small child running a few steps in sneakers across a rubber gym floor, close, dry, no voices, no squeaks, no music.", 2.0, 0.5, {}),
    "kid_steps_b": ("kid_steps", "A young kid trotting quickly across an indoor sports floor: five light, soft sneaker footsteps, close mic, no voice, no music.", 2.0, 0.5, {}),
    "hoop_hop_a": ("hoop_hop", "A child does one small two-footed hop and lands on a rubber gym floor: one light double-foot landing thud. Close, dry, no voice, no music.", 1.0, 0.5, {}),
    "hoop_hop_b": ("hoop_hop", "Single small jump of a kid with feet together landing on a sports hall floor, soft sneaker landing tap, short, no voice, no music.", 1.0, 0.5, {}),
    "high_five_a": ("high_five", "A single crisp high five: two hands slap together once, close, dry indoor room, no voices, no music.", 0.8, 0.5, {}),
    "high_five_b": ("high_five", "One clean hand slap high five between a coach and a child, sharp skin smack, short, no cheering, no music.", 0.8, 0.5, {}),
    "check_stamp_a": ("check_stamp", "A soft rubber stamp pressed firmly onto a sheet of paper on a clipboard: one muted stamp thud with a slight paper crinkle. Close, dry, no music.", 0.8, 0.5, {}),
    "check_stamp_b": ("check_stamp", "Single approval stamp: a self-inking stamp pressed onto paper on a wooden desk, soft mechanical click-thump, short, foley, no music.", 0.8, 0.5, {}),
    # --- second round (after QA of round one) ---------------------------------------------------
    "exhale_effort_c": ("exhale_effort", "Silence, then one short controlled exhale through the mouth by a man doing a push-up, natural breathy huff, not exaggerated, no voice, no grunt, close mic, dry, no music.", 1.2, 0.55, {}),
    "exhale_effort_d": ("exhale_effort", "A fit male athlete exhales once sharply through the mouth at the effort of a lift: brief airy breath, calm and controlled, no vocal sound, close, dry, no music.", 1.2, 0.5, {}),
    "block_rise_d": ("block_rise", "A wooden plyometric box slides upward a short distance and clicks into place: short wooden scrape then a muted mechanical clunk with a soft latch click. Close foley, dry, no motor, no music.", 1.0, 0.5, {}),
    "block_rise_e": ("block_rise", "Soft mechanical clunk: a padded platform block is pushed up and locks with a dull thud and a light metal latch click, short, no motor whine, no beeps, no music.", 1.0, 0.5, {}),
    "grip_bar_c": ("grip_bar", "Close foley of a gymnast's chalked hands catching and gripping a steel pull-up bar: a firm palm slap on metal followed by a short tight squeeze, no voice, no music.", 1.0, 0.5, {}),
    "grip_bar_d": ("grip_bar", "Two hands slap onto a metal chin-up bar and grip it, quick skin-on-steel impact with a faint chalk rub, single action, dry, close, no music.", 1.0, 0.5, {}),
    "cloth_c": ("cloth", "Close foley of a sports jersey sleeve swishing past the body in one quick arm movement: crisp synthetic fabric rustle, no body impact, no thump, no footsteps, no music.", 1.0, 0.5, {}),
    "cloth_d": ("cloth", "Athletic training clothes rustling as a person quickly turns: short soft polyester swish and rustle, light and clean, close mic, no impacts, no music.", 1.0, 0.5, {}),
    # --- ambiences ------------------------------------------------------------------------------
    "room_tone_gym_a": ("room_tone_gym", "Quiet empty indoor training facility room tone: soft steady air-conditioning airflow, large room air, faint distant creaks, no voices, no music, no footsteps, no rhythm.", 14.0, 0.4, {}),
    "room_tone_gym_b": ("room_tone_gym", "Steady indoor gym ambience: calm ventilation air and soft large-room tone, very quiet and constant, no voices, no music, no beat.", 12.0, 0.4, {"loop": True}),
    "kids_area_air_a": ("kids_area_air", "Very subtle bright indoor ambience of a kids training area: soft air, distant light movement and faint soft footsteps far away, calm, no voices, no talking, no music.", 10.0, 0.4, {}),
    "kids_area_air_b": ("kids_area_air", "Bright airy indoor sports hall ambience, soft ventilation and very distant light activity, gentle and calm, no voices, no children talking, no music, no rhythm.", 10.0, 0.4, {}),
    # --- designed / comparison against procedural -----------------------------------------------
    "tick_spark_a": ("tick_spark", "A tiny single electric spark: very short sharp static snap with a faint crackle, close, no hum, no music.", 0.6, 0.5, {}),
    "tick_spark_b": ("tick_spark", "A small glowing ember igniting: one tiny bright crackle click, very short, delicate, no music.", 0.6, 0.5, {}),
    "sub_impact_soft_a": ("sub_impact_soft", "Restrained cinematic low thump: a soft deep sub impact, short and subtle, non-tonal, no boom tone, no music.", 1.2, 0.5, {}),
    "sub_impact_soft_b": ("sub_impact_soft", "A subtle deep muffled impact like a heavy weight set down on a padded floor far away, low thump, short, no music.", 1.2, 0.5, {}),
    "logo_impact_a": ("logo_impact", "Deep restrained cinematic brand logo impact: a punchy low thud with a textured transient and a short natural room tail, non-tonal, no braam, no boom tone, no music.", 2.5, 0.5, {}),
    "logo_impact_b": ("logo_impact", "Subtle movie trailer style hit: a heavy deep impact with an air whoosh release and a short decaying hall tail, no melodic boom, no music.", 2.5, 0.5, {}),
    "word_accent_a": ("word_accent", "A soft restrained thock accent: a single muted tap of a felt mallet on a thick padded surface, short, dry, low-mid, no ringing, no music.", 0.6, 0.5, {}),
    "word_accent_b": ("word_accent", "A deep satisfying mechanical keyboard key thock, single soft keypress, close, dry, no music.", 0.6, 0.5, {}),
    "whoosh_el_light": ("whoosh_light", "A fast airy whoosh: a quick swish of air passing by, clean, short, non-tonal, no music.", 0.8, 0.5, {}),
    "whoosh_el_deep": ("whoosh_deep", "A deep smooth whoosh of a camera move: soft low rush of air passing by, smooth, non-tonal, no music.", 1.4, 0.5, {}),
}

LOG = TAKES / "takes_log.json"


def generate(take_id, force=False):
    sound, text, dur, infl, extra = SPECS[take_id]
    out = TAKES / f"{take_id}.flac"
    if out.exists() and not force:
        return take_id, "exists", None
    body = {"text": text, "duration_seconds": dur, "prompt_influence": infl, "model_id": MODEL, **extra}
    raw = TAKES / f".{take_id}.pcm"
    r = subprocess.run(["curl", "-sS", "--max-time", "180", "-X", "POST", URL, "-H", "Content-Type: application/json",
                        "-d", json.dumps(body), "-o", str(raw), "-w", "%{http_code} %{content_type}"],
                       capture_output=True, text=True)
    code, _, ctype = r.stdout.partition(" ")
    if code != "200" or "audio" not in ctype:
        err = raw.read_bytes()[:500].decode("utf8", "replace") if raw.exists() else r.stderr
        raw.unlink(missing_ok=True)
        return take_id, f"FAILED {code} {ctype} {err}", None
    pcm = np.frombuffer(raw.read_bytes(), dtype="<i2").astype(np.float64).reshape(-1, 2) / 32768.0
    raw.unlink()
    save(out, pcm, subtype="PCM_16")
    entry = {"take_id": take_id, "sound": sound, "prompt": text, "duration_seconds": dur,
             "prompt_influence": infl, "model_id": MODEL, **extra, "format": "pcm_48000 (s16 stereo)",
             "samples": len(pcm), "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    return take_id, "ok", entry


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    ids = list(SPECS) if args == ["all"] else args
    TAKES.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=3) as ex:
        results = list(ex.map(lambda t: generate(t, force), ids))
    log = json.loads(LOG.read_text()) if LOG.exists() else []
    for tid, status, entry in results:
        print(f"{tid:<22} {status}")
        if entry:
            log.append(entry)
    LOG.write_text(json.dumps(log, indent=1, ensure_ascii=False))
    print(f"total ElevenLabs generations logged: {len(log)}")


if __name__ == "__main__":
    main()
