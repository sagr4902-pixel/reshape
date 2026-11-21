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
import { scene } from '../src/content/scene';
import { site } from '../src/content/site';
import { overdueVerifications, resolveMembershipAction } from '../src/lib/catalog/resolve';
import { isOfficialStoreUrl } from '../src/lib/catalog/store-links';
import { membershipSchema, pathwaySchema, programSchema, sceneSchema } from '../src/lib/catalog/types';

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
  const s = sceneSchema.safeParse(scene);
  if (!s.success) err(`scene: ${z.prettifyError(s.error)}`);

  const programIds = new Set(programs.map((p) => p.id));
  const zoneIds = new Set(scene.zones.map((z) => z.id));
  const pathwayIds = new Set(pathways.map((p) => p.id));
  const membershipIds = new Set(memberships.map((m) => m.id));
  const meta = JSON.parse(readFileSync(join(root, 'src/content/generated/scene-meta.json'), 'utf8'));

  for (const p of programs) {
    for (const z of p.zoneIds) if (!zoneIds.has(z)) err(`program ${p.id}: unknown zone ${z}`);
    for (const w of p.pathwayIds) if (!pathwayIds.has(w)) err(`program ${p.id}: unknown pathway ${w}`);
    for (const m of p.membershipIds) if (!membershipIds.has(m)) err(`program ${p.id}: unknown membership ${m}`);
    if (!existsSync(join(root, 'public', p.image))) err(`program ${p.id}: missing image ${p.image}`);
    if (p.themes.ar.length !== p.themes.en.length) err(`program ${p.id}: themes differ in length between locales`);
    if (p.benefits.ar.length !== p.benefits.en.length) err(`program ${p.id}: benefits differ in length between locales`);
    // Brand-use rule: protected names never appear in public copy.
    const publicText = JSON.stringify([p.title, p.shortTitle, p.summary, p.positioning, p.themes, p.benefits, p.audienceNote]);
    if (/crossfit|كروس ?فت|hyrox|هايروكس/i.test(publicText)) err(`program ${p.id}: protected brand name in public copy`);
  }
  for (const w of pathways) if (!programIds.has(w.programId)) err(`pathway ${w.id}: unknown program ${w.programId}`);
  for (const z of scene.zones) {
    if (!meta.zones[z.id]) err(`zone ${z.id}: no generated geometry (run npm run scenes:build)`);
    for (const t of ['dark', 'light']) if (!existsSync(join(root, `public/assets/scenes/zone-${z.id}-${t}.svg`))) err(`zone ${z.id}: missing ${t} illustration`);
  }
  for (const id of Object.keys(meta.zones)) if (!zoneIds.has(id)) err(`generated zone ${id} has no content record`);

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
  console.log(`Content valid: ${programs.length} programs, ${pathways.length} pathways, ${memberships.length} memberships, ${scene.zones.length} zones.`);
}
