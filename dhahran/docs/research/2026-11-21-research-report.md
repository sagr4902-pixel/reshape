# RESHAPE research report

- Checked: 2026-11-21, approx. 07:28–07:32 UTC (container clock; one batch per part, times below are to the minute at best).
- Access method: Firecrawl MCP (`firecrawl_scrape`, JS-rendered; one `firecrawl_search`). No curl. No login, cart, checkout or purchase was attempted.
- Calls used: 26 scrapes + 1 search.
- Everything below is extracted page text/metadata. I did not see rendered visuals (no screenshots taken).

---

## A. Official store catalog — https://reshape-sa.com/

### A1. Home page (Firecrawl scrape, markdown + links + branding, live fetch, ~07:28 UTC)

Source: https://reshape-sa.com/

Home page shows NO product cards in the extracted content — only a headline "Your KID Belongs Here", one banner linking to `/latest-products`, a "Play" control (video), navigation and footer.

Category links (all from the header menu):

| Category (as shown) | URL |
|---|---|
| الحصص الجماعية بالنادي | https://reshape-sa.com/الحصص-الجماعية-بالنادي/c571221986 |
| ↳ برامج الاطفال Kids | https://reshape-sa.com/برامج-الاطفال-kids/c744727253 |
| ↳ حصص تدريب الكبار | https://reshape-sa.com/حصص-تدريب-الكبار/c327249107 |
| ↳ المزايا الخاصة للاشتراك | https://reshape-sa.com/المزايا-الخاصة-للاشتراك/c469414182 |
| تدريبات الكابتن نواف الخاصة | https://reshape-sa.com/تدريبات-الكابتن-نواف-الخاصة/c1526655199 |
| ↳ التدريب الشخصي الحضوري 1:1 | https://reshape-sa.com/التدريب-الشخصي-الحضوري-1-1/c886831064 (not scraped; its product appears under the parent) |
| ↳ تدريب عن بعد Online | https://reshape-sa.com/تدريب-عن-بعد-online/c577393883 (not scraped) |
| ملابس رياضية | https://reshape-sa.com/ملابس-رياضية/c607277893 |
| الكابتن محمد الصقر | https://reshape-sa.com/الكابتن-محمد-الصقر/c1235133691 |
| ↳ التدريب عن بعد | https://reshape-sa.com/التدريب-عن-بعد/c1702006498 (not scraped; products appear under the parent) |

Other links: `/cart`, `/latest-products`.

### A2. Category listings (Firecrawl scrape each, live fetch, ~07:29 UTC)

Listing prices are bare numbers (no currency symbol in the extracted text). Where two numbers appear, the first is the current price and the second the struck-through original (confirmed by product-page metadata for the GYM items).

- `/latest-products` — "أحدث المنتجات - أكثر من 15 منتج" (15 cards returned; "لا يوجد المزيد لعرضه").
- الحصص الجماعية بالنادي — "10 منتجات": Three months - GYM, one year - GYM, KIDs- one month, KIDs- 3 months, KIDs- 6 months, KIDs- One year, Six months - GYM, SUBSCRIPTION PAUSE 1 WEEK, Travel program (EXTRA), PT TEST.
- برامج الاطفال Kids — "4 منتجات": the four KIDs products.
- حصص تدريب الكبار — "3 منتجات": the three GYM products.
- المزايا الخاصة للاشتراك — "3 منتجات": SUBSCRIPTION PAUSE 1 WEEK, Travel program (EXTRA), PT TEST.
- تدريبات الكابتن نواف الخاصة — "3 منتجات": One month online كابتن نواف, PT 30+8 free, Three months online كابتن نواف.
- الكابتن محمد الصقر — "6 منتجات" (all remote/online, see A4).
- ملابس رياضية — "منتجان" (merchandise, see A4).

Total distinct products seen: 21.

### A3. Relevant products (club membership / in-person / kids / add-ons)

Common to ALL nine product pages scraped (live fetch, ~07:31 UTC):
- Currency: SAR (page metadata `product:price:currency = SAR`; the Tamara widget text also says "SAR"). The visible price is a bare number.
- Tax wording: NONE found. No "شامل الضريبة" / VAT text on any page. Metadata `product:pretax_price:amount` equals the sale price on every page (not proof of tax treatment — treat tax status as unknown).
- Variants/options: none shown on any page. KIDs and PT pages show a quantity control ("الكمية"); GYM pages show "المرفقات" / "إضافة ملاحظة" (attachment + note field) on Three months and one year.
- Availability — AMBIGUOUS, read carefully: page metadata says `product:availability = in stock` and the category cards show "أضف إلى السلة" (genuinely sold-out items in the same store show "نفدت الكمية" on the card instead). However the extracted product-page text contains BOTH "نفدت الكمية" and "أضف إلى السلة" / "اشترِ الآن" on every one of the nine pages, which looks like a hidden template label captured by the scraper. Best reading: listed as available; not verified by a rendered view. Do not publish "sold out" or "available" as fact without a visual check.
- Installments shown: Tabby-style line ("بدءًا من X شهريًا حتى 12 شهر، بدون رسوم تأخير، متوافق مع الشريعة الإسلامية") and Tamara widget ("ابتداءً من X SAR /شهر على ما يصل إلى 12 دفعة شهرية").
- Dhahran (الظهران): NOT mentioned on any of them.

| # | Title (exact) | URL | Price (SAR) | Original | Duration | Description / benefits | Location wording (exact) | Other |
|---|---|---|---|---|---|---|---|---|
| 1 | Three months - GYM | https://reshape-sa.com/three-months-gym/p1522254403 | 2,700 | — | 3 months (from title) | No description text on page | none | "تم شراؤه 58 مرة"; categories: الحصص الجماعية بالنادي, حصص تدريب الكبار |
| 2 | Six months - GYM | https://reshape-sa.com/six-months-gym/p1882410865 | 4,960 | 5,040 | 6 months (from title) | No description text | none | card label "خصم ماقد صار ولن يتكرر!"; "تم شراؤه 31 مرة" |
| 3 | one year - GYM | https://reshape-sa.com/one-year-gym/p1018656171 | 8,840 | 9,100 | 1 year (from title) | No description text | none in product copy. A customer review (dated on page "6/11/2026 - 22:35", "مشتري موثَّق") says "من افضل واقوى واحسن النوادي بالمملكة (المنطقة الشرقية)…" | card label "خصم ماقد صار ولن يتكرر!"; "تم شراؤه 21 مرة"; 5 stars, "تقييم واحد" |
| 4 | KIDs- one month | https://reshape-sa.com/kids-one-month/p1148810604 | 749 | — | 1 month (from title) | Coach bio + notes (see below). No session count, age range or schedule stated | "الموقع : الدمام ) حي اسكان الدمام" | card label "عرض ماقبل الافتتاح.." |
| 5 | KIDs- 3 months | https://reshape-sa.com/kids-3-months/p1952352210 | 2,250 | — | 3 months | same text as #4 | "الموقع : الدمام ) حي اسكان الدمام" | "عرض ماقبل الافتتاح.."; "تم شراؤه 9 مرات" |
| 6 | KIDs- 6 months | https://reshape-sa.com/kids-6-months/p1946581655 | 3,820 | — | 6 months | same text as #4 | "الموقع : الدمام ) حي اسكان الدمام" | "عرض ماقبل الافتتاح.."; "تم شراؤه 7 مرات" |
| 7 | KIDs- One year | https://reshape-sa.com/kids-one-year/p1354110888 | 6,900 | — | 1 year | same text as #4 | "الموقع : الدمام ) حي اسكان الدمام" | "عرض ماقبل الافتتاح.."; "تم شراؤه 4 مرات" |
| 8 | PT 30+8 free | https://reshape-sa.com/pt-30-8-free/p35437930 | 9,900 | — | not stated | Entire description: "٣٠+٨ مجانيه" (30 + 8 free; page does not say "sessions" explicitly) | none | categories: تدريبات الكابتن نواف الخاصة, التدريب الشخصي الحضوري 1:1; "تم شراؤه 6 مرات" |
| 9 | PT TEST | https://reshape-sa.com/pt-test/p2083324497 | 300 | — | not stated | Entire description: "the student required to pay before the session" | none | category: المزايا الخاصة للاشتراك |
| 10 | SUBSCRIPTION PAUSE 1 WEEK | https://reshape-sa.com/subscription-pause-1-week/p1409694364 | 68 | 100 | 1 week (from title) | PRODUCT PAGE NOT SCRAPED — details unknown | unknown | listing card only; "أضف إلى السلة" on card |
| 11 | Travel program (EXTRA) | https://reshape-sa.com/travel-program-extra/p1145519985 | 90 | — | unknown | PRODUCT PAGE NOT SCRAPED — details unknown | unknown | listing card only; "أضف إلى السلة" on card |

KIDs description (identical on all four pages), paraphrased: headed "من هو المدرب نواف الصقر؟"; says Nawaf won the Gulf calisthenics champion title in 2021 and best talent in the Kingdom in 2019 "من بين 11 الف موهبة", with 6+ years of competitive calisthenics experience; a coach's message about the four calisthenics divisions ("dynamic - static - sets & reps - street lifting"), first places in tournaments in Qatar, UAE and Kuwait, and the aim of building a calisthenics community "فالمنطقة الشرقية". These are the store's own claims, not independently verified.

Exact notes on the KIDs pages:
> ملاحظة :
> 1- العروض لفتره محدودة وستزال قريبا.
> 2- المقاعد محدودة لضمان الجودة التدريبية.
> 3-في حال امتلاء المقاعد سيتواصل معك المنسق بشكل تلقائي لحجز مقعدك للأشهر القادمة او الدخول في قائمة الانتظار للشهر الحالي.

### A4. Other products (listing data only — product pages not scraped)

Remote / online coaching (listing cards, ~07:29 UTC):

| Title | URL | Price | Original | Card status |
|---|---|---|---|---|
| One month online كابتن نواف | https://reshape-sa.com/one-month-online-كابتن-نواف/p1552265992 | 850 | — | أضف إلى السلة |
| Three months online كابتن نواف | https://reshape-sa.com/three-months-online-كابتن-نواف/p688417153 | 2100 | — | أضف إلى السلة; label "سعر افضل وتطور اكبر" |
| التدريب عن بعد - شهر - كابتن محمد الصقر | https://reshape-sa.com/التدريب-عن-بعد-شهر-كابتن-محمد-الصقر/p1981604608 | 500 | — | أضف إلى السلة |
| التدريب عن بعد - 3 شهور - كابتن محمد الصقر | https://reshape-sa.com/التدريب-عن-بعد-3-شهور-كابتن-محمد-الصقر/p735344180 | 1250 | 1500 | أضف إلى السلة |
| التدريب عن بعد - 6 شهور - كابتن محمد الصقر | https://reshape-sa.com/التدريب-عن-بعد-6-شهور-كابتن-محمد-الصقر/p763466139 | 2400 | 3000 | أضف إلى السلة |
| برنامج التدريب الاحترافي - شهر - كابتن محمد | https://reshape-sa.com/برنامج-التدريب-الاحترافي-شهر-كابتن-محمد/p920850974 | 700 | — | نفدت الكمية |
| برنامج التدريب الاحترافي - 3 شهور - كابتن محمد | https://reshape-sa.com/برنامج-التدريب-الاحترافي-3-شهور-كابتن-محمد/p198122906 | 1800 | 2100 | نفدت الكمية |
| برنامج التدريب الاحترافي - 6 شهور - كابتن محمد | https://reshape-sa.com/برنامج-التدريب-الاحترافي-6-شهور-كابتن-محمد/p1892019658 | 3000 | 4200 | نفدت الكمية |

Merchandise:

| Title | URL | Price | Card status |
|---|---|---|---|
| Athletic fit Gray T-shirt RESHAPE V.1 | https://reshape-sa.com/athletic-fit-gray-t-shirt-reshape-v1/p1572192390 | 115 | أضف إلى السلة |
| Athletic fit dark blue T-shirt RESHAPE V.1 | https://reshape-sa.com/athletic-fit-dark-blue-t-shirt-reshape-v1/p1503015929 | 115 | نفدت الكمية; label "خصم حصري لاعضاء النادي" |

### A5. Dhahran statement

**No product, category page, home page or footer text that I retrieved mentions الظهران (Dhahran) or الخبر (Khobar).** The only location wording found anywhere:
- "الموقع : الدمام ) حي اسكان الدمام" — on the four KIDs product pages only.
- "المنطقة الشرقية" — in the KIDs coach text and in one customer review on the one-year GYM page.
- "اختر المدينة أو استخدم موقعك للعثور على أقرب فرع." — appears at the bottom of every store page; it reads as a generic Salla branch-picker widget string, with no branch list in the extracted content ("لا توجد نتائج" precedes it).

The GYM and PT product pages state no location at all. Not scraped, so unknown: the two add-on pages (#10, #11), the online-coaching pages, the T-shirt pages. I draw no conclusion about whether any product is valid for a Dhahran club.

### A6. Store identity, contact, footer (home page scrape, ~07:28 UTC)

- Store name as shown: **RESHAPE** (page title "RESHAPE"; logo alt "RESHAPE logo").
- Tagline (footer + meta description): "Creating the champions chamber."
- Logo / favicon / og:image (same file): https://cdn.files.salla.network/other/841647136/df0a26fb-78e5-4a29-9390-2dcca39e247f-original.webp
- Home banner image: https://cdn.files.salla.network/other/841647136/1a0c587a-daa2-4669-ad75-56b9168d219a-original.webp
- Contact ("تواصل معنا"): WhatsApp **+966575954545** → https://wa.me/966575954545
- Social: Instagram https://www.instagram.com/reshape.sa ; YouTube https://www.youtube.com/@reshape-sa
- NOT found: email, landline, X/Twitter, TikTok, Snapchat, street address, map, opening hours.
- Commercial registration: "السجل التجاري **2050201542**". No VAT/tax number shown.
- Footer has a "روابط مهمة" heading with no links in the extracted content.
- Footer platform credit: "صنع بإتقان على | 2026 منصة سلة" → https://salla.com/?utm_source=store&utm_medium=footer&utm_campaign=reshape . The store footer credits Salla; it does NOT link to hija-tech-sa.com.
- Payment icons: mada, credit_card, bank, stc_pay, apple_pay, tabby_installment, tamara_installment, COD.
- Metadata: language "ar", og:locale "ar_AR", `store:published_time` 2024-12-17T11:38:06+03:00. Product pages carry `robots: noindex`.

Visual identity — machine-extracted by Firecrawl's "branding" format (reported confidence ~0.90; not eyeballed, and partly Salla theme defaults):
- primary `#EC562E`, accent/link `#FF443A`, background `#F9FAFB`, text `#374151`, secondary `#6B7280`.
- Meta `apple-mobile-web-app-status-bar-style` / `msapplication-navbutton-color`: `#ff6a00` (orange) — this one is read directly from the page head.
- Primary button: background `#000000`, radius 0px; secondary button pill (9999px); base radius 12px; font reported only as "Branded Font" (actual family unknown).
- Logo colours themselves: not inspected (image not opened).

---

## B. https://hija-tech-sa.com/ (Firecrawl scrape, ~07:28 UTC)

- Loads: yes — HTTP 200, redirects to https://hija-tech-sa.com/ar.
- Name: "حِجَا | HIJA" (title "حِجَا — حلول رقمية بذكاء وإتقان"; strapline "حِجَا · حوسبة، جودة، إتقان").
- One-line description (its own meta description): "حِجَا علامة تقنية سعودية لتطوير المواقع والمنصات والأنظمة الرقمية والتجارب التفاعلية." — a Saudi tech brand building websites, platforms, internal systems, interactive presentations, content/marketing and hosting.
- Contact shown: WhatsApp 0510551751 → https://wa.me/966510551751. Commercial registration shown: 7055550912.
- Lists RESHAPE under "شركاء النجاح" (logo https://hija-tech-sa.com/partners/reshape.webp).
- Oddity: og:url / og:image point to `sanad-tech-sa.com`, not hija-tech-sa.com.

---

## C. Brand-use checks

### C1. CrossFit — https://www.crossfit.com/faq/affiliates (Firecrawl scrape, cached copy dated 2026-11-19T23:14Z, read ~07:28 UTC)

Exact quotes:
> "You **cannot** use the CrossFit name in any other business or promotional way unless you affiliate. **Only** affiliation gives you the legal right to use the CrossFit name for business and/or promotional purposes."

> "You can call yourself a CrossFit trainer. You may list your CrossFit qualifications on a business card, resume, or website bio/qualifications type of page. Nothing more." (answer to: "If I do not want to affiliate but I am a CrossFit trainer, how can I use the name legally?")

> "By affiliating, you are licensing the CrossFit name and making it legal to use that name."

> "Logos and/or slogans associated with CrossFit, LLC or CrossFit.com may not be used without prior permission."

Affiliation includes "Legal use of the CrossFit name, logo, and promotional materials" and "Legal use of the CrossFit Kids name". Fees stated: US$1,000 application, US$4,500 annual.

### C2. HYROX — https://www.hyrox365.com/meta-pages/terms-and-conditions (found via one Firecrawl search; scraped with Firecrawl "query" format in direct-quote mode, ~07:32 UTC)

Page title "Terms and Conditions | HYROX365" — "HYROX TRAINING CLUB | HYROX PERFORMANCE COACH AFFILIATION". The page holds several regional versions (HYROX World GmbH, Hamburg; HYROX North America, Inc.; a Sportsfitality B.V. version dated "4 April 2025" with an annex "effective as of April 14th, 2025"; a Spanish-language version). I did not determine which version governs Saudi Arabia. Quotes were pulled by an extraction step, so verify wording on the page before legal reliance.

> "1.2 The HYROX365 affiliation (\"Affiliation\") is offered in the form of a standardized programme as \"HYROX Training Club\" to gym organisations and as \"HYROX Performance Coach\" to gym coaches…"

> "Title Right: the right to use and display the title \"HYROX Training Club\" (\"Title\") for the purpose of identifying the Partners' gym as official HYROX Training Club (\"HTC\") within the Territory, either on-site within the respective Partner's gym facilities, within the bio of said Partner's digital business presence (e.g., website, social media channels) and/or as reference within its analogue or digital business communication (e.g., newsletter, posts)."

> "6.2 The Partner will not at any time use the mark \"HYROX\" on its own and shall only use the Title and the HTC Marks & Logos as permitted under this Agreement." (this clause is from the search excerpt of the same URL)

> "6.5 The Partner will not use the Title or any of the HTC Marks & Logos as a business name or formal or registered name of a company, partnership or any other legal entity."

> "6.7 The Partner shall not combine the Title or the HTC Marks & Logos with any other brand or fitness methodology or training (for example, HYROX yoga or HYROX Spin)."

Partner-run events "must be clearly named and marketed as testing, training, or HYROX Training Club simulation events independently organised and hosted by the respective Partner's gym and not as official HYROX events".

Reading: the title and marks are granted to affiliated partners under the agreement; the page does not grant any right to non-affiliated gyms. Secondary (non-official) source from the same search, Wodify blog https://www.wodify.com/blog/how-to-open-hyrox-gym : "Only official affiliates can use the HYROX name in marketing and advertising".

---

## D. Creative references (Firecrawl scrape, markdown only, ~07:32 UTC)

Limitation for all five: I saw extracted text and link structure only — not layout, typography, colour, motion or imagery. Principles below are structural/wording observations.

1. **https://www.on.com/** (served /en-us/, cached 2026-11-21T05:42Z)
   - Three top-level menus only — Shop / Sports / Explore — and the same catalogue is reachable by audience (Women, Men, Kids), by activity (Running, Trail running, Tennis, Training and gym) and by need ("Best for": travel, wet weather). A "Shoe Finder" guided chooser sits beside the lists.
   - CTAs are short verb + object: "Shop women's", "See the collection", "Discover our athletes", "Become a member". Hero is one line plus a one-sentence support line ("However you holiday, move.").
   - Do not copy: product names (Cloud…, CloudTec, LightSpray), the mission line "Ignite the human spirit through movement" / "Dream On", athlete and collaboration imagery, or the e-commerce mega-menu depth (far too large for a single club).

2. **https://www.technogym.com/** (served /en-US/, cached 2026-11-21T01:30Z)
   - Five consumer nav items (Shop, Wellness, Design, Stories, Community) with "For business" split off as a separate entry; the shop is grouped four ways — Equipment, Accessories, Training type (Cardio, Strength, Functional, Flexibility, Pilates), Product lines.
   - Paired CTAs at decision points ("Shop online" / "Find a store"; "Sign up now" / "Discover Memberships"); a proof strip of counted awards ("50+ design awards since 2004"); "Contact us" repeated in every menu panel.
   - Do not copy: line names (Artis, Skill, Biostrength, Excite+), the slogan "Let's move for a better world", the partner-logo wall (Ferrari, Juventus etc. — RESHAPE must not imply partnerships it lacks), or award claims.

3. **Architecture studio — https://big.dk/** (BIG | Bjarke Ingels Group, HTTP 200). Output was ~100k characters; I read the navigation, the first ~40 project entries and the footer of a link-stripped version, not the middle of the project list.
   - Six plain nav words (Projects, News, About, Sustainability, People, Careers) and a filterable index: discipline (Architecture, Interiors, Landscape, Planning, Products) then type (Culture, Education, Sports, Health…). Every project is just a name plus "City, Country".
   - Contact is routed by intent, each with its own address (NEW PROJECTS, PRESS, LECTURES, EXHIBITIONS), followed by per-office blocks with address, phone and email.
   - Do not copy: the project-grid-as-homepage with almost no explanatory copy (works for a known studio, not for a new club that must explain its offer), project names/imagery, or the "Command Menu" pattern.

4. **Interactive museum — https://www.exploratorium.edu/** (cached 2026-11-21T05:47Z)
   - Visit-first structure: nav starts with "Visit"; live status ("Currently closed", "See all hours →") is in the header; two persistent buttons ("Buy Tickets", "Donate"); location and hours repeated in the footer. Audiences get their own doors (School Field Trips, Group Visits, After Dark 18+, Storytime for kids).
   - Events are dated cards ("Next: Sat, Nov 21 2026 • 11am - 4pm"); membership is sold with three bullets ("Get unlimited admission…") and one button ("Join Today"). Hero: "Take your imagination out to play." + "Plan Your Visit".
   - Do not copy: exhibit/programme names (Tactile Dome, After Dark, Glow), the "Rated #1 museum…" claim pattern unless true and sourced, or the donation-heavy modules.

5. **Arabic-first Saudi experience — https://www.diriyah.sa/ar** (HTTP 200, fresh fetch)
   - Arabic is a full RTL site with a single "English" switch; only three nav items (الأنشطة السياحية, أماكن للزيارة, خطط لزيارتك) plus one persistent booking button "احجز الآن" that hands off to a separate ticketing domain — the same pattern as a marketing site handing off to a Salla store.
   - Short, literary Arabic headlines with imperative CTAs: "حيثُ يُروى التراث" → "اكتشف الآن" / "خطط لزيارتك" / "ابدأ رحلتك"; a small trip-planner form (date, adults, children → "خطط لرحلتي"); pass benefits as a three-bullet list.
   - Do not copy: the heritage voice and phrases ("الدرعية تُعاش", "من هالأرض"), Najdi visual motifs, or the scroll-story sequence of auto-playing videos (heavy; the markdown shows many video blocks).

---

## Failures and gaps

- No scrape returned an error or empty page.
- Not scraped (budget): product pages for SUBSCRIPTION PAUSE 1 WEEK, Travel program (EXTRA), all online-coaching products and both T-shirts; sub-category pages c886831064, c577393883, c1702006498. Their details beyond the listing card are unknown.
- Availability on the nine scraped product pages is ambiguous (see A3).
- Tax treatment, branch list, club address, opening hours, class schedule, age ranges and session counts: not published in anything I retrieved.
- big.dk read only in part (start and end).
- HYROX quotes came through an extraction step and from a multi-version page; the governing version for Saudi Arabia is unknown.
