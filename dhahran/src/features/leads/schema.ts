import { z } from 'zod';
import { INTENTS, SOURCES } from '@/lib/catalog/types';
import { normalizeSaudiMobile } from '@/lib/phone-strict';
import { COMMENT_MAX, HELP_ME_CHOOSE, NAME_MAX, NAME_RE } from './constants';

/**
 * One definition of a lead submission, shared by the form (assistance) and
 * the API (authority). IDs are validated against allow-lists passed in by the
 * caller so this module stays free of content imports on the client.
 */
export { COMMENT_MAX, HELP_ME_CHOOSE, NAME_MAX };

export interface Allowlists {
  programIds: readonly string[];
  zoneIds: readonly string[];
}

export function leadSchema(allow: Allowlists) {
  return z
    .object({
      name: z
        .string()
        .transform((s) => s.normalize('NFC').replace(/\s+/g, ' ').trim())
        .pipe(z.string().min(2, 'name').max(NAME_MAX, 'name').regex(NAME_RE, 'name')),
      phone: z
        .string()
        .max(32, 'phone')
        .transform((s, ctx) => {
          const n = normalizeSaudiMobile(s);
          if (!n) {
            ctx.addIssue({ code: 'custom', message: 'phone' });
            return z.NEVER;
          }
          return n;
        }),
      programId: z.string().refine((v) => v === HELP_ME_CHOOSE || allow.programIds.includes(v), 'program'),
      intent: z.enum(INTENTS, 'intent'),
      comment: z
        .string()
        .max(COMMENT_MAX, 'comment')
        .transform((s) => s.normalize('NFC').trim())
        .optional()
        .transform((s) => (s ? s : undefined)),
      locale: z.enum(['ar', 'en']),
      zoneId: z
        .string()
        .optional()
        .transform((v) => (v && allow.zoneIds.includes(v) ? v : undefined)), // unknown context is dropped, not stored
      source: z
        .string()
        .optional()
        .transform((v) => (v && (SOURCES as readonly string[]).includes(v) ? v : undefined)),
      noticeVersion: z.string().min(1).max(40),
      privacyAcknowledged: z.literal(true, 'privacy'),
      marketingConsent: z.boolean().default(false),
      idempotencyKey: z.uuid(),
      // Honeypot: real visitors never fill this. Checked by the route, not the schema.
      website: z.string().max(200).optional(),
    })
    .strict();
}

export type LeadInput = z.infer<ReturnType<typeof leadSchema>>;
export type LeadFieldError = 'name' | 'phone' | 'program' | 'intent' | 'comment' | 'privacy';
