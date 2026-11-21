import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { registerHref, site } from '@/content';
import { ExternalLink } from '@/components/ui/ExternalLink';

type Props = { params: Promise<{ locale: Locale }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const m = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/contact', title: t('metaTitle'), description: t('metaDescription'), siteName: m('siteName') });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const rows = [
    { label: t('whatsapp'), value: site.channels.whatsapp.e164, href: site.channels.whatsapp.url, event: 'contact_click' as const },
    { label: t('instagram'), value: site.channels.instagram.handle, href: site.channels.instagram.url, event: 'contact_click' as const },
    { label: t('store'), value: 'reshape-sa.com', href: site.channels.store.url, event: 'membership_outbound_click' as const },
  ];
  return (
    <>
      <section className="on-dark dark-sec blueprint">
        <div className="wrap pb-10 pt-10 lg:pt-14">
          <h1 className="t-1">{t('title')}</h1>
          <p className="lead mt-4 max-w-2xl">{t('intro')}</p>
          <Link href={registerHref({ src: 'contact' })} className="btn btn-primary mt-8">
            {c('registerInterest')}
          </Link>
        </div>
      </section>
      <section className="sec">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="t-3">{t('channelsTitle')}</h2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {rows.map((r) => (
                <li key={r.href}>
                  <ExternalLink href={r.href} event={r.event} location="contact" className="group flex min-h-16 items-center justify-between gap-4 py-3 hover:text-accent-ink">
                    <span className="text-[1.1rem] font-semibold">{r.label}</span>
                    <span className="flex items-center gap-3">
                      <bdi className="ltr mute">{r.value}</bdi>
                      <span aria-hidden="true">↗</span>
                      <span className="sr-only">({c('opensNewTab')})</span>
                    </span>
                  </ExternalLink>
                </li>
              ))}
            </ul>
            <p className="mute mt-3 text-[0.92rem]">{t('channelsNote')}</p>
          </div>
          <div className="space-y-8 lg:col-span-5">
            <div className="border-t-4 border-ink pt-4">
              <h2 className="t-3">{t('locationTitle')}</h2>
              <p className="mt-2">{t('locationBody')}</p>
            </div>
            <div className="border-t-4 border-ink pt-4">
              <h2 className="t-3">{t('hoursTitle')}</h2>
              <p className="mt-2">{t('hoursBody')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
