import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { detailPrograms } from '@/content';
import { ProgramHero, ProgramSections } from '@/features/programs/ProgramSections';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

export const dynamicParams = false;
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => detailPrograms.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const program = detailPrograms.find((p) => p.slug === slug);
  if (!program) return {};
  const m = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: program.route, title: program.title[locale], description: program.summary[locale], siteName: m('siteName') });
}

export default async function ProgramPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const program = detailPrograms.find((p) => p.slug === slug);
  if (!program) notFound();
  const c = await getTranslations({ locale, namespace: 'common' });
  const t = await getTranslations({ locale, namespace: 'programs' });
  return (
    <>
      <ProgramHero
        eyebrow={program.id === 'calisthenics' ? t('flagship') : c(`availability.${program.availability}`)}
        title={program.title[locale]}
        summary={program.summary[locale]}
        zoneId={program.zoneIds[0]}
        imageAlt={program.zoneIds[0] ? c(`sceneAlt.${program.zoneIds[0]}` as 'sceneAlt.club') : undefined}
        note={c('conceptNote')}
      />
      <ProgramSections program={program} locale={locale} source="program" />
    </>
  );
}
