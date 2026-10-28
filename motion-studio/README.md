# RESHAPE Motion Studio

Autonomous production of premium Arabic (Saudi) motion-graphics ads for
RESHAPE: give it a promotional poster and a one-line instruction, get a
finished, quality-checked 9:16 MP4 with Saudi voice-over, SFX and music — and
an editable Remotion project behind it.

Pure 2D motion graphics. No AI humans, faces, characters or stock footage. The
original RESHAPE logo files are used untouched.

## First delivery
`deliveries/brand-launch-01/brand-launch-01-1080x1920.mp4` — 34 s brand launch
ad built from the RESHAPE site's own copy. Report, contact sheets and QC
results in the same folder.

## Quick start
```bash
cd motion-studio
npm install
npm run verify                       # checks Remotion, FFmpeg, fonts, logos, SDK (no secrets printed)
npm run dev                          # Remotion Studio — open "Ad" or any Template-Library entry
npm run produce -- brand-launch-01   # rebuild the demo end-to-end with all quality gates
```

To use the ElevenLabs SDK locally, copy `.env.example` → `.env` and set
`ELEVENLABS_API_KEY`. The key is read from the environment only and never
printed or committed.

## Making a new ad
Ask Claude in this repo: *"Make a RESHAPE ad from this poster: …"*. The project
skill `.claude/skills/reshape-motion-studio` drives the whole flow
(docs/PIPELINE.md). Manually:

1. `public/jobs/<id>/job.json` — copy `brand-launch-01`, rewrite claims, script, scenes.
2. `npm run el -- tts <id> --yes` then `npm run el -- stt <id> --yes`.
3. `npm run produce -- <id> --stop-after=sheet` → review `out/<id>/contact-sheet.png`.
4. `npm run produce -- <id>` → preview + final with automated QC.

## Layout
```
src/brand/          tokens.ts (colour, type, grid, motion, sound), fonts/
src/components/     Stage, Backdrop, WordLine/Eyebrow, Icon (Lucide), Logo, SlantReveal
src/templates/      six templates + registry
src/Ad.tsx          timeline → scenes + wipes + mixed audio
scripts/            elevenlabs, build-timeline, make-music, mix-audio, render, produce, verify-tools
scripts/qc/         contact-sheet, inspect-video, check-pronunciation
public/brand/       original logo files     public/sfx/  brand SFX library
public/jobs/<id>/   job.json, narration, word timings, timeline, music, mix
qc/pronunciation/   brand-name pronunciation test takes + verification record
deliveries/<id>/    approved MP4s, contact sheets, QC reports
docs/               BRAND_SYSTEM · TEMPLATES · PIPELINE · MISSING_ASSETS
```

## Tooling
Remotion 4 (+ official Remotion Agent Skills in `../.agents/skills`), Lucide
icons, ElevenLabs (official JS SDK + claude.ai connector), FFmpeg (mix,
loudness, black/freeze detection), ImageMagick (contact sheets).

Remotion is free for individuals and companies of up to 3 people; larger teams
need a Remotion company licence (https://www.remotion.pro/license).
