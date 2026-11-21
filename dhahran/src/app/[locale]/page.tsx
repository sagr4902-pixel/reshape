import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { env } from '@/lib/env';
import { pathwaysFor, programById, registerHref, scene } from '@/content';
import { Rail } from '@/components/ui/Rail';
import { ClubScene, ZoneScene } from '@/components/ui/Scene';
import { FaqList } from '@/components/ui/Faq';

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

  return (
    <>
      {/* 1 — Entrance hero */}
      <section className="on-dark dark-sec blueprint relative overflow-hidden">
        <div className="wrap grid items-center gap-8 pb-10 pt-10 lg:grid-cols-12 lg:gap-4 lg:pb-16 lg:pt-14">
          <div className="relative z-10 lg:col-span-5">
            <p className="eyebrow flex flex-wrap items-center gap-3">
              <span>{t('hero.eyebrow')}</span>
              {preopening && <span className="tag text-paper">{c('preopening')}</span>}
            </p>
            <h1 className="t-hero mt-4">{t('hero.title')}</h1>
            <div className="bar mt-6 w-[min(100%,420px)] text-paper" aria-hidden="true" />
            <p className="lead mt-9 max-w-xl">{t('hero.sub')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={registerHref({ src: 'home' })} className="btn btn-primary">
                {c('registerInterest')}
              </Link>
              <Link href="/explore" className="btn btn-line">
                {c('exploreClub')} {arrow}
              </Link>
            </div>
            {preopening && <p className="mute mt-6 max-w-md text-[0.95rem]">{t('hero.stage')}</p>}
          </div>
          <div className="lg:col-span-7">
            <div className="relative lg:-me-[9vw]" dir="ltr">
              <ClubScene alt={c('sceneAlt.club')} priority className="h-auto w-full" />
            </div>
            <p className="concept-note mt-3">{c('conceptNote')}</p>
          </div>
        </div>
      </section>

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
              <div className="overflow-hidden rounded-lg bg-ink" dir="ltr">
                <ZoneScene zoneId="calisthenics-hall" alt={c('sceneAlt.calisthenics-hall')} className="h-auto w-full" />
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

      {/* 3 — Interactive club preview */}
      <section className="on-dark dark-sec sec" aria-labelledby="tour-h">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Rail no="02" label={t('tour.rail')} />
            <h2 id="tour-h" className="t-2 mt-8">
              {t('tour.title')}
            </h2>
            <p className="mt-5">{t('tour.body')}</p>
            <Link href="/explore" className="btn btn-primary mt-7">
              {t('tour.cta')} {arrow}
            </Link>
          </div>
          <div className="lg:col-span-8">
            <ul aria-label={t("tour.zonesLabel")} className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {scene.zones.map((z, i) => (
                <li key={z.id}>
                  <Link href={{ pathname: '/explore', query: { zone: z.id } }} className="group block overflow-hidden rounded-lg border border-line-dark bg-deep hover:border-paper">
                    <span className="block" dir="ltr">
                      <ZoneScene zoneId={z.id} alt="" className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.04]" />
                    </span>
                    <span className="flex items-center gap-3 px-4 py-3">
                      <span className="xp-chip-no flex-none" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block font-semibold leading-snug">{z.title[locale]}</span>
                        <span className="mute block text-[0.85rem]">{c(`levels.${z.level}`)}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="concept-note mt-4">{c('conceptNote')}</p>
          </div>
        </div>
      </section>

      {/* 4 — Kids pavilion (lighter register) */}
      <section className="sec bg-panel" aria-labelledby="kids-h">
        <div className="wrap">
          <Rail no="03" label={t('kids.rail')} />
          <div className="mt-8 grid gap-10 lg:grid-cols-12">
            <figure className="lg:col-span-7">
              <div className="overflow-hidden rounded-[28px] bg-white ring-1 ring-line" dir="ltr">
                <ZoneScene zoneId="kids-pavilion" theme="light" alt={c('sceneAlt.kids-pavilion')} className="h-auto w-full" />
              </div>
              <figcaption className="concept-note mt-3">{c('conceptNote')}</figcaption>
            </figure>
            <div className="lg:col-span-5">
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
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-12">
            <h3 className="t-3 lg:col-span-4">{t('kids.parentTitle')}</h3>
            <div className="lg:col-span-8">
              <FaqList faqs={kids.faqs.slice(0, 3)} locale={locale} />
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
                <span className="absolute inset-0" dir="ltr">
                  <ZoneScene zoneId="track-loop" alt="" className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.04]" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
                <span className="relative">
                  <span className="tag text-paper">{c(`availability.${others[0].availability}`)}</span>
                  <span className="display t-3 mt-3 block">{others[0].title[locale]}</span>
                  <span className="mt-2 block text-[0.98rem] text-mute-dark">{others[0].summary[locale]}</span>
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

      {/* 8 — Closing invitation */}
      <section className="on-dark dark-sec sec" aria-labelledby="close-h">
        <div className="wrap">
          <div className="bar w-full text-paper" aria-hidden="true" />
          <div className="mt-14 grid gap-6 lg:grid-cols-12 lg:items-end">
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
        </div>
      </section>
    </>
  );
}
