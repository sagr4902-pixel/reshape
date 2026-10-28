# Production pipeline — poster in, MP4 out

```
poster + instruction
   │ 1  analyse poster: offer, claims, dates, branding (read it, don't guess)
   │ 2  write job.json: Saudi script (رِي شَيْب), template per scene, cues, claim sources
   │ 3  narration  ── ElevenLabs TTS (RESHAPE Official Voice, eleven_v4)
   │ 4  blind STT  ── ElevenLabs Scribe on the audio file only → vo-words.json
   │       └─ pronunciation gate (check-pronunciation)            ✗ → fix spelling, regenerate
   │ 5  build-timeline: scenes + cues snapped to real word times
   │ 6  GATE 1  contact sheet (every scene, built + mid-build)      ✗ → redesign before animating
   │ 7  music bed (procedural or licensed) + SFX → FFmpeg mix (-14 LUFS)
   │ 8  GATE 2  540×960 preview + automated QC + frames review     ✗ → fix, re-render
   │ 9  final 1080×1920 + GATE 3 QC
   └ 10 deliveries/<job>/: MP4, sheets, QC JSON, REPORT.md; source stays editable
```

## Commands

```bash
npm run verify                                 # toolchain check (no secrets printed)
npm run el -- tts <job> --yes                  # narration (SDK route)
npm run el -- stt <job> --yes                  # blind transcription + pronunciation check
npm run produce -- <job>                       # steps 5–9 with all gates
npm run produce -- <job> --stop-after=sheet    # stop at gate 1 for design review
npm run dev                                    # Remotion Studio: edit scenes live
```

## Two ElevenLabs routes

| | SDK route (local) | Connector route (Claude sessions) |
|---|---|---|
| Auth | `ELEVENLABS_API_KEY` in `.env` (git-ignored) | Your claude.ai ElevenLabs connector — no key in the repo |
| TTS | `npm run el -- tts <job> --yes` | `creative_generate_speech` (voice `o0I5dklyITreiSjxYrIt`, `eleven_v4`), download the take to `public/jobs/<job>/vo.mp3` |
| STT | `npm run el -- stt <job> --yes` | **Re-import the take as a plain asset** (`creative_attach_reference_file` with the file URL), then `creative_transcribe_audio` on that node. Save `words` to `vo-words.json` |
| SFX | `npm run el -- sfx <name> "<prompt>" 1 --yes` | `creative_generate_in_flow` node_type `sfx`, 1 take |
| Music | `npm run el -- music <job> "<prompt>" --yes` (plan permitting) | Not available on the restricted connector |

### Why the blind re-import matters
Transcribing the generation node directly returns the **TTS prompt text** (tags like `[pause]` survive, at 0 credits) — that is alignment, not listening, and proves nothing about pronunciation. `check-pronunciation` refuses to pass a transcript that echoes the prompt. Only a transcript of the audio file alone counts, and even that is an automated proxy, not a human listening test. Say so in every report.

## Cost control
- Every SDK command that spends credits is a dry run unless `--yes` is passed.
- Use `estimate_only` on connector calls before long generations.
- One TTS run (2 takes) per script; pick a take with ffmpeg (loudness, pauses) instead of regenerating.
- SFX: 1 take each; reuse the library in `public/sfx/` across jobs.

## Job layout
```
public/jobs/<job>/job.json      brief, claims+sources, script, scenes, cues   ← authored
public/jobs/<job>/vo.mp3        narration take
public/jobs/<job>/vo-words.json blind word timings
public/jobs/<job>/timeline.json generated (frames)
public/jobs/<job>/music.wav     generated or licensed
public/jobs/<job>/mix.wav       generated
out/<job>/                      renders, sheets, QC (scratch, git-ignored)
deliveries/<job>/               approved outputs (committed)
```

## Writing a job (rules)
- Every on-screen or spoken claim must appear in the poster or another brand source; list it in `claims[]` with its source. No invented offers, prices, dates, testimonials or numbers.
- Script in Saudi white dialect, short sentences, one idea per scene, `[pause]` between scenes. Brand always `رِي شَيْب`.
- Cues reference words **as the blind transcript writes them** (e.g. `10`, `100`, `Reshape`). Use `@N` for unspoken visual beats.
- Pure 2D only: no AI humans, faces, characters or stock footage. The poster image itself may be used as a flat graphic element only if it contains none of those.
