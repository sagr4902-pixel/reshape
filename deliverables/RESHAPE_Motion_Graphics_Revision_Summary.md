# RESHAPE — Premium Motion Graphics revision (35 s)

This is a revision of the approved commercial, not a new concept. It keeps the same script, narrative, sequence, in-club group-class focus, CTA and registration details. The visuals are rebuilt as 100 % 2D/2.5D motion graphics, and the soundtrack is voice-over plus a few soft SFX, with **no music**. The original v1 files are untouched.

## Files

| File | What it is |
| --- | --- |
| `RESHAPE_Premium_Motion_Graphics_35s.mp4` | The new commercial: 1080×1920, 30 fps, 35.0 s, H.264 + AAC 48 kHz |
| `RESHAPE_Saudi_Voiceover_Corrected.wav` | Final VO stem with the corrected «RESHAPE» (48 kHz / 24-bit, 35.0 s, aligned to the video) |
| `RESHAPE_Premium_Motion_Graphics_Arabic_Subtitles.srt` | 10 Arabic cues timed from the VO word timings; the brand is written «RESHAPE» |
| `RESHAPE_Pronunciation_Evidence.png` | Spectrograms: both spoken «RESHAPE» vs the speaker's own "shape" / "sheep" calibration |
| `../video/` | Editable Remotion project. The composition is `ReshapeMotionGraphics`; see `video/README.md` |

Unchanged v1 files: `RESHAPE_Club_Commercial_35s.mp4`, `RESHAPE_Saudi_Voiceover.wav`, `RESHAPE_Arabic_Subtitles.srt`, `QA_REPORT.md`.

## What changed

**1. Visuals: 100 % motion graphics.** There is no footage, no stock, no CGI equipment and no AI-generated people.
- **Athletes.** They are custom animated silhouettes, not icons. A forward-kinematics rig drives tapered solid shapes: V-shaped torso, muscular thighs and calves, tapered forearms. Real exercise cycles are animated per frame: squat, kettlebell swing, deadlift, run, jump squat and climb. Knockout gaps, an orange rim and motion trails give a premium editorial look.
- **Design system.** Brand colours #FF5420 / #17181A / #FFFFFF; the logo red appears only in the authentic logo. One 14° slant, taken from the RESHAPE mark, recurs in bars, panels, wipes and the CTA. Other elements: drawn-on lines, shockwave rings, a perspective training floor, a drifting technical grid, outlined layered headlines, chevrons and an RTL progress bar.
- **Arabic kinetic typography.** Every word lands on the frame it is spoken. Animation is per word, never per letter, so Arabic joining is never broken. Layout is RTL and key copy stays inside the mobile safe area.

**2. Scene by scene** (the timing follows the VO):

| Time | Scene | Motion design |
| --- | --- | --- |
| 0–5.5 s | Hook | Black stage, orange strike lines and slant bars, «يغيّرك» as a layered orange headline. A silhouette performs a heavy deadlift, then stands tall on «يعيد تشكيلك». The orange block behind the athlete literally *reshapes* into the RESHAPE mark. |
| 5.5–12.9 s | Brand | The mark settles into the authentic logo lockup (soft impact) and the wordmark wipes in on the spoken «RESHAPE». «كلّ حصّة… خطوة جديدة» builds a rising step graphic. Three slanted panels open on the words: **قوّة** (deadlift), **لياقة** (run), **ثقة** (victory pose). |
| 12.9–19.7 s | Group | A three-row class on a 2.5D floor, with depth of field. It does synchronised squats, linked by an orange constellation on «حصص جماعية». On «أجواء حماسية» it switches to jump squats with landing shockwaves and particles. On «وتحدّي» one athlete steps forward into a kettlebell swing with the bell's path drawn on. |
| 19.7–24.7 s | Progress | Five slanted levels rise right→left. «هنا» marks the first; on «تبدا» the athlete climbs and each level fills orange, with an RTL progress bar. No numbers or claims. |
| 24.7–35 s | CTA | The logo lands on «RESHAPE» with a shockwave, then «غيّر أداءك / وارفع مستواك» with a jump-squat athlete and a rising level meter. The end card is complete by ~29.4 s and holds for about 5.6 s: logo, «الحصص الجماعية **بالنادي**», an animated «سجّل الآن» label (light sweep + chevrons, a flat label rather than a fake button), `reshape-sa.com`, `@reshape.sa`, and a small class training in sync underneath. |

Transitions are slanted orange/black brand wipes on the three cuts after the brand scene. The hook→brand cut is seamless: the mark keeps its exact size and position, then settles into the lockup.

**3. Audio: no music.** The video uses only the Saudi male VO plus 8 restrained, non-tonal SFX: one soft impact at 0 s, on the logo and on the end card, and soft whooshes on the four cuts. They are synthesised from filtered noise, with no pitched content and no beat. The VO stays dominant; it is not pitch-shifted, time-stretched, echoed or bass-boosted (only a 70 Hz rumble filter and gentle levelling).

**4. Pronunciation: «RESHAPE» = ree-SHAYP /riːˈʃeɪp/.** In v1 the brand word was measurably wrong in both places. In the brand line the vowel centralised (F2 fell to ~1300 Hz); in the CTA it was clipped to ~80 ms («ريشِب»). Both lines were regenerated with the same Saudi voice ("Saadoun", ElevenLabs v4) from the IPA spelling and verified three ways:
- Blind speech-to-text recognises the word as "Reshape".
- Formants of the stressed vowel match the speaker's own English "shape" /eɪ/: mid F1 with F2 gliding upward, unlike "sheep" /iː/ (ريشيب) or "shop" /ɑː/ (ريشاب).
- The same measurement was repeated on the audio **inside the final MP4** (QA results below).

Other lines, the Saudi accent and the delivery are unchanged from the approved VO.

## QA results (final MP4)

QA_RESULTS_PLACEHOLDER

## Notes

- The voice is ElevenLabs TTS. The brand word was verified acoustically and by blind transcription, but a native Saudi listener should give it one listen before paid spend.
- The logo is the authentic traced RESHAPE mark (unchanged shape, proportions, colour and ™). A master SVG from RESHAPE would make the end card even crisper (`video/src/components/logoPaths.ts`).
- No prices, offers or deadlines are used; the cut is evergreen, in-club only.
