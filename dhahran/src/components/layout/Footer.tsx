import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { site } from '@/content';
import { ExternalLink } from '@/components/ui/ExternalLink';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const n = await getTranslations({ locale, namespace: 'nav' });
  const c = await getTranslations({ locale, namespace: 'contact' });
  const links = [
    ['/explore', n('explore')],
    ['/programs', n('programs')],
    ['/kids', n('kids')],
    ['/football-performance', locale === 'ar' ? 'أداء لاعبي كرة القدم' : 'Football performance'],
    ['/memberships', n('memberships')],
    ['/contact', n('contact')],
    ['/privacy', t('privacy')],
  ] as const;
  return (
    <footer className="on-dark dark-sec border-t border-line-dark">
      <div className="wrap grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <img src="/assets/brand/reshape-logo.png" alt="RESHAPE" width={150} height={50} className="h-10 w-auto" loading="lazy" />
          <p className="mt-4 max-w-sm">{t('tagline')}</p>
          <p className="mute mt-2 max-w-sm text-[0.95rem]">{t('stage')}</p>
        </div>
        <nav aria-label={t('explore')} className="md:col-span-3">
          <h2 className="!font-sans !text-base !normal-case !tracking-normal font-semibold text-mute-dark">{t('explore')}</h2>
          <ul className="mt-3">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-10 items-center hover:text-accent">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <h2 className="!font-sans !text-base !normal-case !tracking-normal font-semibold text-mute-dark">{t('channels')}</h2>
          <ul className="mt-3">
            <li>
              <ExternalLink href={site.channels.whatsapp.url} event="contact_click" location="footer" className="inline-flex min-h-10 items-center gap-2 hover:text-accent">
                {c('whatsapp')} <bdi className="ltr text-mute-dark">{site.channels.whatsapp.e164}</bdi>
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={site.channels.instagram.url} event="contact_click" location="footer" className="inline-flex min-h-10 items-center gap-2 hover:text-accent">
                {c('instagram')} <bdi className="ltr text-mute-dark">{site.channels.instagram.handle}</bdi>
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={site.channels.store.url} event="membership_outbound_click" location="footer" className="inline-flex min-h-10 items-center gap-2 hover:text-accent">
                {c('store')} <bdi className="ltr text-mute-dark">reshape-sa.com</bdi>
              </ExternalLink>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line-dark">
        <div className="wrap flex flex-col gap-2 py-5 text-[0.88rem] text-mute-dark sm:flex-row sm:items-center sm:justify-between">
          <p>{t('rights', { year: new Date().getFullYear() })}</p>
          <p>
            <a href={site.developer.url} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center hover:text-paper">
              {site.developer.label[locale]}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
