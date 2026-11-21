'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

// Non-personal context that survives a language switch.
const KEEP = ['zone', 'program', 'intent', 'src'] as const;
const SAFE = /^[a-z0-9-]{1,48}$/;

function Inner({ locale, label, aria }: { locale: Locale; label: string; aria: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const query: Record<string, string> = {};
  for (const k of KEEP) {
    const v = sp.get(k);
    if (v && SAFE.test(v)) query[k] = v;
  }
  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  return (
    <Link
      href={{ pathname, query }}
      locale={other}
      lang={other}
      aria-label={aria}
      className="sys-font inline-flex min-h-11 items-center px-2 text-[0.95rem] font-semibold underline decoration-transparent hover:decoration-current"
    >
      {label}
    </Link>
  );
}

export function LocaleSwitch(props: { locale: Locale; label: string; aria: string }) {
  const other: Locale = props.locale === 'ar' ? 'en' : 'ar';
  return (
    <Suspense
      fallback={
        <a href={`/${other}`} lang={other} aria-label={props.aria} className="sys-font inline-flex min-h-11 items-center px-2 text-[0.95rem] font-semibold">
          {props.label}
        </a>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}
