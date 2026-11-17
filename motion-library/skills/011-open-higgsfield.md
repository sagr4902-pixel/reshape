# 011 — OpenHiggsfield (استوديو توليد صور وفيديو مفتوح المصدر)

| الحقل | القيمة |
|---|---|
| التصنيف | skills / أدوات (مرجع أداة خارجية، **ليست مهارة Claude**) |
| المصدر | https://github.com/wide-trace/open-higgsfield (commit `b16a0ef`، 2026-09-17) |
| الأداة المستهدفة | Higgsfield / توليد فيديو وصور بالذكاء الاصطناعي |
| المقاس | حسب النموذج (16:9 / 9:16 / 1:1 …) |
| الوسوم | #ai-video #ai-image #higgsfield #kling #seedance #wan #flux #b-roll |
| تاريخ الحفظ | 2026-11-17 |

## ما هي
تطبيق ويب (Next.js 16 + React 19 + Zustand) مفتوح المصدر كبديل لواجهة Higgsfield: شريط برومت واحد يولّد صور وفيديو من **38 نموذج** (8 صور، 30 فيديو) — منها Soul 2 / Soul Cinema، Seedance 2 و 2.5 (Edit / Extend)، Kling 2.5 / 2.6 / 3 / O1 / O3، Wan 2.6 / 2.7 / 3، Flux 2 / 3، Ideogram 4، Recraft 4.1، LTX 2.5، MiniMax Hailuo، PixVerse 6، Grok Imagine، Qwen Image.
- لكل نموذج إعداداته (المقاس، الدقة، المدة، الصوت، العدد) ومدخلاته (إطار بداية/نهاية، مراجع، فيديو، صوت).
- معرض بالسجل والمفضلة، إعادة استخدام البرومت والإعدادات، تحميل جماعي.
- النسخة المستضافة: openhiggsfield.ai.

## إعدادات النماذج (مستخرجة من الكتالوج)
- [`011-open-higgsfield/models.md`](011-open-higgsfield/models.md): جدول عربي لكل النماذج الـ 38 (المدخلات، المقاسات، الدقة، المدة، الصوت، الإعدادات الخاصة) + دليل اختيار سريع لمقاطعنا + تكاليف مقاسة.
- [`011-open-higgsfield/models.json`](011-open-higgsfield/models.json): نفس البيانات للسكربتات.

## التشغيل الذاتي (لم يُشغَّل في هذه البيئة)
```bash
pnpm install && pnpm dev   # http://localhost:3000
# .env: HF_API_BASE_URL=<أصل واجهة التوليد>  OPEN_HIGGSFIELD_READ_WRITE_TOKEN=<Vercel Blob token>
```
يحتاج مفتاح منصة التوليد بصيغة `id:secret` (يُدخل في الواجهة ويُحفظ في كوكي httpOnly)، وتوكن Vercel Blob لرفع الملفات.

## متى نستخدمه في المونتاج
- توليد لقطات B-roll حقيقية (رياضيين، صالة تدريب، أطفال) بدل الرسوم، أو خلفيات وانتقالات سينمائية تدمج داخل Remotion.
- **البديل الأسرع هنا:** موصل Higgsfield متصل فعلًا في هذه الجلسة (`generate_video` / `generate_image` / `models_explore`) ويغطي نفس النماذج بدون تشغيل التطبيق — نستخدمه مباشرة متى احتجنا لقطات مولّدة.

## مرتبط بـ
- 006 (فيلم إطلاق بأسلوب مختبرات AI)، 008 / 010 (حملات RESHAPE) — للقطات حقيقية بدل الشخصيات المرسومة.
