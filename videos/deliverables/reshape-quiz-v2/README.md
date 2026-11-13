# RESHAPE — «اختبار سريع: تمرين؟ ولّا تقدُّم؟» (v2)

نسخة ثانية مبنية بنفس أسلوب الفيديو المرجعي (اختبار تفاعلي، تايبوقرافي متحرك على ورق، لوحات ملوّنة، شخصية مربعة بحبل)، بألوان RESHAPE، وصوت محمد الصقر بلهجة شعبية طبيعية (القاف «گ»). بدون موسيقى.

| الملف | الوصف |
|---|---|
| `RESHAPE_quiz_v2_1080x1920_30fps.mp4` | الماستر — 1080×1920، 30fps، 71.5 ث، H.264 (CRF 16) + AAC 320k، الصوت −14.3 LUFS. حجمه 152MB بسبب ملمس الورق، فما ينرفع على GitHub (يُعاد بـ `bash scripts/render_quiz.sh`) |
| `RESHAPE_quiz_v2_web.mp4` | نسخة خفيفة 8MB للمشاركة (نفس الدقة، الملمس أنعم) |
| `RESHAPE_quiz_v2_cover_1080x1920.png` | غلاف الريل |
| `instagram_caption.md` | الكابشن مع دعوة «اكتب: ابدأ» |
| `*.wav` | المكساج والستيمات (تُولّد بـ `python3 scripts/cues2_build.py`) |

**المصدر:** `videos/src/films/quiz/` — السكربت في `scripts/vo2_script.json`، والتوقيت في `src/films/quiz/timeline.ts`. إعادة التصدير: `bash scripts/render_quiz.sh`.
