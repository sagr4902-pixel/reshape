# 004 — مهارة Product Film (فيلم منتج بمستوى شوريل)

| الحقل | القيمة |
|---|---|
| النوع | مهارة Claude Code (Skill / Plugin) |
| المصدر | https://github.com/Rieranthony/product-film-skill (commit `fe11efc`) |
| الرخصة | MIT (Remotion لها رخصتها الخاصة) |
| الأداة | Remotion + Bun + uv (numpy, ffmpeg كامل) |
| مكان التثبيت | `reshape/.claude/skills/product-film/` — تُحمّل تلقائيًا في جلسات ريبو reshape |
| الوسوم | #product-film #launch-video #landing-loop #promo #remotion #beat-sync |
| تاريخ الحفظ | 2026-11-13 |

## أمر التثبيت الأصلي (حرفيًا)

```text
/plugin marketplace add Rieranthony/product-film-skill
/plugin install product-film@product-film-skill
```

## ماذا تفعل
تصنع فيلم منتج (لوب لصفحة الهبوط، فيديو إطلاق، برومو، ديمو) بالكود في Remotion
باستخدام مكونات المنتج الحقيقية وألوانه وشعاره وأسلوبه:

1. **Discovery** — تقرأ نظام التصميم والتوكنز والمكونات والشعار.
2. **Interview** — تسأل: مكان العرض، المدة، الموسيقى، الميزات، والمكونات (شعار متحرك، punchlines، نوع الانتقالات: magic moves / camera moves / cuts on beat، كيرسر…).
3. **BRAND.md + Story** — هوية + beat sheet + 3 إطارات ستايل للموافقة.
4. **Music** — شبكة الإيقاع (`beats.py`)، قص الأغنية على الـ bars، المؤثرات على القمم.
5. **Build** — كل فريم دالة نقية للزمن.
6. **Review** — صور ثابتة عند كل انتقال، contact sheets، مسودة بنصف الدقة.
7. **Render** — ماستر 240fps مع motion blur → لوب صامت، نسخة بموسيقى، WebM، بوستر، مع تحقق آلي.

## متى نستخدمها
- مباشرة مع البرومتات **002** و **003** (شوريل/إطلاق SaaS) — هي المحرك المثالي لهم.
- تشارك نفس فلسفة البرومت **001** (springs مغلقة الصيغة، seek(t)، beat grid، tmix).

## ملفات مهمة داخل المهارة
- `SKILL.md` — سير العمل + الحد الأدنى للجودة + الفخاخ الشائعة.
- `reference/ingredients.md` — أنواع الانتقالات والمكونات.
- `templates/kit/` — spring, camera, cursor, move (magic moves), punchlines, dither, debug.
- `scripts/` — beats.py, audio-edit.py, stills.ts, render.ts, verify.py.
