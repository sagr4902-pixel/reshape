import manifest from '../../public/assets/design/manifest.json';

/**
 * Owner-supplied design renders (design submission deck, 21 Aug 2026, and the
 * facade package render). These are design visualisations, not photographs —
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
    'واجهة ريشيب الظهران ليلًا: لافتة reshape السوداء المضاءة من الخلف، شريط الأسهم الأحمر والأبيض فوق المدخل، باب مزدوج، وواجهات زجاجية تُظهر الجوس بار وصالة التدريب.',
    'RESHAPE Dhahran facade at night: backlit black reshape sign, a red-and-white chevron strip above the entrance, a double door, and glazed bays showing the juice bar and the training hall.',
  ],
  d03: ['مكتب الاستقبال النحاسي مع وحدات عرض المتجر', 'Brass reception desk with the store display units'],
  d04: ['الاستقبال والجوس بار: مكتب نحاسي يحمل شعار reshape وجدار أزرق وطاولة مشتركة', 'Reception and juice bar: a brass desk carrying the reshape logo, a blue wall and a communal table'],
  d06: ['ركن متجر ريشيب بجانب الدرج والاستقبال', 'The RESHAPE store corner beside the stairs and reception'],
  d09: ['لوحة إرشادية نحو الاستقبال والتسجيل على جدار خرساني', 'Wayfinding sign to reception and registration on a concrete wall'],
  d10: ['الجوس بار من جهة الواجهة الزجاجية: طاولة طويلة وكراسٍ برتقالية', 'The juice bar seen from the glazed facade: a long table and orange chairs'],
  d12: ['الجوس بار باتجاه البوابة الحمراء المؤدية إلى صالة التدريب', 'The juice bar looking toward the red portal into the training hall'],
  d16: ['طاولة الجوس بار المشتركة بكراسيها الملوّنة', 'The juice bar’s communal table with its coloured chairs'],
  d19: ['منضدة الجوس بار السوداء والبوابة الحمراء', 'The black juice-bar counter and the red portal'],
  d21: ['الدرج المؤدي إلى الميزانين', 'The stairs up to the mezzanine'],
  d24: ['صالة التدريب: عقلات مثبّتة على الجدران وسلّم سويدي أحمر ودراجات هوائية', 'Training hall: wall-mounted pull-up bars, red wall bars and air bikes'],
  d25: ['عقلات الكاليسثنكس على امتداد الجدار تحت الهيكل الفولاذي الأحمر', 'Calisthenics bars along the wall beneath the red steel structure'],
  d27: ['صالة التدريب بارتفاع دورين مع العقلات والدراجات', 'The double-height training hall with bars and bikes'],
  d29: ['أجهزة الجري والمسار العشبي تحت لوحات King و Warrior و Magician و Lover', 'Treadmills and the turf lane beneath the King, Warrior, Magician and Lover signs'],
  d33: ['صناديق القفز الصفراء وأجهزة الجري بجانب المسار العشبي', 'Yellow plyo boxes and treadmills beside the turf lane'],
  d34: ['أجهزة التجديف وأجهزة الجري في صالة التدريب', 'Rowers and treadmills in the training hall'],
  d35: ['حلق جمباز وكرات طبية بجانب المسار العشبي', 'Gymnastic rings and medicine balls beside the turf lane'],
  d37: ['منطقة القوة Re.Build كما تُرى من المسار العشبي', 'The Re.Build strength area seen from the turf lane'],
  d38: ['بار أولمبي بأقراص حمراء ورفّ دمبلز في منطقة القوة', 'An Olympic barbell with red plates and a dumbbell rack in the strength area'],
  d39: ['رفوف الدمبلز والأقراص في منطقة القوة', 'Dumbbell and plate racks in the strength area'],
  d42: ['صالة التدريب من الميزانين: المسار العشبي والإطار وأجهزة التجديف', 'The training hall from the mezzanine: turf lane, tyre and rowers'],
  d46: ['ممر الخزائن في الميزانين', 'The locker corridor on the mezzanine'],
  d48: ['ممشى الميزانين بدرابزين الأسهم البرتقالية المطلّ على صالة التدريب', 'The mezzanine walkway with its orange chevron balustrade overlooking the training hall'],
  d49: ['ممشى الميزانين من الجهة المقابلة مع رمز ريشيب على الزجاج', 'The mezzanine walkway from the other end, with the RESHAPE mark on glass'],
  d50: ['مكتب الإدارة في الميزانين', 'The office on the mezzanine'],
  d51: ['غرفة التبديل: خزائن زرقاء ومقعد خشبي', 'Changing room: blue lockers and a timber bench'],
  d53: ['خزائن ومقصورات تبديل', 'Lockers and changing cubicles'],
  d62: ['ممر الميزانين وجدار الأسهم', 'The mezzanine corridor with the chevron wall'],
  d64: ['مغاسل دورات المياه بسطح تيرازو', 'Restroom vanity with a terrazzo top'],
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
