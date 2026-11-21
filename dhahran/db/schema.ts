import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * Lead storage. Minimal by design: adult contact only — no child data,
 * no medical data, no email, no IP address, no user agent.
 */
export const leadSubmissions = pgTable(
  'lead_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    adultName: text('adult_name').notNull(),
    mobileE164: text('mobile_e164').notNull(),
    programId: text('program_id').notNull(), // program id or "help-me-choose"
    intent: text('intent').notNull(),
    comment: text('comment'),
    locale: text('locale').notNull(),
    zoneId: text('zone_id'),
    source: text('source'),
    noticeVersion: text('notice_version').notNull(),
    status: text('status').notNull().default('new'),
    statusUpdatedAt: timestamp('status_updated_at', { withTimezone: true }),
    // Retry safety: one row per idempotency key, bound to the payload hash.
    idempotencyKey: uuid('idempotency_key').notNull().unique(),
    payloadHash: text('payload_hash').notNull(),
    // Keyed hash of mobile+program for staff-side duplicate review (never shown to visitors).
    groupKey: text('group_key').notNull(),
    isRepeat: boolean('is_repeat').notNull().default(false),
  },
  (t) => [
    index('lead_created_idx').on(t.createdAt),
    index('lead_group_idx').on(t.groupKey),
    check('lead_locale_chk', sql`${t.locale} in ('ar','en')`),
    check('lead_status_chk', sql`${t.status} in ('new','contacted','qualified','closed','spam')`),
    check(
      'lead_intent_chk',
      sql`${t.intent} in ('general-interest','program-inquiry','trial-request','membership-consultation','preopening-updates')`,
    ),
    check('lead_mobile_chk', sql`${t.mobileE164} ~ '^\\+9665[0-9]{8}$'`),
    check('lead_name_len_chk', sql`char_length(${t.adultName}) between 2 and 80`),
    check('lead_comment_len_chk', sql`${t.comment} is null or char_length(${t.comment}) <= 500`),
  ],
);

/** Evidence of each choice, stored atomically with the submission. */
export const consentEvents = pgTable(
  'consent_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => leadSubmissions.id, { onDelete: 'cascade' }),
    purpose: text('purpose').notNull(),
    choice: text('choice').notNull(),
    noticeVersion: text('notice_version').notNull(),
    collectedAt: timestamp('collected_at', { withTimezone: true }).notNull().defaultNow(),
    method: text('method').notNull().default('web_form'),
  },
  (t) => [
    index('consent_submission_idx').on(t.submissionId),
    check('consent_purpose_chk', sql`${t.purpose} in ('inquiry_processing','marketing')`),
    check('consent_choice_chk', sql`${t.choice} in ('acknowledged','granted','declined')`),
    // one row per purpose per submission — retries cannot duplicate purposes
    uniqueIndex('consent_unique_idx').on(t.submissionId, t.purpose),
  ],
);

/** Shared fixed-window rate limiting that works across instances. Buckets are keyed hashes. */
export const rateLimits = pgTable(
  'rate_limits',
  {
    bucket: text('bucket').primaryKey(),
    count: integer('count').notNull().default(1),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('rate_expires_idx').on(t.expiresAt)],
);
