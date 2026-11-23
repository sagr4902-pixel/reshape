import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { designImage, programById, registerHref } from '@/content';
import { DesignPicture } from '@/components/ui/DesignPicture';
import { FaqList } from '@/components/ui/Faq';
import { ProgramView } from '@/features/programs/ProgramView';

type Props = { params: Promise<{ locale: Locale }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'kids' });
  const m = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/kids', title: t('metaTitle'), description: t('metaDescription'), siteName: m('siteName') });
}

/** Main parent conversion page — lighter visual register, guardian-first language. */
export default async function KidsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'kids' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const kids = programById('kids')!;
  const martial = programById('kids-martial-arts')!;
  const cta = registerHref({ program: 'kids', intent: 'program-inquiry', src: 'kids' });

  return (
    <>
      <ProgramView programId="kids" locale={locale} />
      <section className="bg-panel">
        <div className="wrap grid items-center gap-8 pb-12 pt-10 lg:grid-cols-12 lg:pb-16 lg:pt-14">
          <div className="lg:col-span-5">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="t-1 mt-3">{t('title')}</h1>
            <div className="bar mt-6 w-[min(100%,320px)]" aria-hidden="true" />
            <p className="lead mt-9">{kids.summary[locale]}</p>
            <p className="mt-4">{kids.positioning[locale]}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={cta} className="btn btn-primary" data-testid="kids-cta">
                {t('cta')}
              </Link>
            </div>
            <p className="mute mt-4 text-[0.92rem]">{kids.audienceNote[locale]}</p>
          </div>
          <figure className="lg:col-span-7">
            <div className="overflow-hidden rounded-[32px] ring-1 ring-line">
              <DesignPicture image={designImage(kids.imageId)} alt={designImage(kids.imageId).alt[locale]} sizes="(min-width: 1024px) 56vw, 100vw" priority className="h-auto w-full" />
            </div>
            <figcaption className="mt-3">
              <span className="concept-note">{c('conceptNote')}</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="t-2">{locale === 'ar' ? 'ماذا يتدرّب الطفل؟' : 'What children train'}</h2>
              <ul className="mt-6">
                {kids.themes[locale].map((x, i) => (
                  <li key={x} className="flex items-baseline gap-4 border-t border-line py-4 text-[1.15rem] font-semibold">
                    <span className="ltr font-[family-name:var(--font-latin)] text-accent-ink">{`0${i + 1}`}</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7">
              <h2 className="t-2">{t('howTitle')}</h2>
              <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                {(['one', 'two', 'three'] as const).map((k, i) => (
                  <li key={k} className={`rounded-[22px] p-5 ${['bg-sand', 'bg-[#f7d9c4]', 'bg-[#d5e4dd]'][i]}`}>
                    <p className="text-[1.15rem] font-semibold">{t(`how.${k}.t`)}</p>
                    <p className="mt-2 text-[0.98rem]">{t(`how.${k}.d`)}</p>
                  </li>
                ))}
              </ol>
              <p className="mute mt-4 text-[0.92rem]">{t('howNote')}</p>
              <ul className="mt-8 space-y-2">
                {kids.benefits[locale].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.55em] h-2.5 w-2.5 flex-none rotate-45 border-2 border-steel" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="sec border-y border-line bg-panel">
        <div className="wrap grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="t-2">{t('parentTitle')}</h2>
            <div className="mt-6 rounded-lg border-2 border-ink p-5">
              <h3 className="!font-sans !text-[1.05rem] !normal-case !tracking-normal font-semibold">{t('dataTitle')}</h3>
              <p className="mt-2 text-[0.98rem]">{t('dataBody')}</p>
            </div>
          </div>
          <div className="lg:col-span-8">
            <FaqList faqs={kids.faqs} locale={locale} />
            <Link href={cta} className="btn btn-primary mt-8">
              {t('cta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <p className="tag">{c(`availability.${martial.availability}`)}</p>
            <h2 className="t-2 mt-3">{t('martialTitle')}</h2>
            <p className="mt-3 max-w-2xl">{martial.positioning[locale]}</p>
          </div>
          <div className="lg:col-span-4 lg:text-end">
            <Link href={martial.route} className="btn btn-line">
              {c('viewProgram')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
