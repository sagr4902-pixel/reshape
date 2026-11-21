import type { Scene } from '@/lib/catalog/types';

/**
 * Explorer scene. Layout, zones and equipment positions follow the owner's
 * working drawings (dimension + furniture layout plans, issue 20/08/2026) and
 * the facade package Rev. 02; imagery is the owner's design deck. The
 * drawings are marked "for review", so details may still change in execution.
 * Geometry lives in src/features/explorer/scene/model.ts.
 */
const DRAWINGS = {
  ar: 'الموقع والأبعاد من الرسومات التنفيذية للنادي، والصور من تصاميمه. قد تتغيّر بعض التفاصيل عند التنفيذ.',
  en: 'Position and dimensions follow the club’s working drawings; images are from its design set. Some details may change in execution.',
};

export const scene: Scene = {
  id: 'club',
  title: { ar: 'نادي ريشيب الظهران', en: 'RESHAPE Dhahran club' },
  status: 'reference-validated',
  spatialMode: 'verified-layout',
  sourceAssetIds: ['wd-04', 'wd-08', 'wd-11', 'facade-01', 'facade-02', 'deck'],
  zones: [
    {
      id: 'entrance',
      kind: 'facility',
      level: 'ground',
      title: { ar: 'الواجهة والمدخل', en: 'Facade & entrance' },
      summary: {
        ar: 'لافتة reshape السوداء المضاءة، شريط الأسهم فوق الباب المزدوج، وواجهات زجاجية تكشف الجوس بار وصالة التدريب من الخارج.',
        en: 'The backlit black reshape sign, a chevron strip above the double door, and glazed bays that reveal the juice bar and the training hall from outside.',
      },
      basis: {
        ar: 'من رسومات الواجهة (الإصدار 02) ومنظورها المعتمد. الرسومات للمراجعة وقد تتغيّر تفاصيل عند التنفيذ.',
        en: 'From the facade drawings (Rev. 02) and their render. The drawings are issued for review; details may change in execution.',
      },
      sourceAssetIds: ['facade-01', 'facade-02', 'facade-05'],
      imageIds: ['facade', 'd21'],
    },
    {
      id: 'reception',
      kind: 'facility',
      level: 'ground',
      title: { ar: 'الاستقبال والمتجر', en: 'Reception & store' },
      summary: {
        ar: 'مكتب استقبال نحاسي بأرضية تيرازو، وبجانبه ركن متجر ريشيب والدرج الصاعد إلى الميزانين. هنا تبدأ زيارتك وتسأل عن البرنامج المناسب.',
        en: 'A brass reception desk on terrazzo flooring, next to the RESHAPE store corner and the stairs up to the mezzanine. Your visit starts here, with help choosing a program.',
      },
      basis: DRAWINGS,
      sourceAssetIds: ['wd-08', 'deck'],
      imageIds: ['d04', 'd03', 'd06', 'd09'],
      labelSide: 'left',
    },
    {
      id: 'juice-bar',
      kind: 'facility',
      level: 'ground',
      title: { ar: 'الجوس بار', en: 'Juice bar' },
      summary: {
        ar: 'طاولة مشتركة بثمانية مقاعد خلف الواجهة الزجاجية، ومنضدة سوداء، وبوابة حمراء تقود مباشرة إلى صالة التدريب.',
        en: 'A communal table for eight behind the glazed facade, a black counter, and a red portal that leads straight into the training hall.',
      },
      basis: DRAWINGS,
      sourceAssetIds: ['wd-08', 'deck'],
      imageIds: ['d10', 'd16', 'd12', 'd19'],
    },
    {
      id: 'rig',
      kind: 'program',
      level: 'ground',
      title: { ar: 'العقلات والحلق', en: 'Bars & rings' },
      summary: {
        ar: 'عقلات مثبّتة على ثلاثة جدران من الصالة ذات الارتفاع المزدوج، مع حلق وسلّم سويدي وعوارض منخفضة — قلب تدريب الكاليسثنكس.',
        en: 'Pull-up bars fixed along three walls of the double-height hall, with rings, wall bars and low bars — the heart of calisthenics training.',
      },
      basis: DRAWINGS,
      sourceAssetIds: ['wd-08', 'deck'],
      imageIds: ['d25', 'd24', 'd27', 'd35'],
    },
    {
      id: 'turf-cardio',
      kind: 'program',
      level: 'ground',
      title: { ar: 'المسار العشبي والكارديو', en: 'Turf lane & cardio' },
      summary: {
        ar: 'مسار عشبي بطول يقارب عشرة أمتار للزلاجة والإطار، تحيط به أجهزة الجري والتجديف والدراجات الهوائية.',
        en: 'A turf lane of roughly ten metres for sled and tyre work, surrounded by treadmills, rowers and air bikes.',
      },
      basis: DRAWINGS,
      sourceAssetIds: ['wd-08', 'deck'],
      imageIds: ['d29', 'd34', 'd33', 'd42'],
    },
    {
      id: 'strength',
      kind: 'program',
      level: 'ground',
      title: { ar: 'منطقة القوة Re.Build', en: 'Re.Build strength area' },
      summary: {
        ar: 'أقفاص سكوات ومنصة رفع ورفوف دمبلز تحت الميزانين، بسقف أسود وجدار طوب.',
        en: 'Squat racks, a lifting platform and dumbbell racks beneath the mezzanine, under a black ceiling and beside a brick wall.',
      },
      basis: DRAWINGS,
      sourceAssetIds: ['wd-08', 'deck'],
      imageIds: ['d38', 'd39', 'd37'],
    },
    {
      id: 'lockers',
      kind: 'facility',
      level: 'upper',
      title: { ar: 'الخزائن وغرف التبديل', en: 'Lockers & changing rooms' },
      summary: {
        ar: 'خزائن زرقاء ومقاعد خشبية ومقصورات تبديل ومغاسل بسطح تيرازو، في دور الميزانين.',
        en: 'Blue lockers, timber benches, changing cubicles and a terrazzo vanity, on the mezzanine level.',
      },
      basis: DRAWINGS,
      sourceAssetIds: ['wd-11', 'deck'],
      imageIds: ['d51', 'd53', 'd46', 'd64'],
      labelSide: 'left',
    },
    {
      id: 'overlook',
      kind: 'facility',
      level: 'upper',
      title: { ar: 'ممشى الميزانين', en: 'Mezzanine walkway' },
      summary: {
        ar: 'ممشى يطلّ على صالة التدريب من خلف درابزين الأسهم البرتقالية، وينتهي بمكتب زجاجي.',
        en: 'A walkway overlooking the training hall from behind the orange chevron balustrade, ending at a glazed office.',
      },
      basis: DRAWINGS,
      sourceAssetIds: ['wd-11', 'deck'],
      imageIds: ['d48', 'd62', 'd49', 'd50'],
    },
  ],
};
