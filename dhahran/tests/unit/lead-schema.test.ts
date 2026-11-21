import { describe, expect, it } from 'vitest';
import { leadSchema } from '@/features/leads/schema';
import { csvCell, groupKey, payloadHash } from '@/lib/server/leads';
import { sanitizeProps } from '@/lib/analytics';

const allow = { programIds: ['calisthenics', 'kids'], zoneIds: ['rig'] };
const valid = {
  name: '  سارة   أحمد ',
  phone: '٠٥١٢٣٤٥٦٧٨',
  programId: 'kids',
  intent: 'program-inquiry',
  locale: 'ar',
  noticeVersion: 'draft',
  privacyAcknowledged: true,
  idempotencyKey: '7b0e5c0e-4a2f-4d43-9b1a-0f6f1b2c3d4e',
};
const parse = (over: Record<string, unknown> = {}) => leadSchema(allow).safeParse({ ...valid, ...over });

describe('lead schema (server authority)', () => {
  it('normalises name and phone; marketing consent defaults to false', () => {
    const r = parse();
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ name: 'سارة أحمد', phone: '+966512345678', marketingConsent: false });
  });
  it('accepts "help me choose"', () => expect(parse({ programId: 'help-me-choose' }).success).toBe(true));
  it('rejects unknown program and intent', () => {
    expect(parse({ programId: 'pilates' }).error?.issues[0].message).toBe('program');
    expect(parse({ intent: 'buy-now' }).error?.issues[0].message).toBe('intent');
  });
  it('drops unknown zone/source context instead of storing arbitrary strings', () => {
    const r = parse({ zoneId: '../../etc/passwd', source: 'https://evil.example/?utm=1' });
    expect(r.success).toBe(true);
    expect(r.data?.zoneId).toBeUndefined();
    expect(r.data?.source).toBeUndefined();
    expect(parse({ zoneId: 'rig', source: 'explorer' }).data).toMatchObject({ zoneId: 'rig', source: 'explorer' });
  });
  it('requires the privacy acknowledgement and never infers marketing consent', () => {
    expect(parse({ privacyAcknowledged: false }).error?.issues[0].message).toBe('privacy');
    expect(parse({ marketingConsent: true }).data?.marketingConsent).toBe(true);
  });
  it('rejects unexpected fields (no child data, email or IDs can be smuggled in)', () => {
    expect(parse({ childName: 'x' }).success).toBe(false);
    expect(parse({ email: 'a@b.c' }).success).toBe(false);
    expect(parse({ nationalId: '1' }).success).toBe(false);
  });
  it('rejects invalid names, numbers and oversized comments', () => {
    expect(parse({ name: 'A' }).success).toBe(false);
    expect(parse({ name: '<script>alert(1)</script>' }).success).toBe(false);
    expect(parse({ name: 'http://spam.example' }).success).toBe(false);
    expect(parse({ phone: '0412345678' }).error?.issues[0].message).toBe('phone');
    expect(parse({ comment: 'x'.repeat(501) }).error?.issues[0].message).toBe('comment');
    expect(parse({ idempotencyKey: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('hashing', () => {
  it('payload hash is stable for the same attempt and changes with any field', () => {
    const a = parse().data!;
    expect(payloadHash(a)).toBe(payloadHash(parse().data!));
    expect(payloadHash(a)).not.toBe(payloadHash(parse({ marketingConsent: true }).data!));
    expect(payloadHash(a)).not.toBe(payloadHash(parse({ programId: 'calisthenics' }).data!));
  });
  it('group key is keyed: different secrets give different keys', () => {
    expect(groupKey('s1', '+966512345678', 'kids')).not.toBe(groupKey('s2', '+966512345678', 'kids'));
    expect(groupKey('s1', '+966512345678', 'kids')).not.toContain('512345678');
  });
});

describe('CSV export safety', () => {
  it.each(['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)', '\tcmd', '\r=1'])('neutralises formula %j', (v) => {
    expect(csvCell(v).startsWith(`"'`)).toBe(true);
  });
  it('escapes quotes and keeps ordinary text', () => {
    expect(csvCell('a "b" c')).toBe('"a ""b"" c"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell('سارة')).toBe('"سارة"');
  });
});

describe('analytics payload hygiene', () => {
  it('keeps only allow-listed identifier-like properties', () => {
    expect(
      sanitizeProps({ locale: 'ar', programId: 'kids', zoneId: 'rig', name: 'Sara', phone: '+966512345678', comment: 'hi', url: 'https://x/?a=1', intent: 'has spaces and more', ctaLocation: 'home' }),
    ).toEqual({ locale: 'ar', programId: 'kids', zoneId: 'rig', ctaLocation: 'home' });
  });
});
