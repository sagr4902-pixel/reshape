'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Site-wide entrance motion. Blocks inside every section rise in as they are
 * scrolled to, and the items of lists and grids follow one after another.
 *
 * Progressive: markup is untouched and fully visible without JavaScript; the
 * hidden starting state exists only under `html.motion`, which this component
 * sets, and never with "reduce motion".
 */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('main section:not(.facade) .wrap > *, main section:not(.facade) > .wrap:only-child > *'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.in = 'true';
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    );
    for (const el of blocks) {
      // anything already on screen (or above it) is shown at once — no flash on load or after "back"
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.dataset.in = 'true';
      el.dataset.reveal = '';
      el.querySelectorAll<HTMLElement>(':scope > li, :scope > ul > li, :scope > ol > li').forEach((li, i) => li.style.setProperty('--i', String(Math.min(i, 8))));
      if (!el.dataset.in) io.observe(el);
    }
    root.classList.add('motion');
    return () => {
      io.disconnect();
      root.classList.remove('motion');
      for (const el of blocks) {
        delete el.dataset.reveal;
        delete el.dataset.in;
      }
    };
  }, [pathname]);
  return null;
}
