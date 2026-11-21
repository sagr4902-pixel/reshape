import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { detailPrograms } from '@/content';
import { locales } from '@/i18n/routing';

/** Public canonical pages only. /register (noindex) and API routes are excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env().siteUrl;
  const paths = ['', '/explore', '/programs', ...detailPrograms.map((p) => p.route), '/kids', '/football-performance', '/memberships', '/contact', '/privacy'];
  return paths.flatMap((path) =>
    locales.map((l) => ({
      url: `${base}/${l}${path}`,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${base}/${x}${path}`])) },
    })),
  );
}
