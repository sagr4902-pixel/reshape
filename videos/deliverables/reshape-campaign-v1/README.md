# RESHAPE — «من أول حركة… إلى أقوى نسخة منك» (v1)

| الملف | الوصف |
|---|---|
| `RESHAPE_campaign_v1_1080x1920_30fps.mp4` | الإعلان النهائي — عمودي 1080×1920، 30fps، H.264 + AAC، الصوت مضبوط على −14 LUFS |
| `RESHAPE_reel_cover_1080x1920.png` | غلاف الريل (المحتوى المهم داخل منطقة القص 3:4 لشبكة الحساب) |
| `instagram_caption.md` | كابشن إنستقرام بالعربي مع دعوة واضحة للتسجيل |
| `RESHAPE_audio_mix.wav` | المكساج النهائي (تعليق صوتي + مؤثرات، بدون موسيقى) |
| `RESHAPE_stem_voiceover.wav` | التعليق الصوتي وحده (صوت mohammed alsagr — eleven_v4) |
| `RESHAPE_stem_sfx.wav` | المؤثرات الصوتية وحدها |

> ملفات WAV كبيرة الحجم فما تنرفع على GitHub؛ تُولّد من جديد بأمر `python3 scripts/mix.py scripts/cues.json` ثم `bash scripts/render_final.sh`.

## المصدر القابل للتعديل
مشروع Remotion في `reshape/videos/` — راجع `videos/README.md`.
- تعديل نص أو توقيت جملة: `src/films/reshape/timeline.ts` و`src/vo_timing.json`.
- تعديل المشاهد: `src/films/reshape/scenes/` (S1–S3 في `world.tsx`، S4 في `s45parts.tsx`، S5 في `s5layers.tsx`، S6 في `S6Reveal.tsx`).
- تعديل المؤثرات: `scripts/cues.json` ثم إعادة المكساج.
