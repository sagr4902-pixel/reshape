/**
 * Content validation: schemas, cross-references, locale parity, assets,
 * publication rules and verification freshness. Fails the build on errors.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { memberships } from '../src/content/memberships';
import { pathways } from '../src/content/pathways';
import { programs } from '../src/content/programs';
import { offer, offerState } from '../src/content/offer';
import { designImages } from '../src/content/design';
import { site } from '../src/content/site';
import { overdueVerifications, resolveMembershipAction } from '../src/lib/catalog/resolve';
import { isOfficialStoreUrl } from '../src/lib/catalog/store-links';
import { membershipSchema, pathwaySchema, programSchema } from '../src/lib/catalog/types';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);

export function validateAll(now = new Date()) {
  for (const [name, schema, items] of [
    ['program', programSchema, programs],
    ['pathway', pathwaySchema, pathways],
    ['membership', membershipSchema, memberships],
  ] as const) {
    const ids = new Set<string>();
    for (const item of items) {
      const r = (schema as z.ZodType).safeParse(item);
      if (!r.success) err(`${name} ${item.id}: ${z.prettifyError(r.error)}`);
      if (ids.has(item.id)) err(`${name} ${item.id}: duplicate id`);
      ids.add(item.id);
    }
  }

  const programIds = new Set(programs.map((p) => p.id));
  const pathwayIds = new Set(pathways.map((p) => p.id));
  const membershipIds = new Set(memberships.map((m) => m.id));

  for (const p of programs) {
    for (const w of p.pathwayIds) if (!pathwayIds.has(w)) err(`program ${p.id}: unknown pathway ${w}`);
    for (const m of p.membershipIds) if (!membershipIds.has(m)) err(`program ${p.id}: unknown membership ${m}`);
    if (!designImages[p.imageId]) err(`program ${p.id}: unknown design image ${p.imageId}`);
    if (p.themes.ar.length !== p.themes.en.length) err(`program ${p.id}: themes differ in length between locales`);
    if (p.benefits.ar.length !== p.benefits.en.length) err(`program ${p.id}: benefits differ in length between locales`);
    // HYROX and CrossFit are named publicly on the owner's instruction (23 Nov 2026). The right to use those
    // names commercially is the owner's to hold; the copy states no affiliation.
  }
  for (const w of pathways) if (!programIds.has(w.programId)) err(`pathway ${w.id}: unknown program ${w.programId}`);

  // Owner's rule: the interior design and layout are not shown. Only the facade and teaser crops may be published.
  for (const id of Object.keys(designImages)) if (id !== 'facade' && !id.startsWith('t-')) err(`design image ${id}: only the facade and teaser crops (t-*) may be published`);
  for (const dir of ['public/assets/scenes', 'src/app/[locale]/explore']) if (existsSync(join(root, dir))) err(`${dir}: the club tour and map must not be shipped`);

  // Offer: a live offer needs a real price, a future-parsable end date and an official-store payment link.
  if (offer.status === 'live') {
    if (offer.priceSar !== null && !(offer.priceSar > 0)) err('offer: invalid price');
    if (!offer.endsAt || Number.isNaN(Date.parse(offer.endsAt))) err('offer: live without a valid end date');
    if (!offer.payUrl || !isOfficialStoreUrl(offer.payUrl)) err('offer: live without an official-store payment link');
    if (offerState(offer, 'production', now).kind !== 'live') warnings.push('offer: marked live but already ended');
  }

  // Design renders: every catalogued image has both alt texts and all encoded files on disk.
  for (const img of Object.values(designImages)) {
    if (!img.alt.ar.trim() || !img.alt.en.trim()) err(`design image ${img.id}: missing alt text`);
    for (const [ext, widths] of [['avif', img.widths], ['webp', img.webp]] as const)
      for (const w of widths) if (!existsSync(join(root, `public/assets/design/${img.id}-${w}.${ext}`))) err(`design image ${img.id}: missing ${w}.${ext}`);
  }

  for (const m of memberships) {
    for (const p of m.programIds) if (!programIds.has(p)) err(`membership ${m.id}: unknown program ${p}`);
    if (m.productUrl && !isOfficialStoreUrl(m.productUrl)) err(`membership ${m.id}: productUrl is not an approved official-store URL`);
    if (m.linkVerified && !m.linkVerifiedAt) err(`membership ${m.id}: linkVerified without linkVerifiedAt`);
    if (m.price?.publishApproved && m.price.status !== 'verified' && m.price.status !== 'owner-confirmed')
      err(`membership ${m.id}: price is publish-approved but not verified`);
    const action = resolveMembershipAction(m, { now });
    if (action.kind === 'purchase' && m.branchScope !== 'dhahran' && m.branchScope !== 'all-confirmed')
      err(`membership ${m.id}: purchase CTA without Dhahran eligibility`);
  }
  for (const id of overdueVerifications(memberships, { now })) warnings.push(`membership ${id}: store verification is older than 7 days — re-check price and link`);

  for (const [name, ch] of Object.entries(site.channels)) {
    const host = new URL(ch.url).hostname;
    if (!(site.outboundHosts as readonly string[]).includes(host)) err(`site channel ${name}: host ${host} is not allow-listed`);
    if (ch.evidence.status !== 'verified' && ch.evidence.status !== 'owner-confirmed') err(`site channel ${name}: unverified channel must not be published`);
  }

  // Message parity: identical key sets, no empty strings, same ICU placeholders.
  const flat = (o: unknown, pre = ''): Record<string, string> =>
    Object.entries(o as Record<string, unknown>).reduce(
      (acc, [k, v]) => (typeof v === 'string' ? { ...acc, [pre + k]: v } : { ...acc, ...flat(v, `${pre}${k}.`) }),
      {} as Record<string, string>,
    );
  const ar = flat(JSON.parse(readFileSync(join(root, 'messages/ar.json'), 'utf8')));
  const en = flat(JSON.parse(readFileSync(join(root, 'messages/en.json'), 'utf8')));
  const vars = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(',');
  for (const k of new Set([...Object.keys(ar), ...Object.keys(en)])) {
    if (!(k in ar)) err(`messages: "${k}" missing in ar`);
    else if (!(k in en)) err(`messages: "${k}" missing in en`);
    else {
      if (!ar[k].trim() || !en[k].trim()) err(`messages: "${k}" is empty`);
      if (vars(ar[k]) !== vars(en[k])) err(`messages: "${k}" placeholders differ`);
    }
  }
  return { errors, warnings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = validateAll();
  for (const w of r.warnings) console.warn(`warning: ${w}`);
  if (r.errors.length) {
    for (const e of r.errors) console.error(`error: ${e}`);
    process.exit(1);
  }
  console.log(`Content valid: ${programs.length} programs, ${pathways.length} pathways, ${memberships.length} memberships, ${Object.keys(designImages).length} images.`);
}
