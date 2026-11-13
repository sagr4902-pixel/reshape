# RESHAPE — Motion graphics productions (Remotion)

Editable source for RESHAPE videos. First production: **«من أول حركة… إلى أقوى نسخة منك»**, a 44.5 s vertical ad (1080×1920, 30 fps), Saudi Arabic voice-over, sound design only (no music).

## Structure
```
src/kit/            reusable animation kit: brand tokens, fonts, math/easing, 3D camera,
                    2D character rig + IK, pose library, figure renderer, motion path, Arabic word reveal
src/films/reshape/  the campaign: timeline.ts (scene windows + voice cue frames), Film.tsx,
                    scenes/ (S1–S6), Cover.tsx (Reel cover), logo_contour.json
src/vo_timing.json  word-level timings of the chosen voice takes (drives text sync)
public/             fonts, official logo, voice-over takes, SFX library (+ manifest.json), mix output
scripts/            vo_generate.py / vo_verify.py / vo_select.py (ElevenLabs voice pipeline),
                    sfx_*.py (SFX library), mix.py (+ cues.json), render_final.sh, stills.mjs, contact.py, popscan.py
```

## Commands
```bash
npm install
npx remotion studio                       # live preview (compositions: ReshapeCampaign, SceneS1..S6, Cover)
node scripts/stills.mjs SceneS3 out/stills 0 30 60   # review stills (bundles once)
python3 scripts/mix.py scripts/cues.json  # rebuild the audio mix (-14 LUFS, voice ducks effects)
bash scripts/render_final.sh              # final MP4 + cover + audio deliverables
```

## Rules this project follows
- Every frame is a pure function of time (no CSS transitions, timers or state) — motion blur and any-frame rendering depend on it.
- The official logo PNG is used unmodified; the large mark in the finale is a traced outline that resolves into the PNG.
- Voice: ElevenLabs voice `96donzfHvBagGuYj2GLW` (mohammed alsagr), model `eleven_v4`. The API key is injected by the environment, never stored in code.
- No music: the sound bed is voice + effects only (see `public/audio/sfx/manifest.json` and `_qa_spectrograms.png`).
