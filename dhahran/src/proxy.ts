import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Locale routing: "/" → "/ar"; "/en" is explicit.
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|assets|fonts|.*\\..*).*)'],
};
