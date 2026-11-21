import type { Scene } from '@/lib/catalog/types';

/**
 * Explorer scene. The building shell is drawn from the supplied plans and
 * renders; which sport goes where is a concept, so spatialMode stays
 * "conceptual-zones" until the owner approves a fit-out plan.
 * Geometry lives in src/features/explorer/scene/model.ts.
 */
export const scene: Scene = {
  id: 'club',
  title: { ar: 'نادي ريشيب الظهران', en: 'RESHAPE Dhahran club' },
  status: 'concept',
  spatialMode: 'conceptual-zones',
  sourceAssetIds: ['fp-01', 'fp-02', 'in-03', 'fp-18', 'fp-19'],
  zones: [
    {
      id: 'calisthenics-hall',
      kind: 'program',
      level: 'ground',
      title: { ar: 'صالة الكاليسثنكس', en: 'Calisthenics hall' },
      summary: {
        ar: 'الصالة الرئيسية في الدور الأرضي. الجزء المفتوح على ارتفاع الدورين يتّسع للعقلة العالية والحلق.',
        en: 'The main ground-floor hall. The double-height section has room for high bars and rings.',
      },
      basis: {
        ar: 'أبعاد الصالة والأعمدة والفراغ المفتوح مأخوذة من المخططات. توزيع الأجهزة تصوّر مبدئي.',
        en: 'Hall dimensions, columns and the open void come from the drawings. Equipment layout is a concept.',
      },
      sourceAssetIds: ['fp-01', 'in-08', 'in-10'],
    },
    {
      id: 'kids-pavilion',
      kind: 'program',
      level: 'ground',
      title: { ar: 'جناح الأطفال', en: 'Kids pavilion' },
      summary: {
        ar: 'مساحة بأرضية ليّنة وأدوات منخفضة للتوازن والتسلّق والقوة الأساسية.',
        en: 'A soft-floored space with low equipment for balance, climbing and basic strength.',
      },
      basis: {
        ar: 'موقع الجناح داخل المبنى مقترح ولم يُعتمد بعد.',
        en: 'The pavilion’s position in the building is a proposal and has not been approved.',
      },
      sourceAssetIds: ['fp-01', 'fp-19'],
    },
    {
      id: 'entrance',
      kind: 'facility',
      level: 'ground',
      title: { ar: 'المدخل والاستقبال', en: 'Entrance & reception' },
      summary: {
        ar: 'المدخل والدرج المؤدي إلى الدور العلوي. هنا تبدأ زيارتك وتسأل عن البرنامج المناسب.',
        en: 'The entrance and the stairs to the upper level. Your visit starts here, with help choosing a program.',
      },
      basis: {
        ar: 'الجدران والدرج من المخططات. مكتب الاستقبال تصوّر مبدئي.',
        en: 'Walls and stairs come from the drawings. The reception desk is a concept.',
      },
      sourceAssetIds: ['fp-01', 'fp-19', 'in-12', 'ex-06'],
    },
    {
      id: 'track-loop',
      kind: 'program',
      level: 'upper',
      title: { ar: 'مسار الجري', en: 'Running track' },
      summary: {
        ar: 'مسار جري يدور حول الفراغ المفتوح في الدور العلوي ويطلّ على صالة الكاليسثنكس.',
        en: 'A running lane that loops around the open void on the upper level, overlooking the calisthenics hall.',
      },
      basis: {
        ar: 'المسار الأحمر والحاجز الزجاجي ظاهران في التصاميم المقدَّمة.',
        en: 'The red lane and glazed edge appear in the supplied designs.',
      },
      sourceAssetIds: ['fp-02', 'fp-18', 'in-14', 'in-16'],
    },
    {
      id: 'performance-deck',
      kind: 'program',
      level: 'upper',
      title: { ar: 'منصة الأداء', en: 'Performance deck' },
      summary: {
        ar: 'مساحة مفتوحة في الدور العلوي للتدريب الوظيفي ومحطات القوة والتحمّل وإعداد لاعبي كرة القدم.',
        en: 'An open upper-level floor for functional training, strength-endurance stations and football preparation.',
      },
      basis: {
        ar: 'المساحة من المخططات. الأجهزة وتوزيعها تصوّر مبدئي.',
        en: 'The floor area comes from the drawings. Equipment and layout are a concept.',
      },
      sourceAssetIds: ['fp-02', 'fp-18', 'in-15'],
    },
    {
      id: 'changing',
      kind: 'facility',
      level: 'upper',
      title: { ar: 'غرف التبديل', en: 'Changing rooms' },
      summary: {
        ar: 'غرف التبديل في الدور العلوي بجانب الدرج.',
        en: 'Changing rooms on the upper level, next to the stairs.',
      },
      basis: {
        ar: 'تقسيم الغرف مأخوذ من مخطط الدور العلوي وقد يتغيّر.',
        en: 'Room partitions follow the upper-floor plan and may change.',
      },
      sourceAssetIds: ['fp-02', 'fp-18'],
    },
  ],
};
