# RESHAPE club commercial — delivery & QA report

## Files

| File | Spec |
| --- | --- |
| `RESHAPE_Club_Commercial_35s.mp4` | 1080×1920, 30 fps, 1050 frames, 35.0 s, H.264 High yuv420p BT.709 (CRF 17, ~7.2 Mb/s), AAC-LC 48 kHz stereo 320 kb/s, 32.9 MB |
| `RESHAPE_Saudi_Voiceover.wav` | VO stem exactly as mixed, 48 kHz / 24-bit, 35.0 s, aligned to the video timeline |
| `RESHAPE_Arabic_Subtitles.srt` | 10 cues, timed from a word-level transcription of the final VO |
| `RESHAPE_Instagram_Caption.md` | Saudi Arabic caption, short version, link guidance |
| `RESHAPE_Reels_Cover.jpg` | End-card frame for the Reels/TikTok cover |
| `../video/` | Editable Remotion project (see `video/README.md`) |

## Checklist (from the brief)

| # | Check | Result |
| --- | --- | --- |
| 1 | Runtime 30–40 s | 35.0 s (1050 frames) |
| 2 | 1080×1920 | Yes, 30 fps |
| 3 | Arabic spelling and RTL | Independent review of every text card: correct spelling, shadda placement, word order, joining, no clipping or overlap |
| 4 | Every VO sentence reviewed | Blind ElevenLabs Scribe transcription of the final 35 s VO stem returns all 48 words; the brand name is heard as "Reshape" |
| 5 | Saudi pronunciation and pacing | Saudi voice "Saadoun" (deep, natural Saudi). Natural pace with no time-stretching. The group and CTA lines use calmer alternate takes, so energy builds without shouting. Connected speech renders «وخلّ التحدّي» as *khalli-t-taḥaddi*, normal Saudi elision. **A native listener should sign off before paid spend (see notes).** |
| 6 | Smooth transitions | Hard cuts on bar lines (120 BPM), whips and flares. White flashes are used only on the slam (2.5 s) and the drop (26 s); 20.0 s fades out of white |
| 7 | Audio levels | −14.2 LUFS integrated, −1.3 dBTP true peak, LRA 4 LU. VO sits 8–14 LU above the music on every line |
| 8 | Logo accurate | Traced from the production-site logo (shape, proportions, red #E71C2B and ™ unchanged). The 3D reveal extrudes the same mark |
| 9 | Registration info | End card shows `reshape-sa.com` and `@reshape.sa`. The full URL is in the caption and ad-CTA guidance |
| 10 | No remote training promoted | Copy says «الحصص الجماعية بالنادي». There is no online, app or remote language anywhere |
| 11 | No black, frozen or missing frames | Black only at 0–0.3 s (opening boom, per brief) and 25.83–26.0 s (silence before the drop, intended). Static frames only on the end-card hold (31.4–35 s, intended so it can be read) |
| 12 | CTA readable | End card holds still for more than 3 s: logo, «الحصص الجماعية بالنادي», «سجّل الآن» (a flat label, not a fake button), URL, handle. All inside the mobile safe area |
| 13 | Full render reviewed | Half-res preview reviewed, independent QA pass, fixes applied, then the final reviewed at 2 fps plus spot frames |

## Production notes and limitations (please read)

1. **No live-action footage.** This environment could not reach Pexels/Pixabay/Unsplash, and Higgsfield's delivery CDN was blocked. The Higgsfield account also had 3.25 credits against 35 per 5 s clip. So the visuals are CGI training equipment (barbells, plates, kettlebells, battle ropes, slam balls) with brand lighting, plus Arabic kinetic typography and the authentic logo. There are no people or coaches on screen. Every CGI shot sits in a *footage slot* (`video/src/lib/footage.ts`): drop approved RESHAPE club clips into `video/public/footage/` and re-render (about 35 min here). Timing, type and audio stay.
2. **Offer not used.** The 40% / +10% offer from the reference ad could not be verified (reshape-sa.com and Instagram were blocked), so the cut is evergreen with no prices, discounts or deadlines.
3. **Music is original and synthesised in code** (`video/scripts/build_audio.py`). It is commercially safe but not at the level of a licensed library track. Swap `video/public/audio/music.wav` for a licensed 35 s track if you prefer.
4. **Voice-over is ElevenLabs TTS** (eleven_v4, Saudi voice "Saadoun"). It was checked by blind transcription and pitch/loudness analysis, but no human listened to it in production. Have a Saudi team member listen once before paid spend. For a hero campaign, a studio recording of the same script with a Saudi VO artist is the gold standard; the timing and edit list are in `build_audio.py`.
5. **Logo source is a 420 px PNG** from the existing site. The traced vector is clean, but a master SVG/AI from RESHAPE would make the end card perfectly crisp (`video/src/components/logoPaths.ts`).
6. The equipment shown is generic and illustrative. Match it to the club's real equipment when swapping in footage.
