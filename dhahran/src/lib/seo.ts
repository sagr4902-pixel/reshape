import 'server-only';
import type { Metadata } from 'next';
import { env } from '@/lib/env';
import { locales, type Locale } from '@/i18n/routing';

/** Localised metadata with canonical + reciprocal hreflang. Previews are never indexable. */
export function pageMetadata(opts: {
  locale: Locale;
  path: string; // locale-less path, e.g. "/kids" or ""
  title: string;
  description: string;
  siteName: string;
  noindex?: boolean;
  absoluteTitle?: boolean;
}): Metadata {
  const e = env();
  const path = opts.path === '/' ? '' : opts.path;
  const url = (l: Locale) => `${e.siteUrl}/${l}${path}`;
  const index = e.indexable && !opts.noindex;
  const title = opts.absoluteTitle ? opts.title : `${opts.title} | ${opts.siteName}`;
  return {
    metadataBase: new URL(e.siteUrl),
    title,
    description: opts.description,
    alternates: {
      canonical: url(opts.locale),
      languages: { ...Object.fromEntries(locales.map((l) => [l, url(l)])), 'x-default': url('ar') },
    },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'website',
      url: url(opts.locale),
      siteName: opts.siteName,
      title,
      description: opts.description,
      locale: opts.locale === 'ar' ? 'ar_SA' : 'en_US',
      images: [{ url: '/assets/brand/og.jpg', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description: opts.description, images: ['/assets/brand/og.jpg'] },
  };
}
