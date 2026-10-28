# brand-launch-01 — production report

**Output:** `brand-launch-01-1080x1920.mp4` — 34.13 s, 1080×1920, 30 fps, H.264 yuv420p (BT.709), AAC 48 kHz stereo.
Preview: `brand-launch-01-preview-540x960.mp4`.

## Brief
No poster was supplied for this first run, so the brief was built from the live
RESHAPE site (`reshape/index.html`). Every claim is the brand's own copy — see
`claims[]` in `public/jobs/brand-launch-01/job.json` for sources.

## Script (Saudi Arabic, RESHAPE Official Voice, eleven_v4)
> جسمك يتغيّر بالتكرار… مو بالحماس.
> مع رِي شَيْب، برنامجك مصمّم لك خصيصاً، من أي مكان في العالم.
> فيديو لكل تمرين، تسجيل مباشر لكل مجموعة، ومتابعة من الكابتن أول بأول.
> وأيام تمرينك أنت تحدّدها: من يومين إلى ستة أيام بالأسبوع، حسب هدفك ووقتك.
> مع الكابتن محمد الصقر: أكثر من عشر سنين خبرة، وأكثر من مية متدرب وصلوا لهدفهم.
> رِي شَيْب. ابدأ التسجيل الحين، بدقيقتين بس.

## Scenes
| # | Template | Time |
|---|---|---|
| 1 | sports-impact (hook) | 0.00–3.20 |
| 2 | kinetic-lines | 3.20–8.47 |
| 3 | service-steps | 8.47–14.90 |
| 4 | week-infographic | 14.90–21.80 |
| 5 | stat-counters | 21.80–28.70 |
| 6 | brand-reveal | 28.70–34.13 |

## Pronunciation — what was and wasn't verified
- Test: three spellings (رِي شَيْب / IPA / RESHAPE) generated and transcribed.
- Transcribing the generation node returned the TTS prompt verbatim (with `[pause]` tags) — **rejected as verification** (it is alignment, not listening).
- Blind check: takes re-imported as plain audio assets and transcribed with Scribe. Test take → "Reshape" ×3. Final narration → both brand mentions heard as "Reshape" (3.72 s, 29.06 s), language confidence 0.99, full text matches the script.
- Spectrogram of the test take supports /eɪ/ in the second syllable (not /aː/).
- **Not done:** no human has listened to confirm. Please listen once at 0:03.7 and 0:29.1.

## Quality gates
| Gate | Result |
|---|---|
| 1 · contact sheet v1 | **Rejected**: broken logo clip on end card; "+100" overlapping its label; echo words illegible; titles wrapping; 26 px day labels; dead space. (`contact-sheet-v1-rejected.jpg`) |
| 1 · contact sheet v2 | **Rejected**: word-reveal mask clipped Arabic dots/tanween («خصيصاً» rendered as «خصصا»). (`contact-sheet-v2-revised.jpg`) |
| 1 · contact sheet v3 | Approved. (`contact-sheet-approved.jpg`) |
| 2 · preview QC, first run | **Failed**: `yuvj420p` full-range output; frozen holds up to 2.3 s. Fixed (BT.709 colour space, ambient camera push + glow drift). |
| 2 · preview QC, second run | Pass (all 11 checks) + frame review |
| 3 · final QC | Pass: duration 34.133 s = timeline, A/V aligned, no black or frozen frames, -14.0 LUFS, -1.0 dBTP (`qc-final.json`, `qc-final-frames.jpg`) |
| Sync spot check | Hook slam bar absent at 1.95 s, 61 % at 2.10 s; hit transient at ≈1.98 s; spoken «مو» at 2.02 s |

## Audio
- Narration: take A of 2 (32.76 s, -19.1 LUFS raw, no clipping).
- Music: original procedural bed (`scripts/make-music.ts`) — the connector has no music generation; no third-party audio used.
- SFX (ElevenLabs Sound Effects): whoosh, hit, tick, logo sting.
- Mix: voice HPF + compression, music side-chain-ducked, two-pass loudnorm → -14 LUFS / -1 dBTP.

## ElevenLabs credits used (≈)
| Item | Credits |
|---|---|
| Pronunciation test, 2 takes | 134 |
| Blind STT of test take | 43 |
| Narration, 2 takes | 844 |
| Blind STT of narration | 180 |
| 4 SFX, 1 take each | 67 |
| **Total** | **≈ 1,268** (≈ US$0.23 at connector pricing) |

## Known limits
- Logos are 420 px rasters; kept ≤ 1.25×. Supply vectors for sharper end cards (docs/MISSING_ASSETS.md).
- Music is a functional bed, not a composed track. Swap in a licensed track by replacing `music.wav` and re-running `npm run mix` + render.
