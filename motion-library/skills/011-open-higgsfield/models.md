# إعدادات نماذج OpenHiggsfield (38 نموذج)

مستخرجة نصيًا من `src/generation/catalog` في مستودع wide-trace/open-higgsfield (commit `b16a0ef`، 2026-09-17). نسخة للآلات: [`models.json`](models.json).

## ⚠️ اقرأ قبل الاستخدام
- هذا **كتالوج التطبيق**، مو حدود المنصة. 18 نموذج فيديو و6 نماذج صور ما لها إعدادات خاصة: التطبيق يعطيها قالب عام (فيديو: 16:9/9:16/1:1، 720p/1080p، 4–10 ث · صور: 6 مقاسات، 1k/2k/4k، حتى 8 مراجع). الحدود الحقيقية ممكن تكون أوسع.
- مثال موثّق: Seedance 2.5 هنا 480p/720p وحتى 30 ث، بينما موصل Higgsfield في الجلسة (2026-11-17) يقبل حتى **4k** و**30 ث** وأوضاع edit/extension.
- قبل أي توليد نتحقق من الموصل (`models_explore get`) ونحسب التكلفة (`get_cost`).

## نماذج لها إعدادات خاصة (الأدق)

### صور
| النموذج | المعرّف | المدخلات | الإعدادات |
|---|---|---|---|
| Soul 2 | `soul-2` | نص فقط | `aspectRatio`: 9:16 / 16:9 / 4:3 / 3:4 / 1:1 / 2:3 / 3:2 (افتراضي 1:1)<br>`resolution`: 720p / 1080p (افتراضي 720p)<br>`batchSize`: 1 / 4 (افتراضي 1)<br>`enhancePrompt`: نعم/لا (افتراضي لا) |
| Soul Cinema | `soul-cinema` | نص فقط | `aspectRatio`: 9:16 / 16:9 / 4:3 / 3:4 / 1:1 / 2:3 / 3:2 (افتراضي 1:1)<br>`resolution`: 720p / 1080p (افتراضي 720p)<br>`batchSize`: 1 / 4 (افتراضي 1)<br>`enhancePrompt`: نعم/لا (افتراضي لا) |

### فيديو
| النموذج | المعرّف | المدخلات | الإعدادات |
|---|---|---|---|
| Seedance 2.5 | `seedance-2.5` | إطار بداية ×1، إطار نهاية ×1، مراجع ×30، فيديو ×10، صوت ×10 | `aspectRatio`: 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 (افتراضي 16:9)<br>`duration`: 4–30 (افتراضي 5)<br>`resolution`: 480p / 720p (افتراضي 720p)<br>`generateAudio`: نعم/لا (افتراضي نعم)<br>`outputFormat`: mp4 / mov (افتراضي mp4) |
| Seedance 2.5 Edit | `seedance-2.5-edit` | فيديو ×1، مراجع ×30، صوت ×10 | `resolution`: 480p / 720p (افتراضي 720p)<br>`generateAudio`: نعم/لا (افتراضي نعم)<br>`outputFormat`: mp4 / mov (افتراضي mp4) |
| Seedance 2.5 Extend | `seedance-2.5-extend` | فيديو ×1، مراجع ×30، صوت ×10 | `duration`: 4–30 (افتراضي 5)<br>`resolution`: 480p / 720p (افتراضي 720p)<br>`generateAudio`: نعم/لا (افتراضي نعم)<br>`outputFormat`: mp4 / mov (افتراضي mp4) |
| Seedance 2.0 | `seedance-2` | إطار بداية ×1، إطار نهاية ×1، مراجع ×9، فيديو ×3، صوت ×3 | `aspectRatio`: 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 (افتراضي 16:9)<br>`duration`: 4–15 (افتراضي 5)<br>`generateAudio`: نعم/لا (افتراضي نعم)<br>`resolution`: 480p / 720p / 1080p / 4k (افتراضي 720p) |
| Seedance 2.0 Fast | `seedance-2-fast` | إطار بداية ×1، إطار نهاية ×1، مراجع ×9، فيديو ×3، صوت ×3 | `aspectRatio`: 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 (افتراضي 16:9)<br>`duration`: 4–15 (افتراضي 5)<br>`generateAudio`: نعم/لا (افتراضي نعم)<br>`resolution`: 480p / 720p (افتراضي 720p) |
| Seedance 2.0 Mini | `seedance-2-mini` | إطار بداية ×1، إطار نهاية ×1، مراجع ×9، فيديو ×3، صوت ×3 | `aspectRatio`: 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 (افتراضي 16:9)<br>`duration`: 4–15 (افتراضي 5)<br>`generateAudio`: نعم/لا (افتراضي نعم)<br>`resolution`: 480p / 720p (افتراضي 720p) |
| Kling 3.0 Turbo | `kling-3-turbo` | إطار بداية ×1 | `aspectRatio`: 16:9 / 9:16 / 1:1 (افتراضي 16:9)<br>`resolution`: 720p / 1080p (افتراضي 720p)<br>`duration`: 3–15 (افتراضي 5) |
| Kling 3.0 Standard | `kling-3-std` | إطار بداية ×1، إطار نهاية ×1 | `aspectRatio`: 16:9 / 9:16 / 1:1 (افتراضي 16:9)<br>`duration`: 3–15 (افتراضي 5)<br>`sound`: نعم/لا (افتراضي نعم)<br>`cfgScale`: 0–1 (افتراضي 0.5)<br>`multiShots`: نعم/لا (افتراضي لا) |
| Kling 3.0 Pro | `kling-3-pro` | إطار بداية ×1، إطار نهاية ×1 | `aspectRatio`: 16:9 / 9:16 / 1:1 (افتراضي 16:9)<br>`duration`: 3–15 (افتراضي 5)<br>`sound`: نعم/لا (افتراضي نعم)<br>`cfgScale`: 0–1 (افتراضي 0.5)<br>`multiShots`: نعم/لا (افتراضي لا) |
| Kling 3.0 4K | `kling-3-4k` | إطار بداية ×1، إطار نهاية ×1 | `aspectRatio`: 16:9 / 9:16 / 1:1 (افتراضي 16:9)<br>`duration`: 3–15 (افتراضي 5)<br>`sound`: نعم/لا (افتراضي نعم)<br>`cfgScale`: 0–1 (افتراضي 0.5)<br>`multiShots`: نعم/لا (افتراضي لا) |
| Kling 3.0 Motion Control | `kling-3-motion-std` | إطار بداية ×1، فيديو ×1 | `keepOriginalSound`: نعم/لا (افتراضي نعم)<br>`characterOrientation`: video / image (افتراضي video) |
| Kling 3.0 Motion Control Pro | `kling-3-motion-pro` | إطار بداية ×1، فيديو ×1 | `keepOriginalSound`: نعم/لا (افتراضي نعم)<br>`characterOrientation`: video / image (افتراضي video) |

## نماذج بالقالب العام
**صور (6):** Flux 2، Grok Imagine 2.0، Ideogram 4.0، Recraft 4.1، Qwen Image 3، Z-Image Turbo — مراجع ×8، المقاس auto / 1:1 / 4:3 / 3:4 / 16:9 / 9:16، الدقة 1k / 2k / 4k.

**فيديو (18):** Wan 3.0، Wan 3.0 Prime، Wan 2.7، Wan 2.6، Flux 3، MiniMax H3، MiniMax Hailuo 2.3، Happy Horse 1.0، Happy Horse 1.1، Kling 2.6، Kling 2.5، Kling O3، Kling O1 (Omni)، LTX 2.5 Fast، LTX 2.5 Pro، Grok Imagine Video 1.5، PixVerse 6، DoP — المقاس 16:9 / 9:16 / 1:1، الدقة 720p / 1080p، المدة 4–10 ث.

| النموذج | المعرّف | المدخلات | مسار الـ API |
|---|---|---|---|
| Flux 2 | `flux-2` | مراجع ×8 | text: `flux-2-pro` |
| Grok Imagine 2.0 | `grok-imagine-2` | مراجع ×8 | text: `xai/grok-imagine-image-2.0` |
| Ideogram 4.0 | `ideogram-4` | مراجع ×8 | text: `ideogram/v4.0` |
| Recraft 4.1 | `recraft-4.1` | مراجع ×8 | text: `recraft/v4.1/text-to-image` |
| Qwen Image 3 | `qwen-image-3` | مراجع ×8 | text: `alibaba/qwen-image-3/text-to-image` |
| Z-Image Turbo | `z-image-turbo` | مراجع ×8 | text: `z-image/turbo` |
| Wan 3.0 | `wan-3` | إطار بداية ×1 | text: `alibaba/wan-3.0/text-to-video`<br>image: `alibaba/wan-3.0/image-to-video` |
| Wan 3.0 Prime | `wan-3-prime` | إطار بداية ×1 | text: `alibaba/wan-3.0-prime/text-to-video`<br>image: `alibaba/wan-3.0-prime/image-to-video` |
| Wan 2.7 | `wan-2.7` | إطار بداية ×1 | text: `wan/v2.7/text-to-video`<br>image: `wan/v2.7/image-to-video` |
| Wan 2.6 | `wan-2.6` | إطار بداية ×1 | text: `wan/v2.6/text-to-video`<br>image: `wan/v2.6/image-to-video` |
| Flux 3 | `flux-3` | إطار بداية ×1 | text: `blackforestlabs/flux-3/text-to-video`<br>image: `blackforestlabs/flux-3/image-to-video` |
| MiniMax H3 | `minimax-h3` | إطار بداية ×1 | text: `minimax/h3/text-to-video`<br>image: `minimax/h3/image-to-video` |
| MiniMax Hailuo 2.3 | `minimax-hailuo-2.3` | إطار بداية ×1 | text: `minimax/hailuo-2.3/standard/text-to-video`<br>image: `minimax/hailuo-2.3/standard/image-to-video` |
| Happy Horse 1.0 | `happy-horse-1` | إطار بداية ×1 | text: `alibaba/happy-horse/text-to-video`<br>image: `alibaba/happy-horse/image-to-video` |
| Happy Horse 1.1 | `happy-horse-1.1` | إطار بداية ×1 | text: `alibaba/happy-horse/v1.1/text-to-video`<br>image: `alibaba/happy-horse/v1.1/image-to-video` |
| Kling 2.6 | `kling-2.6` | إطار بداية ×1 | text: `kling-video/v2.6/pro/text-to-video`<br>image: `kling-video/v2.6/pro/image-to-video` |
| Kling 2.5 | `kling-2.5` | إطار بداية ×1 | image: `kling-video/v2.5-turbo/standard/image-to-video` |
| Kling O3 | `kling-o3` | إطار بداية ×1، إطار نهاية ×1 | firstLast: `kling-video/o3/first-last-frame` |
| Kling O1 (Omni) | `kling-o1` | إطار بداية ×1، إطار نهاية ×1 | firstLast: `kling-video/omni/first-last-frame` |
| LTX 2.5 Fast | `ltx-2.5-fast` | إطار بداية ×1 | text: `lightricks/ltx-2.5/text-to-video/fast` |
| LTX 2.5 Pro | `ltx-2.5-pro` | إطار بداية ×1 | text: `lightricks/ltx-2.5/text-to-video/pro` |
| Grok Imagine Video 1.5 | `grok-imagine-video-1.5` | مراجع ×8، فيديو ×3 | reference: `xai/grok-imagine-video/v1.5/reference-to-video` |
| PixVerse 6 | `pixverse-6` | إطار بداية ×1 | text: `pixverse/v6/text-to-video`<br>image: `pixverse/v6/image-to-video` |
| DoP | `dop` | إطار بداية ×1 | image: `higgsfield-ai/dop/lite` |

## اختيار سريع لمقاطعنا (9:16، ريلز)
| الحاجة | الخيار | ملاحظة |
|---|---|---|
| لقطة سينمائية واحدة طويلة | Seedance 2.5 | حتى 30 ث، يقبل حتى 30 صورة مرجعية + فيديو + صوت |
| تحريك صورة جاهزة (بداية ← نهاية) | Kling 3.0 Std/Pro أو Kling O1/O3 | إطار بداية ونهاية؛ Kling 3 فيه `multiShots` و`sound` |
| نقل حركة من فيديو لشخصية في صورة | Kling 3.0 Motion Control | صورة + فيديو قيادة؛ `characterOrientation` |
| تعديل أو تمديد فيديو موجود | Seedance 2.5 Edit / Extend | |
| لقطة رخيصة للتجربة | Seedance 2.0 Mini/Fast، Kling 3.0 Turbo | |
| صور شخصيات/أزياء | Soul 2 / Soul Cinema | 7 مقاسات منها 2:3 و3:2، دفعة 1 أو 4 |
| صورة فيها نص/تايبوقرافي | Ideogram 4.0، Recraft 4.1 | |

## تكاليف مقاسة على الموصل (2026-11-17)
| النموذج (معرّف الموصل) | الإعداد | الكريدت |
|---|---|---|
| `seedance_2_5` | 4 ث، 720p، بدون صوت | 28 |
| `seedance_2_5` | 4 ث، 480p، بدون صوت | 12 |
| `kling3_0` (std) | 3 ث، بدون صوت | 4.5 |
| `kling3_0_turbo` | 3 ث | 4.5 |
| `grok_video_v15_lite` | 3 ث، 480p (نص أو صورة بداية) | 3 |
| `gpt_image_2_6` | صورة 9:16 | 0.25 |
