import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { registerHref } from '@/content';
import { LocaleSwitch } from './LocaleSwitch';

const NAV = [
  ['/explore', 'explore'],
  ['/programs', 'programs'],
  ['/kids', 'kids'],
  ['/memberships', 'memberships'],
  ['/contact', 'contact'],
] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  return (
    <header className="on-dark sticky top-0 z-50 border-b border-line-dark bg-ink/95 text-paper backdrop-blur">
      <div className="wrap flex min-h-[64px] items-center gap-3">
        <Link href="/" className="flex min-h-11 items-center gap-3">
          {/* Official logo from the owner's existing RESHAPE app. Never mirrored. */}
          <img src="/assets/brand/reshape-logo.png" alt={t('logoAlt')} width={126} height={42} className="h-[34px] w-auto" />
          <span className="ltr hidden border-s border-line-dark ps-3 text-[0.8rem] font-semibold tracking-wide text-mute-dark sm:inline">
            {locale === 'ar' ? tc('dhahran') : 'DHAHRAN'}
          </span>
        </Link>

        <nav aria-label={t('main')} className="ms-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map(([href, key]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-11 items-center px-3 text-[0.98rem] font-semibold hover:text-accent">
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-1 lg:ms-2">
          <LocaleSwitch locale={locale} label={t('switchLabel')} aria={t('switchAria')} />
          <Link href={registerHref({ src: 'header' })} className="btn btn-primary !min-h-11 whitespace-nowrap !px-4 !text-[0.95rem] max-sm:hidden">
            {t('register')}
          </Link>
          {/* Works without JavaScript */}
          <details className="group relative lg:hidden">
            <summary className="flex h-11 w-11 list-none items-center justify-center rounded [&::-webkit-details-marker]:hidden" aria-label={t('menu')}>
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <path d="M3 7h20M3 13h20M3 19h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </summary>
            <nav aria-label={t('main')} className="absolute end-0 top-[calc(100%+10px)] w-[min(86vw,320px)] rounded-lg border border-line-dark bg-coal p-2 shadow-2xl">
              <ul>
                {NAV.map(([href, key]) => (
                  <li key={href}>
                    <Link href={href} className="flex min-h-12 items-center rounded px-4 font-semibold hover:bg-coal-2">
                      {t(key)}
                    </Link>
                  </li>
                ))}
                <li className="p-2">
                  <Link href={registerHref({ src: 'header' })} className="btn btn-primary w-full">
                    {t('register')}
                  </Link>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
