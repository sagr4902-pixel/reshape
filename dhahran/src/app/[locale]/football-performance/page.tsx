import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { designImage, programById, registerHref } from '@/content';
import { ProgramHero, ProgramSections } from '@/features/programs/ProgramSections';

type Props = { params: Promise<{ locale: Locale }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'football' });
  const m = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/football-performance', title: t('metaTitle'), description: t('metaDescription'), siteName: m('siteName') });
}

export default async function FootballPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'football' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const program = programById('football-performance')!;
  const cta = registerHref({ program: program.id, intent: 'membership-consultation', src: 'football' });
  return (
    <>
      <ProgramHero eyebrow={t('eyebrow')} title={program.title[locale]} summary={program.summary[locale]} imageId={program.imageId} imageAlt={designImage(program.imageId).alt[locale]} note={c('conceptNote')}>
        <Link href={cta} className="btn btn-primary mt-8" data-testid="football-cta">
          {t('cta')}
        </Link>
      </ProgramHero>
      <section className="border-b border-line bg-panel py-12">
        <div className="wrap">
          <h2 className="t-3">{t('processTitle')}</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {(['one', 'two', 'three'] as const).map((k, i) => (
              <li key={k} className="border-t-4 border-ink pt-4">
                <span className="ltr font-[family-name:var(--font-latin)] text-accent-ink">{`0${i + 1}`}</span>
                <p className="mt-1 text-[1.15rem] font-semibold">{t(`process.${k}.t`)}</p>
                <p className="mute mt-1">{t(`process.${k}.d`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <ProgramSections program={program} locale={locale} source="football" />
    </>
  );
}
