import type { Pathway } from '@/lib/catalog/types';

/** Calisthenics pathways. Proposed (provisional) until the owner confirms each one. */
export const pathways: Pathway[] = [
  {
    id: 'foundations',
    programId: 'calisthenics',
    title: { ar: 'الأساسيات', en: 'Foundations' },
    summary: { ar: 'للمبتدئين: التعلّق، الضغط، السكوات وثبات الجذع.', en: 'For beginners: hanging, push-ups, squats and core stability.' },
    status: 'provisional',
  },
  {
    id: 'strength-conditioning',
    programId: 'calisthenics',
    title: { ar: 'القوة واللياقة', en: 'Strength & Conditioning' },
    summary: { ar: 'بناء قوة السحب والدفع والتحمّل العضلي.', en: 'Building pulling and pushing strength and muscular endurance.' },
    status: 'provisional',
  },
  {
    id: 'static-skills',
    programId: 'calisthenics',
    title: { ar: 'المهارات الثابتة', en: 'Static Skills' },
    summary: { ar: 'الوقوف على اليدين، الفرونت ليفر، البلانش وما يقود إليها.', en: 'Handstand, front lever, planche and the progressions that lead to them.' },
    status: 'provisional',
  },
  {
    id: 'dynamic-freestyle',
    programId: 'calisthenics',
    title: { ar: 'المهارات الحركية والفري ستايل', en: 'Dynamics & Freestyle' },
    summary: { ar: 'المَسل أب، الدورانات والانتقالات على العقلة.', en: 'Muscle-ups, swings and transitions on the bar.' },
    status: 'provisional',
  },
  {
    id: 'street-lifting',
    programId: 'calisthenics',
    title: { ar: 'ستريت ليفتنق', en: 'Street Lifting' },
    summary: { ar: 'العقلة والمتوازي والسكوات بأوزان إضافية.', en: 'Weighted pull-ups, dips and squats.' },
    status: 'provisional',
  },
  {
    id: 'advanced-development',
    programId: 'calisthenics',
    title: { ar: 'تطوير المتقدمين', en: 'Advanced Development' },
    summary: { ar: 'برمجة أعمق للرياضي صاحب الخبرة.', en: 'Deeper programming for the experienced athlete.' },
    status: 'provisional',
  },
  {
    id: 'competitive-preparation',
    programId: 'calisthenics',
    title: { ar: 'الإعداد للمنافسات', en: 'Competitive Preparation' },
    summary: { ar: 'تحضير موجّه لمن يستعد للمشاركة في البطولات.', en: 'Focused preparation for athletes getting ready to compete.' },
    status: 'provisional',
  },
];
