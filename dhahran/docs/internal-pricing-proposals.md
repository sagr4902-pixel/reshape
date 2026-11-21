# Internal pricing proposals

**No price figures are stored in this repository.** The repository is public, and indicative numbers could be read as
offers. The worksheet with the brief's illustrative ranges is kept outside version control at
`internal/pricing-worksheet.md` (git-ignored) and was handed to the owner directly.

What the site does instead:

- Dhahran plans have `price: undefined`; the page says "prices will be announced later" and offers an inquiry.
- A unit test fails the build if the worksheet's illustrative figures appear anywhere in shipped source or messages.
- If the owner approves an *indicative* price, add it to the plan with `status: "owner-confirmed"`,
  `publishApproved: true`, and an explicit "سعر استرشادي — غير نهائي / indicative — not final" label in the UI. That
  label does not exist yet and must be added with the price; the action stays an inquiry, never a checkout.

Method for an evidence-based proposal (no tax treatment is assumed):

1. Cost per cohort: coach cost per session × sessions per month, plus the cohort's share of rent, utilities,
   equipment depreciation and administration.
2. Expected paying members per cohort at a realistic utilisation for months 1–6.
3. Price = cost per member ÷ (1 − target margin), sanity-checked against the existing branch's public prices
   (see `docs/catalog-verification.md`).
