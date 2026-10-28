# Template library

All templates receive `cues` (frames relative to scene start, from the real
narration), `words`, `durationInFrames`, plus their own props from `job.json`.
Preview any template alone in Studio under **Template-Library**.

## `sports-impact` — Premium sports promo (hook)
Outlined Latin backdrop drifting in alternating rows, Arabic lead line, a key
word repeated as outlined echoes ("repetition" made visible), a 14° signal-red
slam bar with the punchline, REP counter ticks.
```json
{ "eyebrow": "RE-SHAPE YOUR BODY", "backdrop": "RE-SHAPE",
  "lead": [{ "text": "جسمك", "cue": "w1" }, { "text": "يتغيّر", "cue": "w2" }],
  "echo": { "text": "بالتكرار", "cue": "echo", "count": 3 },
  "slam": { "text": "مو بالحماس.", "cue": "slam" } }
```

## `kinetic-lines` — Bold kinetic typography
Right-aligned stack of giant words revealed in time with speech; one accent
word in red with a sand underline sweep; optional wordmark lead-in; footer with
an icon; vertical Latin side label.
```json
{ "lead": { "text": "مع", "cue": "lead", "withWordmark": true },
  "lines": [[{ "text": "برنامجك", "cue": "k1" }], [{ "text": "خصيصاً", "cue": "k4", "accent": true }]],
  "footer": { "text": "من أي مكان في العالم", "cue": "footer", "icon": "Globe" },
  "sideLabel": "ONLINE COACHING" }
```

## `service-steps` — Icon-based service explainer
Numbered vertical rail on the right; 2–4 steps, each a Lucide icon tile + title
+ one-line caption, landing on its cue. Newest step is active (red).
```json
{ "eyebrow": "HOW IT WORKS", "title": [{ "text": "كيف", "cue": "t" }],
  "items": [{ "icon": "Clapperboard", "title": "فيديو لكل تمرين", "caption": "…", "cue": "i1" }] }
```

## `week-infographic` — Educational infographic
7-day matrix; each row is an option (big value + caption) whose training days
fill in reading order when spoken. Solid = training, outlined = optional.
Legend states the pattern is illustrative.
```json
{ "title": [{ "text": "أيام", "cue": "a" }, { "text": "أنت", "cue": "c", "accent": true }],
  "days": ["سبت","أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة"], "weekLabel": "أسبوعك · ٧ أيام",
  "rows": [{ "value": "2-3", "caption": "وقت محدود", "on": [0, 3], "optional": [5], "cue": "r1" }],
  "legend": { "training": "يوم تمرين", "optional": "اختياري", "note": "التوزيع للتوضيح" },
  "footer": { "text": "حسب هدفك ووقتك", "cue": "footer", "icons": ["Target", "Clock"] } }
```

## `stat-counters` — Animated statistics
Giant Barlow italic numerals counting up to land on the spoken number (8 f
lead), three-quarter gauge arcs, labels on a rule, sourced footnote.
**Every stat needs `source`.**
```json
{ "eyebrow": "COACH ALSAGR", "heading": [{ "text": "الكابتن", "cue": "h1" }],
  "stats": [{ "value": 100, "prefix": "+", "label": "متدرب وصل لهدفه", "cue": "athletes", "accent": true, "source": "index.html coach stats" }],
  "footnote": { "text": "منذ 2018 · شهادة NCSF معتمدة", "cue": "foot", "icon": "ShieldCheck" } }
```

## `brand-reveal` — Brand reveal and CTA
Official primary lockup revealed mark-first through a slanted mask, then the
clip opens to the wordmark. Bookends the hook with the same outlined backdrop.
CTA pill, supporting line, URL.
```json
{ "tagline": "RE-SHAPE YOUR BODY", "logoCue": "logo",
  "cta": { "label": "ابدأ التسجيل الآن", "cue": "cta" },
  "sub": { "text": "دقيقتان · ٥ خطوات", "cue": "sub" }, "url": "reshape-online.com" }
```

## Shared components
`Stage` (ink stage, grain, drifting glow, ambient push) · `Backdrop` · `WordLine`
(diacritic-safe word reveal) · `Eyebrow` · `Icon` (Lucide, constant optical
stroke) · `Logo` (original files, scale cap) · `SlantReveal` (scene wipe).
