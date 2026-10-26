# Public sign-up page redesign

Scope: the public `join` view in `index.html` (اشترك معنا). The athlete app, coach panel, registration wizard, referral page, authentication and Supabase logic are unchanged.

Rollback point: commit `9eef4a4` on this branch (`git checkout 9eef4a4 -- index.html`).

## Files here

- `compare-fold-{1440,768,390}.jpg`: first screen, before and after, taken after the opening animation finished.
- `compare-full-{1440,768,390}.jpg`: whole page, before and after.
- `after-fold-*.jpg`, `after-full-*.jpg`: final screenshots at each width.

## What changed in the code

- `viewJoin()` is rewritten; it keeps every `data-tab`, `data-promo`, `data-copy`, `data-join-again`, `#stickycta` and `#joinform` hook, so the existing click handlers drive it.
- A scoped stylesheet (`.lp`, `body.lp-on`) is appended to the main `<style>`; it is active only while the join view is on screen.
- `render()` gains two lines (`LP_ON=false`, `lpInit()`), and `stickyCTA()` ends the bar at the pricing section and, on the landing page only, shows it when scrolling up.

## Content notes

- Everything shown is from the previous page: coach biography and credentials, Abdulhadi's example and numbers, plans, bank details, payment options.
- The hero screens are built in HTML from that real session (muscle-up singles, 6 sets, 2:30 rest, RPE 6.5). Two details are mock-up text: "exercise 2 of 7" and the "0:42" clip length in the video fragment. Confirm or change them.
- The three one-line plan descriptions are new copy and need the owner's approval: "مناسبة لتجربة البرنامج والمتابعة مع الكابتن" (1 month), "مرحلة كاملة من البرنامج بسعر أقل للشهر" (3 months), "الأفضل قيمة: ستة أشهر تكفي لبناء مهارة وقياس تقدّمها" (6 months).
- There are no photographs of the coach or athletes. Real photos or a short training clip would be the biggest remaining improvement.
