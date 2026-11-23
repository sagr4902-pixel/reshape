'use client';

import { useEffect, useState, type ReactNode } from 'react';

export interface CountdownLabels {
  title: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

/** Remaining time, computed in the browser only (the page is prerendered). `null` until mounted. */
export function useTimeLeft(endsAt: string): number | null {
  const end = Date.parse(endsAt);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [end]);
  return left;
}

export function splitTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const two = (n: number) => String(n).padStart(2, '0');

/**
 * Countdown to the end of the offer. Each number drops in when it changes.
 * When time runs out the call to action is replaced by the "ended" message —
 * an expired offer is never sold.
 */
export function Countdown({ endsAt, labels, children, ended }: { endsAt: string; labels: CountdownLabels; children: ReactNode; ended: ReactNode }) {
  const left = useTimeLeft(endsAt);
  if (left === 0) return <div data-testid="offer-ended">{ended}</div>;
  const t = splitTime(left ?? 0);
  const parts: [number, string, string][] = [
    [t.d, labels.days, 'd'],
    [t.h, labels.hours, 'h'],
    [t.m, labels.minutes, 'm'],
    [t.s, labels.seconds, 's'],
  ];
  return (
    <>
      <p className="countdown-title">
        <span className="countdown-live" aria-hidden="true" />
        {labels.title}
      </p>
      <div className="countdown mt-4" role="timer" aria-live="off" data-testid="offer-countdown" data-ready={left !== null}>
        {parts.map(([n, label, unit]) => (
          <div key={unit} className="countdown-cell" data-unit={unit}>
            <span className="countdown-window">
              {/* keyed by value: a new element mounts on every change and plays the drop-in */}
              <span key={left === null ? 'x' : n} className="countdown-num ltr">
                {left === null ? '--' : two(n)}
              </span>
            </span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-8">{children}</div>
    </>
  );
}
