'use client';

import { useEffect, useState } from 'react';
import { splitTime, useTimeLeft } from './Countdown';

/**
 * Slim bar that follows the reader down the page with the time left, until the
 * offer section itself comes into view. Gone once the offer has ended.
 */
export function OfferBar({ endsAt, title, cta, dayLabel }: { endsAt: string; title: string; cta: string; dayLabel: string }) {
  const left = useTimeLeft(endsAt);
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const offer = document.getElementById('offer');
      setShow(window.scrollY > 480 && !!offer && offer.getBoundingClientRect().top > window.innerHeight);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
  if (!left) return null;
  const t = splitTime(left);
  const two = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="offer-bar" data-show={show} data-testid="offer-bar" aria-hidden={!show}>
      <p className="offer-bar-text">
        <span className="countdown-live" aria-hidden="true" />
        <span className="offer-bar-title">{title}</span>
        <span className="offer-bar-time">
          <bdi dir="ltr">{t.d}</bdi> <small>{dayLabel}</small>{' '}
          <bdi dir="ltr">
            {two(t.h)}:{two(t.m)}:{two(t.s)}
          </bdi>
        </span>
      </p>
      <a href="#offer" className="btn btn-primary offer-bar-cta" tabIndex={show ? 0 : -1}>
        {cta}
      </a>
    </div>
  );
}
