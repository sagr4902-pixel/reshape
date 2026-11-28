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

  return (
    <>
      <section className="on-dark dark-sec blueprint">
        <div className="wrap pb-10 pt-10 lg:pt-14">
          <h1 className="t-1">{t('title')}</h1>
          <p className="lead mt-4 max-w-2xl">{t('intro')}</p>
        </div>
      </section>

      {(['adult', 'kids', 'extra'] as const).map((g, gi) => {
        const items = plans.filter((m) => m.group === g);
        if (items.length === 0) return null;
        const progs = items[0].programIds.map((id) => programById(id)!).filter(Boolean);
        return (
          <section key={g} className={`sec ${gi % 2 ? 'border-y border-line bg-sand/50' : ''}`} aria-labelledby={`plans-${g}`}>
            <div className="wrap">
              <h2 id={`plans-${g}`} className="t-2">
                {t(`groups.${g}.title`)}
              </h2>
              <p className="lead mt-3 max-w-3xl">{t(`groups.${g}.body`)}</p>
              {progs.length > 0 && (
                <p className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-mute">{t('includes')}</span>
                  {progs.map((p) => (
                    <Link key={p.id} href={p.route} className="rounded-full border border-ink px-3 py-1 text-[0.92rem] font-semibold hover:bg-ink hover:text-paper">
                      {p.shortTitle[locale]}
                    </Link>
                  ))}
                </p>
              )}
              <ul className={`mt-8 grid gap-5 sm:grid-cols-2 ${items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                {items.map((m) => (
                  <li key={m.id} className="flex flex-col rounded-lg border border-line bg-panel p-6 hover:border-ink">
                    <MembershipCta membership={m} locale={locale} source="memberships" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section className="sec border-t border-line bg-panel">
        <div className="wrap grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <h2 className="t-3">{t('storeTitle')}</h2>
            <p className="mt-3 max-w-2xl">{t('storeBody')}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
            <ExternalLink href={site.channels.store.url} event="membership_outbound_click" location="memberships-store" className="btn btn-line">
              {t('storeCta')}
              <span className="sr-only"> ({c('opensNewTab')})</span>
            </ExternalLink>
            <Link href={registerHref({ intent: 'membership-consultation', src: 'memberships' })} className="btn btn-dark">
              {t('helpCta')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
