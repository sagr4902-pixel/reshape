/**
 * Real club material: coaches, member stories, achievements, live media,
 * class times and partners.
 *
 * Every list starts empty on purpose. Names, certificates, results, quotes and
 * photos of real people are never written by the developer — they are added
 * here only when the owner supplies them (and, for stories and photos, when
 * the person has agreed to appear). An empty list hides its section in
 * production; previews show a marked "awaiting content" card instead.
 */
type L = { ar: string; en: string };
type LL = { ar: string[]; en: string[] };

export interface Coach {
  id: string;
  name: L;
  role: L;
  /** Certificates and licences, as issued. */
  credentials: LL;
  /** Experience and titles, in the coach's own facts. */
  experience: LL;
  /** Path under /public, e.g. /assets/people/coach-x.webp */
  photo?: string;
}

export const STORY_KINDS = ['weight-loss', 'age', 'strength', 'first-pull-up', 'muscle-up', 'lifestyle', 'confidence', 'joy', 'mindset', 'competition'] as const;
export interface Story {
  id: string;
  kind: (typeof STORY_KINDS)[number];
  /** First name or initials, as the member wants to be shown. */
  name: L;
  /** The member's own words. */
  quote: L;
  /** A measured, true fact, e.g. "18 kg in 7 months" or "foundation class → Gulf level in two years". */
  result?: L;
  photo?: string;
  /** Path under /public to an MP4, with `photo` as its poster. */
  video?: string;
  /** Must be true: the member agreed in writing to appear on the site. */
  consent: true;
}

export interface Achievement {
  id: string;
  year: number;
  title: L;
  detail?: L;
}

export interface MediaItem {
  id: string;
  group: 'sessions' | 'championships' | 'community' | 'kids' | 'workshops';
  kind: 'photo' | 'video';
  src: string;
  poster?: string;
  caption: L;
}

export interface ClassSlot {
  id: string;
  programId: string;
  days: L;
  /** 24-hour local time, e.g. "17:30". */
  start: string;
  end: string;
  audience: L;
}

export interface Partner {
  id: string;
  kind: 'sponsor' | 'partner' | 'recovery';
  name: L;
  logo?: string;
  url?: string;
}

export const coaches: Coach[] = [];
export const stories: Story[] = [];
export const achievements: Achievement[] = [];
export const media: MediaItem[] = [];
export const schedule: ClassSlot[] = [];
export const partners: Partner[] = [];
