'use client';

import type { MouseEvent, ReactNode } from 'react';
import { Link, useRouter } from '@/i18n/navigation';

/**
 * A link that "walks in" through the facade: the hero zooms toward the door,
 * fades, then navigates. It stays a normal link for keyboard new-tab gestures,
 * no-JavaScript visitors and reduced-motion users.
 */
export function EnterLink({
  href,
  className,
  children,
  style,
  testId,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  testId?: string;
}) {
  const router = useRouter();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const root = e.currentTarget.closest<HTMLElement>('.facade');
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    if (root.classList.contains('is-entering')) return;
    root.classList.add('is-entering');
    router.prefetch(href);
    window.setTimeout(() => router.push(href), 820);
    // Never leave the facade faded out: undo if navigation stalls or the page is restored from history.
    const reset = () => root.classList.remove('is-entering');
    window.setTimeout(reset, 5000);
    window.addEventListener('pageshow', reset, { once: true });
  };
  return (
    <Link href={href} prefetch={false} className={className} onClick={onClick} style={style} data-testid={testId}>
      {children}
    </Link>
  );
}
