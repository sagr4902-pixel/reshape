import type { Program } from '@/lib/catalog/types';

/**
 * Program content. One record per offering; pages and the
 * registration form all read from here.
 *
 * Evidence: the list of sports comes from the owner's project brief
 * (owner-confirmed as *planned* offerings). Schedules, age bands, coaches,
 * prices and exact formats are NOT confirmed and are deliberately absent.
 */
const BRIEF = { status: 'owner-confirmed', verifiedAt: '2026-11-21T07:00:00Z', note: 'Offering listed in the owner brief of 21 Nov 2026; details unconfirmed.' } as const;

export const programs: Program[] = [
  {
    id: 'calisthenics',
    slug: 'calisthenics',
    route: '/programs/calisthenics',
    internalTags: [],
    title: { ar: 'الكاليسثنكس', en: 'Calisthenics' },
    shortTitle: { ar: 'الكاليسثنكس', en: 'Calisthenics' },
    summary: {
      ar: 'تدريب بوزن الجسم يبني القوة والتحكّم خطوة بعد خطوة — من الأساسيات حتى المهارات المتقدمة.',
      en: 'Bodyweight training that builds strength and control step by step — from fundamentals to advanced skills.',
    },
    positioning: {
      ar: 'الكاليسثنكس هي الرياضة الأساسية في ريشيب الظهران. العقلة والحلق والعوارض أدوات بسيطة، لكن إتقانها رحلة طويلة وممتعة. كل متدرب يبدأ من مستواه ويتقدّم بإيقاعه.',
      en: 'Calisthenics is the core sport at RESHAPE Dhahran. Bars, rings and low bars are simple tools, but mastering them is a long and rewarding journey. Everyone starts at their own level and moves at their own pace.',
    },
    audienceNote: { ar: 'للبالغين من جميع المستويات، من المبتدئ إلى الرياضي المتقدم.', en: 'For adults at every level, from first-timers to advanced athletes.' },
    themes: {
      ar: ['قوة السحب والدفع', 'ثبات الجذع والتحكّم بالجسم', 'المرونة وحركة المفاصل', 'المهارات الثابتة والحركية'],
      en: ['Pulling and pushing strength', 'Core stability and body control', 'Mobility and joint range', 'Static and dynamic skills'],
    },
    benefits: {
      ar: ['تدرّج واضح يناسب مستواك الحالي', 'تدريب يركّز على جودة الحركة قبل صعوبتها', 'عقلات على امتداد جدران الصالة، مع حلق وسلّم سويدي'],
      en: ['A clear progression that fits your current level', 'Training that puts movement quality before difficulty', 'Bars along the walls of the hall, with rings and wall bars'],
    },
    availability: 'planned',
    audiences: ['adult'],
    pathwayIds: ['foundations', 'strength-conditioning', 'static-skills', 'dynamic-freestyle', 'street-lifting', 'advanced-development', 'competitive-preparation'],
    membershipIds: ['dhahran-adult'],
    faqs: [
      {
        q: { ar: 'هل أحتاج خبرة سابقة؟', en: 'Do I need previous experience?' },
        a: { ar: 'لا. مسار الأساسيات مصمّم لمن يبدأ من الصفر. سجّل اهتمامك وسنساعدك في اختيار نقطة البداية المناسبة.', en: 'No. The foundations pathway is designed for people starting from zero. Register your interest and we will help you choose a suitable starting point.' },
      },
      {
        q: { ar: 'هل يجب أن أمرّ بكل المسارات بالترتيب؟', en: 'Do I have to follow every pathway in order?' },
        a: { ar: 'لا. المسارات اتجاهات تدريبية وليست مراحل إلزامية. قد تجمع بين أكثر من مسار بحسب هدفك.', en: 'No. Pathways are training directions, not mandatory stages. You may combine more than one depending on your goal.' },
      },
      {
        q: { ar: 'متى تبدأ الحصص وما مواعيدها؟', en: 'When do sessions start and what is the schedule?' },
        a: { ar: 'سيُعلن عن موعد الافتتاح والجدول لاحقًا. سجّل اهتمامك لتصلك التفاصيل عند إعلانها.', en: 'The opening date and schedule will be announced later. Register your interest to receive the details when they are published.' },
      },
    ],
    ctaIntent: 'program-inquiry',
    imageId: 't-rig',
    evidence: BRIEF,
  },
  {
    id: 'kids',
    slug: 'kids',
    route: '/kids',
    internalTags: ['kids-calisthenics'],
    title: { ar: 'برامج الأطفال', en: 'Kids Programs' },
    shortTitle: { ar: 'الأطفال', en: 'Kids' },
    summary: {
      ar: 'حركة وتوازن وتناسق وأساسيات قوة مناسبة للعمر، في تدريب منظّم يبني ثقة الطفل بنفسه.',
      en: 'Movement, balance, coordination and age-appropriate strength foundations in structured training that builds a child’s confidence.',
    },
    positioning: {
      ar: 'نريد أن يحبّ الطفل الحركة أولًا. التدريب منظّم وبإشراف مدرّب، ويتدرّج من اللعب الحركي إلى أساسيات الكاليسثنكس بما يناسب عمر الطفل واستعداده.',
      en: 'We want children to enjoy movement first. Training is structured and coach-led, moving from playful movement to calisthenics fundamentals in a way that suits each child’s age and readiness.',
    },
    audienceNote: { ar: 'التسجيل والاستفسار يتم عن طريق وليّ الأمر.', en: 'Enquiries and registration are made by a parent or guardian.' },
    themes: {
      ar: ['الحركة الأساسية: جري، قفز، تسلّق', 'التوازن والتناسق', 'أساسيات القوة المناسبة للعمر', 'الثقة والانضباط والعمل ضمن مجموعة'],
      en: ['Fundamental movement: running, jumping, climbing', 'Balance and coordination', 'Age-appropriate strength foundations', 'Confidence, focus and working in a group'],
    },
    benefits: {
      ar: ['حصص منظّمة بإشراف مدرّب', 'تمارين مناسبة لعمر الطفل ومستواه', 'بيئة تشجّع على المحاولة والتقدّم'],
      en: ['Structured, coach-led sessions', 'Exercises suited to the child’s age and level', 'An environment that encourages trying and progressing'],
    },
    availability: 'planned',
    audiences: ['guardian'],
    pathwayIds: [],
    membershipIds: ['dhahran-kids'],
    faqs: [
      {
        q: { ar: 'ما الأعمار المقبولة؟', en: 'Which ages are accepted?' },
        a: { ar: 'سنعلن الفئات العمرية قبل الافتتاح. سجّل اهتمامك وسنتواصل معك لمناقشة ما يناسب طفلك.', en: 'Age groups will be announced before opening. Register your interest and we will contact you to discuss what suits your child.' },
      },
      {
        q: { ar: 'من يدرّب الأطفال وكم عددهم في الحصة؟', en: 'Who coaches the children and how many are in a session?' },
        a: { ar: 'تفاصيل المدربين وأعداد المجموعات لم تُعلن بعد. يسعدنا مناقشتها معك مباشرة عند التواصل.', en: 'Coach details and group sizes have not been announced yet. We are happy to discuss them with you directly when we get in touch.' },
      },
      {
        q: { ar: 'هل يمكن لوليّ الأمر الحضور والمشاهدة؟', en: 'Can a parent stay and watch?' },
        a: { ar: 'سياسة الحضور ستُوضّح قبل الافتتاح. اذكر ذلك في ملاحظاتك عند التسجيل وسنجيبك.', en: 'The attendance policy will be clarified before opening. Mention it in your notes when registering and we will answer.' },
      },
      {
        q: { ar: 'ما المعلومات التي تطلبونها عن طفلي الآن؟', en: 'What information about my child do you ask for now?' },
        a: { ar: 'لا شيء. في هذه المرحلة نطلب اسم وليّ الأمر ورقم جواله فقط، ولا نجمع اسم الطفل أو تاريخ ميلاده.', en: 'None. At this stage we only ask for the guardian’s name and mobile number. We do not collect the child’s name or date of birth.' },
      },
    ],
    ctaIntent: 'program-inquiry',
    imageId: 't-chevron',
    evidence: BRIEF,
  },
  {
    id: 'hybrid-endurance',
    slug: 'hybrid-endurance',
    route: '/programs/hybrid-endurance',
    internalTags: ['hyrox'],
    title: { ar: 'القوة والتحمّل', en: 'Hybrid Endurance' },
    shortTitle: { ar: 'القوة والتحمّل', en: 'Hybrid Endurance' },
    summary: {
      ar: 'تدريب يجمع الجري مع محطات القوة والتحمّل لمن يريد لياقة شاملة تتحمّل الجهد الطويل.',
      en: 'Training that combines running with strength-endurance stations for all-round fitness that holds up under sustained effort.',
    },
    positioning: {
      ar: 'جري، سحب، دفع وحمل — في جلسات منظّمة تتدرّج في الشدّة. مناسب لمن يستعد لسباقات اللياقة الهجينة أو يريد تحدّيًا يجمع القوة والنَّفَس.',
      en: 'Running, pulling, pushing and carrying in structured sessions that scale in intensity. Suitable if you are preparing for hybrid fitness races or want a challenge that combines strength and engine.',
    },
    audienceNote: { ar: 'للبالغين. يُحدَّد المستوى المناسب عند التواصل.', en: 'For adults. The right level is agreed when we get in touch.' },
    themes: {
      ar: ['الجري المتقطّع وإدارة الإيقاع', 'محطات السحب والدفع والحمل', 'التحمّل العضلي', 'الانتقال بين المحطات'],
      en: ['Interval running and pacing', 'Sled, carry and push stations', 'Muscular endurance', 'Transitions between stations'],
    },
    benefits: {
      ar: ['مسار عشبي داخلي وأجهزة جري وتجديف ودراجات هوائية', 'جلسات تتدرّج بحسب المستوى', 'هدف تدريبي واضح لكل جلسة'],
      en: ['An indoor turf lane with treadmills, rowers and air bikes', 'Sessions that scale by level', 'A clear training purpose for every session'],
    },
    availability: 'planned',
    audiences: ['adult'],
    pathwayIds: [],
    membershipIds: ['dhahran-adult'],
    faqs: [
      {
        q: { ar: 'هل البرنامج تابع لجهة سباقات معيّنة؟', en: 'Is the program affiliated with a specific race organiser?' },
        a: { ar: 'لا. هذا برنامج تدريبي خاص بريشيب للقوة والتحمّل، وليس برنامجًا معتمدًا من أي جهة منظِّمة للسباقات.', en: 'No. This is RESHAPE’s own strength-endurance training program and is not an accredited program of any race organiser.' },
      },
      {
        q: { ar: 'هل يناسب المبتدئين؟', en: 'Is it suitable for beginners?' },
        a: { ar: 'نعم، تُعدَّل الشدّة والمسافات بحسب المستوى. أخبرنا بمستواك عند التسجيل.', en: 'Yes — intensity and distances are adjusted by level. Tell us your level when you register.' },
      },
    ],
    ctaIntent: 'program-inquiry',
    imageId: 't-turf',
    evidence: BRIEF,
  },
  {
    id: 'functional-training',
    slug: 'functional-training',
    route: '/programs/functional-training',
    internalTags: ['crossfit'],
    title: { ar: 'التدريب الوظيفي', en: 'Functional Training' },
    shortTitle: { ar: 'التدريب الوظيفي', en: 'Functional Training' },
    summary: {
      ar: 'حصص جماعية متنوّعة تجمع القوة واللياقة والحركة الوظيفية بشدّة تناسب كل مستوى.',
      en: 'Varied group sessions combining strength, conditioning and functional movement at an intensity that fits each level.',
    },
    positioning: {
      ar: 'رفع وحمل وقفز وسحب — حركات نستخدمها في الحياة، مرتّبة في جلسات قصيرة ومركّزة. التقنية أولًا ثم الشدّة.',
      en: 'Lifting, carrying, jumping and pulling — movements we use in life, arranged in short, focused sessions. Technique first, then intensity.',
    },
    audienceNote: { ar: 'للبالغين من جميع المستويات.', en: 'For adults at every level.' },
    themes: {
      ar: ['القوة العامة', 'اللياقة القلبية', 'الحركات المركّبة', 'التقنية الآمنة'],
      en: ['General strength', 'Cardio conditioning', 'Compound movements', 'Sound technique'],
    },
    benefits: {
      ar: ['تنوّع يحافظ على الحماس', 'تمارين قابلة للتعديل لكل مستوى', 'أجواء تدريب جماعي'],
      en: ['Variety that keeps training engaging', 'Exercises that scale to every level', 'A group training atmosphere'],
    },
    availability: 'planned',
    audiences: ['adult'],
    pathwayIds: [],
    membershipIds: ['dhahran-adult'],
    faqs: [
      {
        q: { ar: 'هل هذا برنامج معتمد من علامة تجارية عالمية؟', en: 'Is this an affiliate program of a global brand?' },
        a: { ar: 'لا. هو برنامج تدريب وظيفي خاص بريشيب.', en: 'No. It is RESHAPE’s own functional training program.' },
      },
    ],
    ctaIntent: 'program-inquiry',
    imageId: 't-functional',
    evidence: BRIEF,
  },
  {
    id: 'kids-martial-arts',
    slug: 'kids-martial-arts',
    route: '/programs/kids-martial-arts',
    internalTags: [],
    title: { ar: 'الفنون القتالية للأطفال', en: 'Kids Martial Arts' },
    shortTitle: { ar: 'الفنون القتالية للأطفال', en: 'Kids Martial Arts' },
    summary: {
      ar: 'برنامج مخطّط له للأطفال يركّز على الانضباط والتوازن والثقة. سيُعلن عن الرياضة والتفاصيل لاحقًا.',
      en: 'A planned program for children focused on discipline, balance and confidence. The discipline and details will be announced later.',
    },
    positioning: {
      ar: 'نخطّط لتقديم برنامج فنون قتالية للأطفال ضمن ريشيب الظهران. نوع الرياضة والمدربون والفئات العمرية لم تُحدَّد بعد، وسنعلنها عند تأكيدها.',
      en: 'We plan to offer a martial arts program for children at RESHAPE Dhahran. The discipline, coaches and age groups are not yet confirmed and will be announced once they are.',
    },
    audienceNote: { ar: 'الاستفسار عن طريق وليّ الأمر.', en: 'Enquiries are made by a parent or guardian.' },
    themes: {
      ar: ['الانضباط واحترام القواعد', 'التوازن والتناسق', 'الثقة بالنفس'],
      en: ['Discipline and respect for rules', 'Balance and coordination', 'Self-confidence'],
    },
    benefits: {
      ar: ['سجّل اهتمامك لتصلك التفاصيل أولًا'],
      en: ['Register your interest to hear the details first'],
    },
    availability: 'planned',
    audiences: ['guardian'],
    pathwayIds: [],
    membershipIds: ['dhahran-kids'],
    faqs: [
      {
        q: { ar: 'ما نوع الفن القتالي؟', en: 'Which martial art is it?' },
        a: { ar: 'لم يُحدَّد بعد. سنعلنه عند تأكيده.', en: 'It has not been decided yet. We will announce it once confirmed.' },
      },
    ],
    ctaIntent: 'preopening-updates',
    imageId: 't-warrior',
    evidence: BRIEF,
  },
  {
    id: 'football-performance',
    slug: 'football-performance',
    route: '/football-performance',
    internalTags: ['return-to-sport'],
    title: { ar: 'تطوير الأداء للاعبي كرة القدم', en: 'Football Performance' },
    shortTitle: { ar: 'أداء لاعبي كرة القدم', en: 'Football Performance' },
    summary: {
      ar: 'إعداد بدني للاعب كرة القدم: قوة، لياقة، حركة وجودة أداء — والتحضير للعودة إلى اللعب ضمن حدود التدريب البدني.',
      en: 'Physical preparation for footballers: strength, conditioning, mobility and movement quality — and preparation for returning to play within the limits of physical training.',
    },
    positioning: {
      ar: 'برنامج تدريب بدني مكمّل لتدريب الفريق. نعمل على ما يحتاجه اللاعب خارج الملعب: القوة، السرعة، تغيير الاتجاه وتحمّل المباراة.',
      en: 'A physical training program that complements team practice. We work on what a player needs off the pitch: strength, speed, change of direction and match endurance.',
    },
    audienceNote: { ar: 'للاعبي كرة القدم. لمن هم دون 18 عامًا يتم الاستفسار عن طريق وليّ الأمر.', en: 'For football players. For those under 18, enquiries are made by a parent or guardian.' },
    themes: {
      ar: ['القوة والقدرة', 'اللياقة وتحمّل المباراة', 'الحركة والمرونة', 'جودة الحركة وتغيير الاتجاه', 'التحضير البدني للعودة إلى اللعب'],
      en: ['Strength and power', 'Conditioning and match endurance', 'Mobility', 'Movement quality and change of direction', 'Physical preparation for return to play'],
    },
    benefits: {
      ar: ['خطة تبدأ بمحادثة لفهم وضع اللاعب وهدفه', 'تدريب يكمّل برنامج الفريق ولا يتعارض معه', 'حدود خدمة واضحة منذ البداية'],
      en: ['A plan that starts with a conversation about the player’s situation and goal', 'Training that complements the team program', 'Clear service boundaries from the start'],
    },
    boundaries: {
      ar: [
        'هذا برنامج تدريب بدني وليس خدمة طبية أو علاجًا طبيعيًا.',
        'لا نشخّص الإصابات ولا نعالجها ولا نعد بمدة تعافٍ أو بمنع الإصابات.',
        'التحضير للعودة إلى اللعب يكون بعد حصول اللاعب على موافقة الجهة الطبية المعالِجة.',
        'لا ترسل تقارير أو معلومات طبية عبر نموذج التسجيل.',
      ],
      en: [
        'This is a physical training program, not a medical or physiotherapy service.',
        'We do not diagnose or treat injuries, and we do not promise recovery timelines or injury prevention.',
        'Return-to-play preparation takes place after the player has clearance from their treating medical provider.',
        'Please do not send medical reports or information through the registration form.',
      ],
    },
    availability: 'planned',
    audiences: ['football-athlete', 'guardian'],
    pathwayIds: [],
    membershipIds: [],
    faqs: [
      {
        q: { ar: 'هل التدريب فردي أم جماعي؟', en: 'Is training individual or in groups?' },
        a: { ar: 'الصيغة لم تُعلن بعد. اطلب استشارة وسنوضّح الخيارات المتاحة عند تأكيدها.', en: 'The format has not been announced yet. Request a consultation and we will explain the options once they are confirmed.' },
      },
      {
        q: { ar: 'أنا عائد من إصابة، هل تستقبلونني؟', en: 'I am coming back from an injury — can I join?' },
        a: { ar: 'نعمل على الإعداد البدني بعد حصولك على موافقة طبيبك أو معالجك. لا نقدّم تشخيصًا أو علاجًا.', en: 'We work on physical preparation once you have clearance from your doctor or therapist. We do not provide diagnosis or treatment.' },
      },
    ],
    ctaIntent: 'membership-consultation',
    imageId: 't-strength',
    evidence: BRIEF,
  },
];
