import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, dirOf, type Locale } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Reveal } from '@/components/motion/Reveal';
import '@/styles/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: '#17181A', width: 'device-width', initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <html lang={locale} dir={dirOf(locale as Locale)}>
      <head>
        <link rel="icon" href="/assets/brand/reshape-mark.png" type="image/png" />
        {/* Preload the display + text faces this language paints first (limits font-swap shift). */}
        {(locale === 'ar' ? ['zain-ar-800', 'plex-ar-400'] : ['barlow-lat-600', 'plex-lat-400']).map((f) => (
          <link key={f} rel="preload" as="font" type="font/woff2" href={`/fonts/${f}.woff2`} crossOrigin="anonymous" />
        ))}
      </head>
      <body>
        <a href="#main" className="skip">
          {t('skip')}
        </a>
        {/* Only the namespaces client components need are sent to the browser. */}
        <NextIntlClientProvider messages={null}>
          <Header locale={locale as Locale} />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer locale={locale as Locale} />
          <Reveal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
