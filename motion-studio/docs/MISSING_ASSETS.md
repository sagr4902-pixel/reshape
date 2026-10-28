# Missing or limited brand assets

Identified during the audit. None of these were fabricated; the system works
around each one and says how.

| # | Missing asset | Impact today | Workaround in place | What to supply |
|---|---|---|---|---|
| 1 | **Vector logo master** (SVG / AI / PDF) | Logos are 420 px rasters with a 48-colour palette; edges soften above ~1.25× | All logo use capped at 1.25× (`MAX_LOGO_SCALE`); no camera push on the end card | SVG of the mark, wordmark and primary lockup |
| 2 | **High-resolution lockups** (≥ 2000 px PNG) | Same as above | Same | Transparent PNGs at 4× |
| 3 | **Official brand guidelines** (palette, clear space, minimum size) | Palette sampled from logo pixels and app CSS; clear space and minimum sizes are proposed, not official | Documented as proposed in BRAND_SYSTEM.md | The guidelines PDF, if one exists |
| 4 | **Arabic logo / wordmark** | None found in any asset. Arabic brand name appears only as spoken رِي شَيْب | On screen the brand is always the Latin wordmark | An Arabic lockup if the brand has one |
| 5 | **Light-background logo** | Red logo on light was not supplied; badge/wordmark are sand-only | All ads use the dark stage | Dark/ink versions of the wordmark |
| 6 | **Licensed music** | The connected ElevenLabs connector cannot generate music | Original procedural bed (`scripts/make-music.ts`), owned by construction | A licensed track, or enable ElevenLabs Music via the SDK with your API key and confirm your plan's licence terms |
| 7 | **Sonic logo** | No existing brand sound | `logo-sting.mp3` generated for this system | Approve or replace |
| 8 | **ELEVENLABS_API_KEY** in this cloud environment, and network access to `api.elevenlabs.io` | SDK scripts can't run in this container (host is blocked by the network policy) | ElevenLabs connector used instead; SDK scripts ready for local runs | Add the key to `.env` locally |

## Asset fingerprints (as extracted)

```
7653759ec45d11343f749ea697b7a0d7071bdf9db394e6b7413802b585440a06  logo-primary-red.png
66e254720a66c01987e35b5412551d30ccf70ccd665cf0185aeffb6bdfe6f4b0  logo-mark-red.png
deb7d41a02f61f50388fb67a30d1c27a3f515f0fe38e5efbb0460d8d3ce75fe4  wordmark-sand.png
31467be709c32f788cd37fde905d867504b2fb6bce6599af31356430e4f3861a  badge-sand.png
```

Not used on purpose: Tabby / Tamara / bank QR images in `index.html` (third-party marks), and the coach referral screenshot (UI capture with sample data).
