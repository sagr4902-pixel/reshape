'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ReelItem {
  id: string;
  group: string;
  src: string;
  poster?: string;
  caption: string;
}

/**
 * Vertical clips shown as reels: group tabs, a horizontal strip of 9:16 cards
 * with a large play button, and a full-screen player with sound, previous and
 * next. Nothing downloads but the posters until a clip is opened.
 */
export function GalleryReel({
  items,
  groups,
  labels,
}: {
  items: ReelItem[];
  groups: { id: string; label: string }[];
  labels: { all: string; play: string; close: string; prev: string; next: string; scrollPrev: string; scrollNext: string; count: string };
}) {
  const [group, setGroup] = useState<string>('all');
  const [open, setOpen] = useState<number | null>(null);
  const strip = useRef<HTMLUListElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const shown = group === 'all' ? items : items.filter((i) => i.group === group);
  const current = open === null ? null : shown[open];

  const close = useCallback(() => {
    setOpen(null);
    opener.current?.focus();
  }, []);
  const step = useCallback((d: 1 | -1) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    if (open === null) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(document.dir === 'rtl' ? 1 : -1);
      else if (e.key === 'ArrowRight') step(document.dir === 'rtl' ? -1 : 1);
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close, step]);

  const scroll = (d: 1 | -1) => {
    const el = strip.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({ left: d * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="reel">
      <div className="reel-bar">
        <div className="reel-tabs" role="group">
          {[{ id: 'all', label: labels.all }, ...groups].map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              className="reel-tab"
              onClick={() => {
                setGroup(g.id);
                strip.current?.scrollTo({ left: 0 });
              }}
              data-testid={`reel-tab-${g.id}`}
            >
              {g.label}
              <span className="reel-tab-n ltr">{g.id === 'all' ? items.length : items.filter((i) => i.group === g.id).length}</span>
            </button>
          ))}
        </div>
        <div className="reel-arrows">
          <button type="button" className="reel-arrow" onClick={() => scroll(-1)} aria-label={labels.scrollPrev}>
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="reel-arrow" onClick={() => scroll(1)} aria-label={labels.scrollNext}>
            <span aria-hidden="true">←</span>
          </button>
        </div>
      </div>

      <ul ref={strip} className="reel-strip" data-testid="reel-strip">
        {shown.map((m, i) => (
          <li key={m.id} className="reel-card">
            <button
              type="button"
              className="reel-open"
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpen(i);
              }}
              aria-label={`${labels.play}: ${m.caption}`}
              data-testid="reel-card"
            >
              {m.poster && <img src={m.poster} alt="" loading="lazy" decoding="async" className="reel-poster" />}
              <span className="reel-shade" aria-hidden="true" />
              <span className="reel-play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="30" height="30">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              </span>
              <span className="reel-caption">{m.caption}</span>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div className="reel-player" role="dialog" aria-modal="true" aria-label={current.caption} data-testid="reel-player">
          <button type="button" className="reel-backdrop" aria-label={labels.close} tabIndex={-1} onClick={close} />
          <div className="reel-stage">
            <video key={current.id} src={current.src} poster={current.poster} controls autoPlay playsInline className="reel-video" />
            <p className="reel-player-caption">
              <span>{current.caption}</span>
              <span className="ltr reel-count">{labels.count.replace('{n}', String((open ?? 0) + 1)).replace('{total}', String(shown.length))}</span>
            </p>
          </div>
          <button ref={closeBtn} type="button" className="reel-ctrl reel-close" onClick={close} aria-label={labels.close} data-testid="reel-close">
            ✕
          </button>
          {shown.length > 1 && (
            <>
              <button type="button" className="reel-ctrl reel-prev" onClick={() => step(-1)} aria-label={labels.prev}>
                <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="reel-ctrl reel-next" onClick={() => step(1)} aria-label={labels.next}>
                <span aria-hidden="true">←</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
