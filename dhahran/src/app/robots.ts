import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/** Only an assigned production domain is crawlable; previews and local builds are closed. */
export default function robots(): MetadataRoute.Robots {
  const e = env();
  if (!e.indexable) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/*/register'] }],
    sitemap: `${e.siteUrl}/sitemap.xml`,
  };
}
