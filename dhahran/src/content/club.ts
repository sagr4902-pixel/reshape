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
  group: 'sessions' | 'championships' | 'community' | 'kids' | 'interviews' | 'workshops';
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
/** Club clips supplied by the owner (Nov 2026), compressed to 540p H.264 under /public/assets/media. */
const clip = (id: string, group: MediaItem['group'], ar: string, en: string): MediaItem => ({
  id,
  group,
  kind: 'video',
  src: `/assets/media/${id}.mp4`,
  poster: `/assets/media/${id}.webp`,
  caption: { ar, en },
});

// Owner, 28 Nov 2026: everyone shown in these clips (including the children's parents and the people interviewed) agreed in advance to appear on the site.
export const media: MediaItem[] = [
  clip('sessions-bar-flow', 'sessions', 'حركات على البار فوق المراتب', 'Bar movement over the mats'),
  clip('sessions-pushup-class', 'sessions', 'حصة جماعية: تمارين الضغط', 'Group class: push-up work'),
  clip('sessions-inverted-rows', 'sessions', 'حصة جماعية: سحب مقلوب', 'Group class: inverted rows'),
  clip('sessions-calisthenics-reel', 'sessions', 'لقطات من تمارين الكاليسثنكس في النادي', 'Calisthenics training at the club'),

  clip('championships-athletes-day', 'championships', 'يوم البطولة: الرياضيون أمام الحكام', 'Championship day: athletes in front of the judges'),
  clip('championships-highlights', 'championships', 'أبرز لحظات بطولة الكبار', 'Adult championship highlights'),
  clip('championships-judges-clock', 'championships', 'تحدي الوقت في البطولة', 'Racing the clock at the championship'),
  clip('championships-kids-final', 'championships', 'بطولة الأطفال أمام الجمهور', 'The kids championship in front of the crowd'),

  clip('community-open-night', 'community', 'ليلة تدريب مفتوحة مع مجتمع ريشيب', 'An open training night with the RESHAPE community'),
  clip('community-open-gym', 'community', 'تدريب مفتوح للجميع', 'Open gym for everyone'),
  clip('community-tug-of-war', 'community', 'شد الحبل بين الأطفال والآباء', 'Tug of war: kids and dads'),
  clip('community-kids-event', 'community', 'فعالية الأطفال: تحديات وفرحة', 'Kids event: challenges and celebration'),

  clip('kids-one-two-three', 'kids', 'برنامج الأطفال خطوة بخطوة', 'The kids program, step by step'),
  clip('kids-first-skills', 'kids', 'أول المهارات في برنامج الأطفال', 'First skills in the kids program'),
  clip('kids-dead-hang', 'kids', 'تحدي التعلق للأطفال', 'Kids dead-hang challenge'),
  clip('kids-splits-with-coach', 'kids', 'تمارين المرونة مع المدرب', 'Flexibility work with the coach'),

  clip('interviews-young-athletes', 'interviews', 'لقاء مع أبطالنا الصغار يوم البطولة', 'Our young athletes on championship day'),
  clip('interviews-parents', 'interviews', 'ضيوف البطولة: هل تنصح الشباب بهذه الرياضة؟', 'Championship guests: would you recommend the sport?'),
  clip('interviews-supporters', 'interviews', 'الجمهور: لو كنت لاعبًا؟', 'The crowd: what if you were competing?'),
  clip('interviews-members', 'interviews', 'لقاءات من داخل النادي', 'Interviews from inside the club'),
];
export const schedule: ClassSlot[] = [];
export const partners: Partner[] = [];
