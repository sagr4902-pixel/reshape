import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { programById, publicMemberships, registerHref, site } from '@/content';
import { MembershipCta } from '@/features/memberships/MembershipCta';
import { ExternalLink } from '@/components/ui/ExternalLink';

type Props = { params: Promise<{ locale: Locale }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

// Re-evaluate freshness rules hourly so a stale verified price is withdrawn without a redeploy.
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'memberships' });
  const m = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/memberships', title: t('metaTitle'), description: t('metaDescription'), siteName: m('siteName') });
}

export default async function MembershipsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'memberships' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const plans = publicMemberships(locale);
  const facts = ['price', 'open', 'pay', 'now'] as const;

  return (
    <>
      <section className="on-dark dark-sec blueprint">
        <div className="wrap pb-10 pt-10 lg:pt-14">
          <h1 className="t-1">{t('title')}</h1>
          <p className="lead mt-4 max-w-2xl">{t('intro')}</p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="t-2">{t('plansTitle')}</h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-2">
              {plans.map((m) => (
                <li key={m.id} className="flex flex-col rounded-lg border border-line bg-panel p-6">
                  <MembershipCta membership={m} locale={locale} source="memberships" />
                  <p className="mt-6 border-t border-line pt-4 text-[0.9rem] font-semibold text-mute">{t('includes')}</p>
                  <ul className="mt-1">
                    {m.programIds.map((id) => {
                      const p = programById(id)!;
                      return (
                        <li key={id}>
                          <Link href={p.route} className="inline-flex min-h-10 items-center underline decoration-line decoration-2 hover:decoration-accent">
                            {p.title[locale]}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-2xl">{t('why')}</p>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-lg bg-sand/60 p-6">
              <h2 className="t-3">{t('factsTitle')}</h2>
              <dl className="mt-4 divide-y divide-line">
                {facts.map((k) => (
                  <div key={k} className="py-3">
                    <dt className="text-[0.88rem] font-semibold text-mute">{t(`facts.${k}.k`)}</dt>
                    <dd className="font-semibold">{t(`facts.${k}.v`)}</dd>
                  </div>
                ))}
              </dl>
              <Link href={registerHref({ intent: 'membership-consultation', src: 'memberships' })} className="btn btn-primary mt-4 w-full">
                {c('registerInterest')}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Clearly separate: the existing store, with no claim of Dhahran eligibility */}
      <section className="sec border-t border-line bg-panel">
        <div className="wrap grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <h2 className="t-3">{t('storeTitle')}</h2>
            <p className="mt-3 max-w-2xl">{t('storeBody')}</p>
          </div>
          <div className="lg:col-span-4 lg:text-end">
            <ExternalLink href={site.channels.store.url} event="membership_outbound_click" location="memberships-store" className="btn btn-line">
              {t('storeCta')}
              <span className="sr-only"> ({c('opensNewTab')})</span>
            </ExternalLink>
          </div>
        </div>
      </section>
    </>
  );
}
