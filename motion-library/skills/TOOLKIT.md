# 🧰 الأدوات والمهارات المتاحة للموشن والمونتاج

جرد لما هو متاح فعليًا في هذه البيئة، مصنّف حسب الاستخدام.

## 0) مهارات محفوظة في المكتبة
| المهارة | الاستخدام |
|---|---|
| `product-film` (004) | فيلم منتج / إطلاق / لوب لصفحة هبوط من نظام تصميم المنتج — مثبتة في `.claude/skills/product-film/` |

## 1) بناء الفيديو بالكود — Remotion (React)
مثبتة في الريبو تحت `agent/skills/` ومتاحة كمهارات:

| المهارة | الاستخدام |
|---|---|
| `remotion-create` | إنشاء مشروع فيديو جديد |
| `remotion-best-practices` | الموجّه العام لكل مهارات Remotion |
| `remotion-markup` | المحتوى والتحريك والمؤثرات |
| `transitions` | **الانتقالات بين المشاهد** (`@remotion/transitions`) |
| `sequencing` / `compositions` | ترتيب المشاهد والتوقيت |
| `text-highlights` / `measuring-text` / `fonts` | النصوص والخطوط |
| `remotion-captions` | الترجمة والكابشن المتحرك |
| `light-leaks` / `effects` / `3d` / `lottie` / `gif` | مؤثرات وعناصر |
| `audio` / `sfx` / `voiceover` / `audio-visualization` | الصوت والمؤثرات الصوتية |
| `transparent-videos` / `embedding-videos` | فيديو شفاف ودمج مقاطع |
| `remotion-maps` | تحريك الخرائط |
| `remotion-studio` / `remotion-render` | المعاينة والتصدير |

## 2) التحريك بـ GSAP / HTML
| المهارة | الاستخدام |
|---|---|
| `gsap-core` / `gsap-timeline` | التحريك والتسلسل الزمني |
| `gsap-plugins` | SplitText, MorphSVG, DrawSVG, CustomEase… |
| `anthropic-skills:hyperframes` | فيديو HTML قابل للتصدير (HyperFrames) |
| `anthropic-skills:motion-video` | فيديو موشن |

## 3) أساليب مونتاج جاهزة
| المهارة | الاستخدام |
|---|---|
| `anthropic-skills:famous-youtube-editor` | أسلوب مونتاج يوتيوبرز |
| `anthropic-skills:youtube-broll-maker` | لقطات B-roll |
| `anthropic-skills:youtube-clean` | مونتاج نظيف |
| `anthropic-skills:video-ad-editor` | إعلانات فيديو |
| `anthropic-skills:capcut-smartcut` | أسلوب CapCut |
| `anthropic-skills:davinci-video` | DaVinci Resolve |
| `anthropic-skills:open-edit` | مونتاج مفتوح |
| `anthropic-skills:ffmpeg` / `silence-detection` | قص وتحويل وحذف الصمت |

## 4) خدمات متصلة (MCP)
| الخدمة | الاستخدام |
|---|---|
| **Higgsfield** | توليد فيديو/صور بالذكاء الاصطناعي، Motion control، Upscale |
| **HyperFrames (HeyGen)** | مشاريع فيديو HTML ورندر سحابي |
| **Descript** | مونتاج بالنص، كليبات سوشال، ترجمة |
| **ElevenLabs** | تعليق صوتي (TTS) وتفريغ صوتي |
| **LottieFiles** | أنيميشن Lottie جاهزة |
| **Canva** | تصاميم وفيديوهات Canva |
| **Figma** | تصميم وتحريك عناصر |
| **Streamline** | أيقونات |

## 5) أدوات النظام
- **ffmpeg** للقص والدمج والتحويل.
- **Playwright + Chromium** للتقاط/رندر صفحات HTML كفيديو.
