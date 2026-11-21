import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { env } from '@/lib/env';
import { designImage, pathwaysFor, programById, registerHref, scene } from '@/content';
import { Rail } from '@/components/ui/Rail';
import { DesignPicture } from '@/components/ui/DesignPicture';
import { FaqList } from '@/components/ui/Faq';
import { FacadeHero, type FacadeHotspot } from '@/features/home/FacadeHero';
import { EnterLink } from '@/features/home/EnterLink';

/** `sizes` for a 16:9 render that fills a card taller than 16:9 (the height decides how wide the picture is drawn). */
const COVER_TALL_CARD = '(max-width: 639px) and (min-resolution: 2.5dppx) 400px, (max-width: 639px) 600px, 1110px';

type Props = { params: Promise<{ locale: Locale }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '', title: t('titleDefault'), description: t('description'), siteName: t('siteName'), absoluteTitle: true });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const preopening = env().launchStage === 'preopening';

  const cal = programById('calisthenics')!;
  const kids = programById('kids')!;
  const others = ['hybrid-endurance', 'functional-training', 'kids-martial-arts', 'football-performance'].map((id) => programById(id)!);
  const arrow = <span className="arrow" aria-hidden="true">→</span>;
  const alt = (id: string) => designImage(id).alt[locale];

  // Positions measured on the facade render (fractions of its width / height).
  const hotspots: FacadeHotspot[] = [
    { id: 'enter', label: t('hero.hotspots.enter'), href: '/explore?zone=reception', u: 0.473, v: 0.7, primary: true },
    { id: 'juice', label: t('hero.hotspots.juice'), href: '/explore?zone=juice-bar', u: 0.625, v: 0.69 },
    { id: 'hall', label: t('hero.hotspots.hall'), href: '/explore?zone=turf-cardio', u: 0.805, v: 0.69 },
    { id: 'mezz', label: t('hero.hotspots.mezz'), href: '/explore?zone=overlook', u: 0.79, v: 0.36 },
  ];

  return (
    <>
      {/* 1 — The facade, exactly as designed */}
      <FacadeHero alt={alt('facade')} facadeLabel={t('hero.facadeLabel')} hotspotsLabel={t('hero.hotspotsNav')} hotspots={hotspots} note={c('conceptNote')}>
        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{t('hero.eyebrow')}</span>
          {preopening && <span className="tag text-paper">{c('preopening')}</span>}
        </p>
        <h1 className="t-hero mt-3">{t('hero.title')}</h1>
        <div className="bar mt-5 w-[min(100%,300px)] text-paper" aria-hidden="true" />
        <p className="lead max-w-xl">{t('hero.sub')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={registerHref({ src: 'home' })} className="btn btn-primary">
            {c('registerInterest')}
          </Link>
          <EnterLink href="/explore" className="btn btn-line" testId="hero-explore">
            {c('exploreClub')} {arrow}
          </EnterLink>
        </div>
        {preopening && <p className="mute mt-5 max-w-md text-[0.9rem] lg:hidden">{t('hero.stage')}</p>}
      </FacadeHero>
      <div className="chevron-band" aria-hidden="true" />

      {/* 2 — Calisthenics spread */}
      <section className="sec" aria-labelledby="cal-h">
        <div className="wrap">
          <Rail no="01" label={t('cal.rail')} />
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <h2 id="cal-h" className="t-1">
                {t('cal.title')}
              </h2>
              <p className="lead mt-5">{t('cal.body')}</p>
              <ul className="mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {cal.themes[locale].map((x) => (
                  <li key={x} className="flex gap-3 border-t border-line py-2 font-semibold">
                    <span aria-hidden="true" className="mt-[0.72em] h-[3px] w-4 flex-none bg-accent" />
                    {x}
                  </li>
                ))}
              </ul>
              <Link href={cal.route} className="btn btn-dark mt-8">
                {t('cal.cta')} {arrow}
              </Link>
            </div>
            <figure className="lg:col-span-7">
              <div className="overflow-hidden rounded-lg bg-ink">
                <DesignPicture image={designImage('d25')} alt={alt('d25')} sizes="(min-width: 1024px) 56vw, 100vw" className="h-auto w-full" />
              </div>
              <figcaption className="concept-note mt-3">{c('conceptNote')}</figcaption>
            </figure>
          </div>

          <div className="mt-14">
            <h3 className="t-3">{t('cal.pathwaysTitle')}</h3>
            <p className="mute mt-1 text-[0.95rem]">{t('cal.pathwaysNote')}</p>
            <ol className="prog mt-6" tabIndex={0} aria-label={t('cal.pathwaysTitle')}>
              {pathwaysFor('calisthenics').map((pw, i) => (
                <li key={pw.id}>
                  <span className="ltr font-[family-name:var(--font-latin)] text-[0.95rem] text-accent-ink">{String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-1 text-[1.12rem] font-semibold leading-snug">{pw.title[locale]}</p>
                  <p className="mute mt-1 text-[0.95rem] leading-relaxed">{pw.summary[locale]}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 3 — Club tour: the real zones, in the order a visitor walks them */}
      <section className="on-dark dark-sec sec" aria-labelledby="tour-h">
        <div className="wrap">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Rail no="02" label={t('tour.rail')} />
              <h2 id="tour-h" className="t-2 mt-8">
                {t('tour.title')}
              </h2>
              <p className="mt-4 max-w-2xl">{t('tour.body')}</p>
            </div>
            <div className="lg:col-span-5 lg:text-end">
              <Link href="/explore" className="btn btn-primary">
                {t('tour.cta')} {arrow}
              </Link>
            </div>
          </div>
          <ul aria-label={t('tour.zonesLabel')} className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {scene.zones.map((z, i) => (
              <li key={z.id}>
                <Link href={{ pathname: '/explore', query: { zone: z.id } }} prefetch={false} className="group block overflow-hidden rounded-lg border border-line-dark bg-deep hover:border-paper">
                  <span className="block aspect-[16/10] overflow-hidden">
                    <DesignPicture image={designImage(z.imageIds[0])} alt="" sizes="(min-width: 1024px) 24vw, 40vw" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                  </span>
                  <span className="flex items-center gap-3 px-3 py-3">
                    <span className="xp-chip-no flex-none" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-semibold leading-snug">{z.title[locale]}</span>
                      <span className="mute block text-[0.82rem]">{c(`levels.${z.level}`)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="concept-note mt-4">{c('conceptNote')}</p>
        </div>
      </section>

      {/* 4 — Kids chapter (lighter register) */}
      <section className="sec bg-panel" aria-labelledby="kids-h">
        <div className="wrap">
          <Rail no="03" label={t('kids.rail')} />
          <div className="mt-8 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2 id="kids-h" className="t-1">
                {t('kids.title')}
              </h2>
              <p className="lead mt-5">{t('kids.body')}</p>
              <h3 className="mt-8 !font-sans !text-base !normal-case !tracking-normal font-semibold text-mute">{t('kids.themesTitle')}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {kids.themes[locale].map((x) => (
                  <li key={x} className="rounded-full bg-sand px-4 py-1.5 text-[0.95rem] font-semibold">
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href={registerHref({ program: 'kids', intent: 'program-inquiry', src: 'home' })} className="btn btn-primary">
                  {t('kids.cta')}
                </Link>
                <Link href="/kids" className="link-arrow">
                  {t('kids.more')} {arrow}
                </Link>
              </div>
              <p className="mute mt-4 text-[0.92rem]">{t('kids.guardianNote')}</p>
            </div>
            <div className="lg:col-span-6">
              <FaqList faqs={kids.faqs.slice(0, 3)} locale={locale} />
              <figure className="mt-8">
                <div className="overflow-hidden rounded-[28px] ring-1 ring-line">
                  <DesignPicture image={designImage('d29')} alt={alt('d29')} sizes="(min-width: 1024px) 46vw, 100vw" className="h-auto w-full" />
                </div>
                <figcaption className="mt-3">
                  <span className="block text-[0.92rem] font-semibold">{t('kids.imageCaption')}</span>
                  <span className="concept-note">{c('conceptNote')}</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — Training spectrum (varied scale) */}
      <section className="sec" aria-labelledby="spec-h">
        <div className="wrap">
          <Rail no="04" label={t('spectrum.rail')} />
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 id="spec-h" className="t-2">
                {t('spectrum.title')}
              </h2>
              <p className="mt-4">{t('spectrum.body')}</p>
              <Link href="/programs" className="link-arrow mt-6 inline-block">
                {c('viewPrograms')} {arrow}
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              <Link href={others[0].route} className="on-dark group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-lg bg-ink p-6 text-paper sm:row-span-3">
                <span className="absolute inset-0">
                  {/* The card is taller than 16:9, so the render is drawn about 1100 px wide (600 px on phones): sizes follows the picture, not the box. */}
                  <DesignPicture image={designImage('d42')} alt="" sizes={COVER_TALL_CARD} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
                <span className="relative">
                  <span className="tag text-paper">{c(`availability.${others[0].availability}`)}</span>
                  <span className="display t-3 mt-3 block">{others[0].title[locale]}</span>
                  <span className="mt-2 block text-[0.98rem] text-[#d8d1ca]">{others[0].summary[locale]}</span>
                </span>
              </Link>
              {others.slice(1).map((o) => (
                <Link key={o.id} href={o.route} className="group flex flex-col rounded-lg border border-line bg-panel p-5 hover:border-ink">
                  <span className="text-[0.84rem] font-semibold text-mute">{c(`availability.${o.availability}`)}</span>
                  <span className="mt-1 text-[1.2rem] font-semibold leading-snug">{o.title[locale]}</span>
                  <span className="mute mt-2 text-[0.95rem] leading-relaxed">{o.summary[locale]}</span>
                  <span className="mt-auto pt-3 font-semibold text-accent-ink" aria-hidden="true">
                    <span className="arrow">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 — Membership decision (calm) */}
      <section className="sec border-y border-line bg-sand/50" aria-labelledby="mem-h">
        <div className="wrap grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Rail no="05" label={t('membership.rail')} />
            <h2 id="mem-h" className="t-2 mt-8">
              {t('membership.title')}
            </h2>
            <p className="mt-4 max-w-2xl">{t('membership.body')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:col-span-5 lg:justify-end">
            <Link href={registerHref({ intent: 'membership-consultation', src: 'home' })} className="btn btn-dark">
              {c('registerInterest')}
            </Link>
            <Link href="/memberships" className="link-arrow">
              {t('membership.more')} {arrow}
            </Link>
          </div>
        </div>
      </section>

      {/* 7 — Approach (About folded into the homepage until a verified brand story exists) */}
      <section id="philosophy" className="sec scroll-mt-20" aria-labelledby="phil-h">
        <div className="wrap">
          <Rail no="06" label={t('philosophy.rail')} />
          <h2 id="phil-h" className="t-2 mt-8 max-w-3xl">
            {t('philosophy.title')}
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {(['one', 'two', 'three'] as const).map((k, i) => (
              <li key={k} className="border-t-4 border-ink pt-4">
                <span className="ltr font-[family-name:var(--font-latin)] text-accent-ink">{`0${i + 1}`}</span>
                <p className="mt-1 text-[1.25rem] font-semibold">{t(`philosophy.items.${k}.t`)}</p>
                <p className="mute mt-2">{t(`philosophy.items.${k}.d`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 8 — Closing invitation over the mezzanine view */}
      <div className="chevron-band" aria-hidden="true" />
      <section className="on-dark dark-sec relative overflow-hidden" aria-labelledby="close-h">
        <div className="absolute inset-0" aria-hidden="true">
          <DesignPicture image={designImage('d48')} alt="" sizes="100vw" className="h-full w-full object-cover opacity-45" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50" />
        </div>
        <div className="wrap sec relative">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h2 id="close-h" className="t-1">
                {t('closing.title')}
              </h2>
              <p className="lead mt-4 max-w-2xl">{t('closing.body')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:col-span-4 lg:justify-end">
              <Link href={registerHref({ src: 'home' })} className="btn btn-primary">
                {c('registerInterest')}
              </Link>
              <Link href="/contact" className="link-arrow">
                {t('closing.contact')}
              </Link>
            </div>
          </div>
          <p className="concept-note mt-10">{c('conceptNote')}</p>
        </div>
      </section>
    </>
  );
}
