import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { env } from '@/lib/env';
import { designImage, offer, offerState, programById, registerHref } from '@/content';
import { Rail } from '@/components/ui/Rail';
import { DesignPicture } from '@/components/ui/DesignPicture';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { FacadeHero } from '@/features/home/FacadeHero';
import { Countdown } from '@/features/offer/Countdown';
import { OfferBar } from '@/features/offer/OfferBar';
import { Beyond, Coaches, Gallery, Identity, Method, Outcomes, Schedule, Team } from '@/features/home/ClubSections';

type Props = { params: Promise<{ locale: Locale }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '', title: t('titleDefault'), description: t('description'), siteName: t('siteName'), absoluteTitle: true });
}

/** A tight, darkened crop of one design detail: a glimpse, not a view of the club. */
function Teaser({ id, locale, wide = false }: { id: string; locale: Locale; wide?: boolean }) {
  const img = designImage(id);
  return (
    <div className={`teaser ${wide ? 'teaser-wide' : ''}`}>
      <DesignPicture image={img} alt={img.alt[locale]} sizes="(min-width: 1024px) 44vw, 100vw" className="h-full w-full object-cover" />
    </div>
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const e = env();
  const preopening = e.launchStage === 'preopening';
  const state = offerState(offer, e.appEnv);
  const preview = e.appEnv !== 'production';
  const sports = ['calisthenics', 'hybrid-endurance', 'functional-training'].map((id) => programById(id)!);
  const arrow = <span className="arrow" aria-hidden="true">→</span>;
  const tick = <span aria-hidden="true" className="mt-[0.72em] h-[3px] w-4 flex-none bg-accent" />;
  const price = (n: number) => new Intl.NumberFormat('en-US').format(n);

  return (
    <>
      {(state.kind === 'announced' || state.kind === 'live') && (
        <OfferBar endsAt={state.endsAt} title={offer.title[locale]} cta={state.kind === 'live' ? t('offer.cta') : t('offer.ctaInterest')} dayLabel={t('offer.days')} />
      )}
      {/* 1 — The facade, exactly as designed */}
      <FacadeHero alt={designImage('facade').alt[locale]} facadeLabel={t('hero.facadeLabel')} note={c('conceptNote')}>
        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{t('hero.eyebrow')}</span>
          {preopening && <span className="tag text-paper">{c('preopening')}</span>}
        </p>
        <h1 className="t-hero mt-3">{t('hero.title')}</h1>
        <div className="bar mt-5 w-[min(100%,300px)] text-paper" aria-hidden="true" />
        <p className="lead max-w-xl">{t('hero.sub')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#offer" className="btn btn-primary" data-testid="hero-offer">
            {t('hero.ctaOffer')}
          </a>
          <a href="#about" className="btn btn-line">
            {t('hero.ctaAbout')}
          </a>
        </div>
      </FacadeHero>
      <div className="chevron-band chevron-run" aria-hidden="true" />
      {/* Moving strip of what the club is about (decorative: every item is said in full below) */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <ul key={k}>
              {[...sports.map((p) => p.shortTitle[locale]), 'Re.Build', 'Re.Create', 'Re.Shape', t('hybrid.rail'), t('zone.items.one.t'), t('juice.rail')].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* 2 — Who we are */}
      <section id="about" className="sec scroll-mt-20" aria-labelledby="about-h">
        <div className="wrap">
          <Rail no="01" label={t('about.rail')} />
          <h2 id="about-h" className="t-1 mt-8 max-w-3xl">
            {t('about.title')}
          </h2>
          <p className="lead mt-5 max-w-3xl">{t('about.body')}</p>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {(['one', 'two', 'three'] as const).map((k, i) => (
              <li key={k} className="border-t-4 border-ink pt-4">
                <span className="ltr font-[family-name:var(--font-latin)] text-accent-ink">{`0${i + 1}`}</span>
                <p className="mt-1 text-[1.25rem] font-semibold">{t(`about.points.${k}.t`)}</p>
                <p className="mute mt-2">{t(`about.points.${k}.d`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Identity: the Re. vocabulary and what we believe */}
      <Identity locale={locale} no="02" />

      {/* 3 — Variety: choose your sport */}
      <section className="on-dark dark-sec sec" aria-labelledby="sports-h">
        <div className="wrap">
          <Rail no="03" label={t('sports.rail')} />
          <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h2 id="sports-h" className="t-1">
                {t('sports.title')}
              </h2>
              <p className="lead mt-4 max-w-2xl">{t('sports.body')}</p>
            </div>
            <div className="lg:col-span-4 lg:text-end">
              <Link href="/programs" className="btn btn-line">
                {t('sports.all')} {arrow}
              </Link>
            </div>
          </div>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {sports.map((p, i) => (
              <li key={p.id}>
                <Link href={p.route} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line-dark bg-coal hover:border-paper">
                  <span className="teaser teaser-card">
                    <DesignPicture image={designImage(p.imageId)} alt="" sizes="(min-width: 768px) 32vw, 100vw" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                  </span>
                  <span className="flex flex-1 flex-col p-5">
                    <span className="ltr font-[family-name:var(--font-latin)] text-accent">{`0${i + 1}`}</span>
                    <span className="display t-3 mt-1 block">{p.title[locale]}</span>
                    <span className="mt-2 block text-[0.98rem] text-[#d8d1ca]">{p.summary[locale]}</span>
                    <span className="mt-auto pt-4 font-semibold text-accent" aria-hidden="true">
                      <span className="arrow">→</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link href="/kids" className="link-arrow">
              {t('sports.kids')} {arrow}
            </Link>
          </p>
        </div>
      </section>

      {/* How we work with a member: never lost */}
      <Method locale={locale} no="04" />

      {/* 5 — Hybrid */}
      <section className="sec border-y border-line bg-sand/50" aria-labelledby="hybrid-h">
        <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:order-2 lg:col-span-6">
            <Rail no="05" label={t('hybrid.rail')} />
            <h2 id="hybrid-h" className="t-1 mt-8">
              {t('hybrid.title')}
            </h2>
            <p className="lead mt-5">{t('hybrid.body')}</p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label={t('hybrid.tag')}>
              {sports.map((p) => (
                <li key={p.id} className="rounded-full border border-ink px-4 py-1.5 text-[0.95rem] font-semibold">
                  {p.shortTitle[locale]}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:order-1 lg:col-span-6">
            <Teaser id="t-turf" locale={locale} />
          </div>
        </div>
      </section>

      {/* 6 — The training zone: the warrior */}
      <section className="on-dark dark-sec sec" aria-labelledby="zone-h">
        <div className="wrap">
          <Rail no="06" label={t('zone.rail')} />
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <h2 id="zone-h" className="t-1">
                {t('zone.title')}
              </h2>
              <p className="lead mt-5">{t('zone.body')}</p>
            </div>
            <div className="lg:col-span-6">
              <Teaser id="t-warrior" locale={locale} wide />
            </div>
          </div>
          <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {(['one', 'two', 'three', 'four'] as const).map((k) => (
              <li key={k} className="border-t-2 border-accent pt-4">
                <p className="text-[1.15rem] font-semibold">{t(`zone.items.${k}.t`)}</p>
                <p className="mt-2 text-[0.98rem] text-[#d8d1ca]">{t(`zone.items.${k}.d`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What changes, member stories, coaches, the team, live moments, and what surrounds the training */}
      <Outcomes locale={locale} no="07" preview={preview} />
      <Coaches locale={locale} no="08" preview={preview} />
      <Team locale={locale} no="09" preview={preview} />
      <Gallery locale={locale} no="10" preview={preview} />
      <Beyond locale={locale} no="11" preview={preview} />

      {/* 7 — Juice bar */}
      <section className="sec" aria-labelledby="juice-h">
        <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <Rail no="12" label={t('juice.rail')} />
            <h2 id="juice-h" className="t-1 mt-8">
              {t('juice.title')}
            </h2>
            <p className="lead mt-5">{t('juice.body')}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {(['one', 'two', 'three', 'four'] as const).map((k) => (
                <li key={k} className="rounded-full bg-sand px-4 py-1.5 text-[0.95rem] font-semibold">
                  {t(`juice.chips.${k}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <Teaser id="t-juice" locale={locale} />
          </div>
        </div>
      </section>

      {/* 8 — Facilities */}
      <section className="sec border-t border-line bg-sand/50" aria-labelledby="fac-h">
        <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="grid grid-cols-2 gap-4 lg:order-1 lg:col-span-6">
            <Teaser id="t-vanity" locale={locale} />
            <Teaser id="t-lockers" locale={locale} />
          </div>
          <div className="lg:order-2 lg:col-span-6">
            <Rail no="13" label={t('facilities.rail')} />
            <h2 id="fac-h" className="t-1 mt-8">
              {t('facilities.title')}
            </h2>
            <p className="lead mt-5">{t('facilities.body')}</p>
            <ul className="mt-6">
              {(['one', 'two', 'three'] as const).map((k) => (
                <li key={k} className="flex gap-3 border-t border-line py-3 font-semibold">
                  {tick}
                  {t(`facilities.items.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="wrap concept-note mt-10">{t('offer.teaserNote')}</p>
      </section>

      <Schedule locale={locale} no="14" preview={preview} />

      {/* 9 — The offer */}
      <div className="chevron-band chevron-run" aria-hidden="true" />
      <section id="offer" className="on-dark dark-sec sec offer scroll-mt-16" aria-labelledby="offer-h" data-offer={state.kind}>
        <div className="wrap">
          <Rail no="15" label={t('offer.rail')} />
          {state.kind === 'none' ? (
            <div className="mt-8 max-w-2xl">
              <h2 id="offer-h" className="t-1">
                {t('offer.soonTitle')}
              </h2>
              <p className="lead mt-4">{t('offer.soonBody')}</p>
              <Link href={registerHref({ src: 'home' })} className="btn btn-primary mt-8">
                {c('registerInterest')}
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-6">
                <h2 id="offer-h" className="t-1">
                  {offer.title[locale]}
                </h2>
                <p className="lead mt-4">{offer.summary[locale]}</p>
                <ul className="mt-6">
                  {offer.includes[locale].map((x) => (
                    <li key={x} className="flex gap-3 border-t border-line-dark py-3 font-semibold">
                      {tick}
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="offer-card lg:col-span-6">
                {state.kind === 'sample' && (
                  <p className="offer-draft" data-testid="offer-draft">
                    {t('offer.draftNote')}
                  </p>
                )}
                {state.kind !== 'announced' && (
                  <p className="offer-price">
                    <span className="sr-only">{t('offer.priceLabel')}: </span>
                    <span className="offer-amount ltr">{state.kind === 'live' ? price(state.priceSar) : '—'}</span>
                    <span className="offer-currency">{t('offer.currency')}</span>
                    {state.kind === 'live' && state.originalPriceSar && (
                      <span className="offer-was">
                        {t('offer.wasLabel')} <s className="ltr">{price(state.originalPriceSar)}</s>
                      </span>
                    )}
                  </p>
                )}
                <Countdown
                  endsAt={state.endsAt}
                  labels={{ title: t('offer.endsIn'), days: t('offer.days'), hours: t('offer.hours'), minutes: t('offer.minutes'), seconds: t('offer.seconds') }}
                  ended={
                    <>
                      <p className="lead">{t('offer.ended')}</p>
                      <Link href={registerHref({ src: 'home' })} className="btn btn-primary mt-6">
                        {c('registerInterest')}
                      </Link>
                    </>
                  }
                >
                  {state.kind === 'live' ? (
                    <>
                      <ExternalLink href={state.payUrl} event="membership_outbound_click" location="home-offer" className="btn btn-primary w-full justify-center text-[1.1rem]">
                        {t('offer.cta')} {arrow}
                      </ExternalLink>
                      <p className="mt-3 text-[0.9rem] text-[#b9b2ab]">{t('offer.storeNote')}</p>
                    </>
                  ) : state.kind === 'announced' ? (
                    <>
                      <Link href={registerHref({ intent: 'membership-consultation', src: 'home' })} className="btn btn-primary w-full justify-center text-[1.1rem]" data-testid="offer-cta-interest">
                        {t('offer.ctaInterest')} {arrow}
                      </Link>
                      <p className="mt-3 text-[0.9rem] text-[#b9b2ab]">{t('offer.pendingNote')}</p>
                    </>
                  ) : (
                    <span className="btn btn-primary w-full justify-center text-[1.1rem]" aria-disabled="true" data-testid="offer-cta-sample">
                      {t('offer.cta')} {arrow}
                    </span>
                  )}
                </Countdown>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
