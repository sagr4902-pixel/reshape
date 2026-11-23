'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Countdown to the end of the offer. The time is computed in the browser only
 * (the page is prerendered), and when it reaches zero the call to action is
 * replaced by the "ended" message — an expired offer is never sold.
 */
export function Countdown({
  endsAt,
  labels,
  children,
  ended,
}: {
  endsAt: string;
  labels: { title: string; days: string; hours: string; minutes: string; seconds: string };
  children: ReactNode;
  ended: ReactNode;
}) {
  const end = Date.parse(endsAt);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [end]);

  if (left === 0) return <div data-testid="offer-ended">{ended}</div>;
  const s = Math.floor((left ?? 0) / 1000);
  const parts: [number, string][] = [
    [Math.floor(s / 86400), labels.days],
    [Math.floor((s % 86400) / 3600), labels.hours],
    [Math.floor((s % 3600) / 60), labels.minutes],
    [s % 60, labels.seconds],
  ];
  return (
    <>
      <p className="eyebrow">{labels.title}</p>
      <div className="countdown mt-3" role="timer" aria-live="off" data-testid="offer-countdown" data-ready={left !== null}>
        {parts.map(([n, label]) => (
          <div key={label} className="countdown-cell">
            <span className="countdown-num ltr">{left === null ? '--' : String(n).padStart(2, '0')}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-8">{children}</div>
    </>
  );
}
