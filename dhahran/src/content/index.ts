import { programs } from './programs';
import { pathways } from './pathways';
import { memberships } from './memberships';
import { scene } from './scene';
import sceneMeta from './generated/scene-meta.json';
import { resolveMembershipAction, type MembershipAction } from '@/lib/catalog/resolve';
import type { Locale, Membership, Program, Zone } from '@/lib/catalog/types';

export { programs, pathways, memberships, scene, sceneMeta };
export { site } from './site';

export const programById = (id: string): Program | undefined => programs.find((p) => p.id === id);
export const programBySlug = (slug: string): Program | undefined => programs.find((p) => p.slug === slug);
export const zoneById = (id: string): Zone | undefined => scene.zones.find((z) => z.id === id);
export const programIds = programs.map((p) => p.id);
export const zoneIds = scene.zones.map((z) => z.id);
export const programsForZone = (zoneId: string) => programs.filter((p) => p.zoneIds.includes(zoneId));
export const pathwaysFor = (programId: string) => pathways.filter((p) => p.programId === programId);

/** Programs with their own page under /programs/[slug]. */
export const detailPrograms = programs.filter((p) => p.route.startsWith('/programs/'));

/**
 * Public membership view. Only records that are planned for Dhahran or that
 * resolve to a purchase are exposed; evidence notes and unapproved prices
 * never leave the server.
 */
export interface PublicMembership {
  id: string;
  title: string;
  programIds: string[];
  action: MembershipAction;
}
export function publicMemberships(locale: Locale, now = new Date()): PublicMembership[] {
  return memberships
    .filter((m: Membership) => m.branchScope === 'dhahran' || m.branchScope === 'all-confirmed')
    .map((m) => ({ id: m.id, title: m.title[locale], programIds: m.programIds, action: resolveMembershipAction(m, { now }) }));
}
export function membershipsForProgram(programId: string, locale: Locale): PublicMembership[] {
  return publicMemberships(locale).filter((m) => m.programIds.includes(programId));
}

/** Build a registration href carrying only allow-listed, non-personal context IDs. */
export function registerHref(ctx: { program?: string; zone?: string; intent?: string; src?: string } = {}): string {
  const q = new URLSearchParams();
  if (ctx.program) q.set('program', ctx.program);
  if (ctx.zone) q.set('zone', ctx.zone);
  if (ctx.intent) q.set('intent', ctx.intent);
  if (ctx.src) q.set('src', ctx.src);
  const s = q.toString();
  return s ? `/register?${s}` : '/register';
}
