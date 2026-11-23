import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

// CSP: Next.js injects inline bootstrap scripts, so 'unsafe-inline' is required for
// script-src unless nonces are used (which would force every page to render dynamically).
// Everything else is locked to same-origin. See docs/architecture.md § Security headers.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ];
  },
  async redirects() {
    // Aliases → primary routes (no thin duplicate pages)
    return ['ar', 'en'].flatMap((l) => [
      { source: `/${l}/programs/kids`, destination: `/${l}/kids`, permanent: true },
      { source: `/${l}/programs/football-performance`, destination: `/${l}/football-performance`, permanent: true },
      { source: `/${l}/programs/football`, destination: `/${l}/football-performance`, permanent: true },
      { source: `/${l}/programs/hyrox`, destination: `/${l}/programs/hybrid-endurance`, permanent: true },
      { source: `/${l}/programs/crossfit`, destination: `/${l}/programs/functional-training`, permanent: true },
      { source: `/${l}/about`, destination: `/${l}#about`, permanent: false },
      // The club tour was withdrawn at the owner's request.
      { source: `/${l}/explore`, destination: `/${l}`, permanent: false },
      { source: `/${l}/pricing`, destination: `/${l}/memberships`, permanent: true },
    ]);
  },
};

export default withNextIntl(nextConfig);
