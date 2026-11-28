import { z } from 'zod';

/** Content contracts. Runtime-validated by `npm run content:validate` and unit tests. */

export const localeSchema = z.enum(['ar', 'en']);
export type Locale = z.infer<typeof localeSchema>;
const text = z.string().trim().min(1);
export const localized = z.object({ ar: text, en: text });
export type Localized = z.infer<typeof localized>;
export const localizedList = z.object({ ar: z.array(text).min(1), en: z.array(text).min(1) });

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const verification = z.enum(['verified', 'owner-confirmed', 'provisional', 'unknown']);
export const availability = z.enum(['confirmed', 'planned', 'unconfirmed', 'paused']);

export const evidence = z.object({
  status: verification,
  sourceUrl: z.url().optional(),
  verifiedAt: z.iso.datetime().optional(),
  note: z.string().optional(), // internal — never copied into public DTOs
});
export type Evidence = z.infer<typeof evidence>;

export const faq = z.object({ q: localized, a: localized });

export const programSchema = z.object({
  id,
  slug: id,
  /** Where the primary page lives (kids and football have top-level routes). */
  route: z.string().startsWith('/'),
  /** Internal requested-offering tags (e.g. crossfit, hyrox). Never rendered publicly. */
  internalTags: z.array(id).default([]),
  title: localized,
  shortTitle: localized,
  summary: localized,
  positioning: localized,
  audienceNote: localized,
  themes: localizedList,
  benefits: localizedList,
  boundaries: localizedList.optional(),
  availability,
  audiences: z.array(z.enum(['adult', 'guardian', 'football-athlete'])).min(1),
  pathwayIds: z.array(id),
  membershipIds: z.array(id),
  faqs: z.array(faq),
  /** Default inquiry intent for this program's CTA. */
  ctaIntent: z.enum(['general-interest', 'program-inquiry', 'trial-request', 'membership-consultation', 'preopening-updates']),
  /** Design image id (src/content/design.ts). */
  imageId: id,
  evidence,
});
export type Program = z.infer<typeof programSchema>;

export const pathwaySchema = z.object({
  id,
  programId: id,
  title: localized,
  summary: localized,
  status: verification,
});
export type Pathway = z.infer<typeof pathwaySchema>;

export const priceSchema = z.object({
  amountMinor: z.number().int().nonnegative(), // halalas
  currency: z.literal('SAR'),
  taxDisplay: z.enum(['included', 'excluded', 'unknown']),
  status: verification,
  sourceUrl: z.url().optional(),
  verifiedAt: z.iso.datetime().optional(),
  publishApproved: z.boolean(),
  /** Previous price shown struck through — only if the store shows it. */
  previousAmountMinor: z.number().int().positive().optional(),
});
export type Price = z.infer<typeof priceSchema>;

export const membershipSchema = z.object({
  id,
  title: localized,
  storeTitle: z.string().optional(), // exact public title on the official store
  group: z.enum(['adult', 'kids', 'extra']).optional(),
  programIds: z.array(id),
  branchScope: z.enum(['dhahran', 'dammam', 'all-confirmed', 'unknown']),
  branchEvidence: evidence,
  availability: z.enum(['available', 'unavailable', 'unknown']),
  duration: z.object({ value: z.number().int().positive(), unit: z.enum(['day', 'month', 'session']) }).optional(),
  price: priceSchema.optional(),
  variantId: z.string().optional(),
  productUrl: z.url().optional(),
  linkVerifiedAt: z.iso.datetime().optional(),
  linkVerified: z.boolean(),
  /** How long owner-confirmed evidence counts as current (default: 7 days). */
  reviewDays: z.number().int().positive().max(90).optional(),
});
export type Membership = z.infer<typeof membershipSchema>;

export const INTENTS = ['general-interest', 'program-inquiry', 'trial-request', 'membership-consultation', 'preopening-updates'] as const;
export type Intent = (typeof INTENTS)[number];
export const SOURCES = ['home', 'explorer', 'program', 'kids', 'football', 'memberships', 'contact', 'header', 'footer'] as const;
export type Source = (typeof SOURCES)[number];
