---
name: reshape-motion-studio
description: Produce a RESHAPE Arabic motion-graphics advertisement (Saudi voice-over, SFX, music, 9:16 MP4) from a promotional poster or brief, using the motion-studio Remotion project. Use when the user gives a poster/image or instruction and asks for an ad, promo, reel or motion video for RESHAPE (إعلان، موشن، فيديو ترويجي).
---

# RESHAPE Motion Studio — poster → finished ad

Project: `motion-studio/`. Read `motion-studio/docs/PIPELINE.md`,
`docs/BRAND_SYSTEM.md` and `docs/TEMPLATES.md` before the first job in a
session. Follow Remotion rules in `.agents/skills/remotion-best-practices`.

## Hard rules
- Pure 2D motion graphics. No AI-generated humans, faces, characters; no stock footage.
- Never invent claims, prices, dates, offers, testimonials or numbers. Every claim goes in `job.json → claims[]` with its source (the poster, or `index.html`). If the poster lacks a needed fact, write around it or ask.
- Original logo files only (`public/brand/`): position/opacity/scale ≤ 1.25×/clip. Never recolour, redraw, rotate or re-assemble.
- Brand name in scripts: **رِي شَيْب**. Never claim pronunciation is verified unless the blind check passed, and always say it is an automated check, not a human listen.
- Credits: estimate first; one TTS run (2 takes), 1 take per SFX; no retries by re-calling a generation. Ask before anything long or unusual.
- Credentials: `ELEVENLABS_API_KEY` from env/.env only. Never print, log or commit it.

## Steps
1. **Analyse the poster** (view the image): offer, headline, terms, dates, CTA, URL/handles, colours used. Note anything unreadable instead of guessing.
2. **Write `public/jobs/<id>/job.json`** (copy `brand-launch-01`). Script: Saudi white dialect, 25–35 s, one idea per scene, `[pause]` between scenes, eleven_v4 tags sparingly. Pick templates by purpose (TEMPLATES.md); open with `sports-impact` or `kinetic-lines`, end with `brand-reveal`. Don't repeat a template unless the content needs it.
3. **Narration**: SDK `npm run el -- tts <id> --yes`, or connector `creative_generate_speech` (voice `o0I5dklyITreiSjxYrIt`, `eleven_v4`, flow per job). Save the chosen take as `vo.mp3`; pick by ffmpeg loudness/pauses.
4. **Blind STT**: SDK `npm run el -- stt <id> --yes`, or connector: `creative_attach_reference_file` with the take's URL (fresh asset), then `creative_transcribe_audio` on that node; save `{"words": [...]}` to `vo-words.json`. Never transcribe the generation node itself (it echoes the prompt). Then `npm run pronunciation -- <id>`; if it fails, change spelling/IPA and regenerate.
5. **Cues**: write `cues` against the transcript's spelling (digits, "Reshape"); `@N` for unspoken labels. `npm run timeline -- <id>`.
6. **Gate 1**: `npm run produce -- <id> --stop-after=sheet`, then LOOK at `out/<id>/contact-sheet.png`. Check brand consistency, typography (zoom into Arabic marks: dots, shadda, tanween, hamza), alignment, hierarchy, icon consistency, collisions, dead space, originality. Redesign and repeat until it is genuinely good.
7. **SFX**: reuse `public/sfx/`; generate new ones only if the concept needs them.
8. **Gates 2–3**: `npm run produce -- <id>` (music, mix, preview + QC, final + QC). Look at `qc-preview-frames.png` and `qc-final-frames.png`; spot-check sync at the key hit. Fix and re-render on any defect.
9. **Deliver**: copy MP4 (+ preview), approved/rejected contact sheets as JPEG, QC JSON and a `REPORT.md` (script, scenes, gate history, pronunciation method and limits, credits) to `deliveries/<id>/`. Commit and push to the working branch.
