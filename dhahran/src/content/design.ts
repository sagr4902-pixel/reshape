import manifest from '../../public/assets/design/manifest.json';

/**
 * The facade render and tight teaser crops of single details from the owner's
 * design deck. Full interior renders are never published. These are design visualisations, not photographs —
 * always shown with the concept label. Web derivatives live in
 * public/assets/design; originals stay in input-assets/ (git-ignored).
 * Regenerate with scripts/dev/encode-renders.py.
 */
export interface DesignImage {
  id: string;
  alt: { ar: string; en: string };
  w: number;
  h: number;
  /** AVIF widths. */
  widths: number[];
  /** WebP fallback widths (subset). */
  webp: number[];
}

const ALTS: Record<string, [string, string]> = {
  facade: [
    'واجهة ريشيب الظهران ليلًا: لافتة reshape السوداء المضاءة من الخلف، شريط الأسهم الأحمر والأبيض فوق المدخل، وباب مزدوج.',
    'RESHAPE Dhahran facade at night: backlit black reshape sign, a red-and-white chevron strip above the entrance, and a double door.',
  ],
  't-juice': ['لقطة مقرّبة من الجوس بار: طاولة مشتركة وكراسٍ برتقالية', 'Close-up of the juice bar: a communal table and orange chairs'],
  't-rig': ['لقطة مقرّبة لعقلات الكاليسثنكس على الجدار', 'Close-up of calisthenics bars along a wall'],
  't-strength': ['لقطة مقرّبة لبار أولمبي بأقراص حمراء على الأرض', 'Close-up of an Olympic bar with red plates on the floor'],
  't-turf': ['لقطة مقرّبة للمسار العشبي الأخضر', 'Close-up of the green turf lane'],
  't-functional': ['لقطة مقرّبة لقفص رفع الأثقال وأقراصه الحمراء', 'Close-up of a lifting rack and its red plates'],
  't-vanity': ['لقطة مقرّبة لمغاسل بسطح تيرازو وصنابير ذهبية', 'Close-up of a terrazzo vanity with brass taps'],
  't-lockers': ['لقطة مقرّبة لخزائن زرقاء بأقفال رقمية', 'Close-up of blue lockers with keypad locks'],
  't-chevron': ['لقطة مقرّبة لجدار الأسهم البرتقالية والبيضاء', 'Close-up of the orange-and-white chevron wall'],
  't-warrior': ['لوحات الشخصيات: الملك والمحارب والساحر والمحب', 'The character panels: King, Warrior, Magician and Lover'],
};

type Entry = { w: number; h: number; files: Record<string, number> };
const widthsOf = (m: Entry, ext: string) =>
  Object.keys(m.files)
    .filter((k) => k.endsWith(`.${ext}`))
    .map((k) => Number(k.split('.')[0]))
    .sort((a, b) => a - b);

export const designImages: Record<string, DesignImage> = Object.fromEntries(
  Object.entries(manifest as Record<string, Entry>).map(([id, m]) => [
    id,
    {
      id,
      alt: { ar: ALTS[id]?.[0] ?? '', en: ALTS[id]?.[1] ?? '' },
      w: m.w,
      h: m.h,
      widths: widthsOf(m, 'avif'),
      webp: widthsOf(m, 'webp'),
    },
  ]),
);

export const designImage = (id: string): DesignImage => {
  const img = designImages[id];
  if (!img) throw new Error(`Unknown design image: ${id}`);
  return img;
};
