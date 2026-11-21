import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Program } from '@/lib/catalog/types';
import { designImage, membershipsForProgram, pathwaysFor, registerHref, zoneById } from '@/content';
import { FaqList } from '@/components/ui/Faq';
import { DesignPicture } from '@/components/ui/DesignPicture';
import { MembershipCta } from '@/features/memberships/MembershipCta';
import { ProgramView } from './ProgramView';

/** Shared body for every program page, driven entirely by the program record. */
export async function ProgramSections({ program, locale, source }: { program: Program; locale: Locale; source: string }) {
  const t = await getTranslations({ locale, namespace: 'programs' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const pws = pathwaysFor(program.id);
  const zones = program.zoneIds.map((id) => zoneById(id)!).filter(Boolean);
  const mems = membershipsForProgram(program.id, locale);

  return (
    <>
      <ProgramView programId={program.id} locale={locale} />
      <section className="sec">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="lead">{program.positioning[locale]}</p>

            <h2 className="t-3 mt-12">{t('themes')}</h2>
            <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {program.themes[locale].map((x) => (
                <li key={x} className="flex gap-3 border-t border-line py-3 font-semibold">
                  <span aria-hidden="true" className="mt-[0.72em] h-[3px] w-4 flex-none bg-accent" />
                  {x}
                </li>
              ))}
            </ul>

            <h2 className="t-3 mt-12">{t('benefits')}</h2>
            <ul className="mt-4 space-y-2">
              {program.benefits[locale].map((x) => (
                <li key={x} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.55em] h-2.5 w-2.5 flex-none rotate-45 border-2 border-steel" />
                  {x}
                </li>
              ))}
            </ul>

            {program.boundaries && (
              <div className="mt-12 rounded-lg border-2 border-ink p-6">
                <h2 className="t-3">{t('boundaries')}</h2>
                <ul className="mt-4 space-y-2">
                  {program.boundaries[locale].map((x) => (
                    <li key={x} className="flex gap-3">
                      <span aria-hidden="true" className="mt-[0.75em] h-[3px] w-4 flex-none bg-ink" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-lg bg-ink p-6 text-paper on-dark lg:sticky lg:top-24">
              <dl className="space-y-4">
                <div>
                  <dt className="text-[0.85rem] font-semibold text-mute-dark">{t('status')}</dt>
                  <dd className="font-semibold">{c(`availability.${program.availability}`)}</dd>
                </div>
                <div>
                  <dt className="text-[0.85rem] font-semibold text-mute-dark">{t('audience')}</dt>
                  <dd>{program.audienceNote[locale]}</dd>
                </div>
                {mems.length > 0 && (
                  <div>
                    <dt className="text-[0.85rem] font-semibold text-mute-dark">{t('membershipTitle')}</dt>
                    <dd className="space-y-3">
                      {mems.map((m) => (
                        <MembershipCta key={m.id} membership={m} locale={locale} programId={program.id} source={source} compact />
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              <Link href={registerHref({ program: program.id, intent: program.ctaIntent, src: source })} className="btn btn-primary mt-6 w-full" data-testid="program-cta">
                {c('registerInterest')}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {pws.length > 0 && (
        <section className="sec border-t border-line bg-panel">
          <div className="wrap">
            <h2 className="t-2">{t('pathways')}</h2>
            <p className="mute mt-2 text-[0.95rem]">{t('pathwaysNote')}</p>
            <ol className="prog mt-8" tabIndex={0} aria-label={t('pathways')}>
              {pws.map((pw, i) => (
                <li key={pw.id}>
                  <span className="ltr font-[family-name:var(--font-latin)] text-[0.95rem] text-accent-ink">{String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-1 text-[1.12rem] font-semibold leading-snug">{pw.title[locale]}</p>
                  <p className="mute mt-1 text-[0.95rem] leading-relaxed">{pw.summary[locale]}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="on-dark dark-sec sec">
        <div className="wrap">
          <h2 className="t-2">{t('zones')}</h2>
          {zones.length === 0 ? (
            <p className="mute mt-4">{t('noZone')}</p>
          ) : (
            <ul className={`mt-8 grid gap-6 ${zones.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {zones.map((z) => (
                <li key={z.id} className={`overflow-hidden rounded-lg border border-line-dark bg-deep ${zones.length === 1 ? 'md:grid md:grid-cols-2 md:items-center' : ''}`}>
                  <div className="aspect-video">
                    <DesignPicture image={designImage(z.imageIds[0])} alt={designImage(z.imageIds[0]).alt[locale]} sizes="(min-width: 768px) 48vw, 100vw" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5">
                    <p className="eyebrow">{c(`levels.${z.level}`)}</p>
                    <h3 className="mt-1 !font-sans !text-[1.2rem] !normal-case !tracking-normal font-semibold">{z.title[locale]}</h3>
                    <p className="mute mt-2">{z.summary[locale]}</p>
                    <Link href={{ pathname: '/explore', query: { zone: z.id } }} className="link-arrow mt-3 inline-flex min-h-11 items-center">
                      {t('seeInTour')}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="concept-note mt-5">{c('conceptNote')}</p>
        </div>
      </section>

      {program.faqs.length > 0 && (
        <section className="sec">
          <div className="wrap grid gap-6 lg:grid-cols-12">
            <h2 className="t-2 lg:col-span-4">{t('faq')}</h2>
            <div className="lg:col-span-8">
              <FaqList faqs={program.faqs} locale={locale} />
              <Link href={registerHref({ program: program.id, intent: program.ctaIntent, src: source })} className="btn btn-dark mt-8">
                {c('registerInterest')}
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function ProgramHero({
  eyebrow,
  title,
  summary,
  children,
  imageId,
  imageAlt,
  note,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children?: React.ReactNode;
  imageId?: string;
  imageAlt?: string;
  note?: string;
}) {
  return (
    <section className="on-dark dark-sec blueprint">
      <div className="wrap grid items-center gap-8 pb-12 pt-10 lg:grid-cols-12 lg:pb-16 lg:pt-14">
        <div className={imageId ? 'lg:col-span-6' : 'lg:col-span-12'}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="t-1 mt-3 max-w-4xl">{title}</h1>
          <div className="bar mt-6 w-[min(100%,360px)] text-paper" aria-hidden="true" />
          <p className="lead mt-9 max-w-2xl">{summary}</p>
          {children}
        </div>
        {imageId && (
          <figure className="lg:col-span-6">
            <div className="overflow-hidden rounded-lg border border-line-dark bg-deep">
              <DesignPicture image={designImage(imageId)} alt={imageAlt ?? ''} sizes="(min-width: 1024px) 48vw, 100vw" priority className="h-auto w-full" />
            </div>
            {note && <figcaption className="concept-note mt-3">{note}</figcaption>}
          </figure>
        )}
      </div>
    </section>
  );
}
