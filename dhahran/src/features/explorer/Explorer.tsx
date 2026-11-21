'use client';

import { useCallback, useEffect, useReducer, useRef, type CSSProperties, type MouseEvent } from 'react';
import { Link } from '@/i18n/navigation';
import { track } from '@/lib/analytics';
import { DesignPicture, type DesignPictureSource } from '@/components/ui/DesignPicture';

/**
 * Club explorer: an accurate map of both levels plus the official design
 * renders for each zone.
 *
 * Map geometry is CSS-only: the stage has the same aspect ratio as the
 * generated drawing, so the SVG never letterboxes and hotspots (HTML links
 * positioned in percent of their level drawing) stay registered through
 * resize, RTL/LTR and camera moves without measuring anything in JavaScript.
 * The camera is a transform on the stage; portrait / landscape layouts are
 * switched by a media query using values from scripts/build-scenes.ts.
 *
 * Every zone control is a real link (?zone=…), so the page works without
 * JavaScript: the server renders the selected zone and its first image.
 */

export interface ZoneImage extends DesignPictureSource {
  alt: string;
}

export interface ZoneView {
  id: string;
  level: 'ground' | 'upper';
  levelLabel: string;
  title: string;
  summary: string;
  basis: string;
  images: ZoneImage[];
  /** Which side of its dot the map label hangs on (physical; the map is never mirrored). */
  labelSide?: 'left' | 'right';
  programs: { id: string; title: string; href: string; status: string }[];
  cta: { label: string; href: string };
}

interface Camera {
  s: number;
  tx: number;
  ty: number;
}
interface LayoutMeta {
  aspect: number;
  levels: Record<'ground' | 'upper', { left: number; top: number; width: number; height: number }>;
  cameras: Record<string, Camera>;
}
export interface ExplorerMeta {
  layouts: { portrait: LayoutMeta; landscape: LayoutMeta };
  zones: Record<string, { level: string; anchor: number[] }>;
}

export interface ExplorerLabels {
  zonesNav: string;
  overview: string;
  back: string;
  nextZone: string;
  prevZone: string;
  simpleOn: string;
  simpleOff: string;
  selected: string; // contains {zone}
  overviewAnnounce: string;
  promptTitle: string;
  promptBody: string;
  programsHere: string;
  basisLabel: string;
  failed: string;
  sceneLabel: string;
  conceptNote: string;
  mapNote: string;
  viewPrograms: string;
  showMap: string;
  showDesign: string;
  nextImage: string;
  prevImage: string;
  imageOf: string; // contains {n} and {total}
  gallery: string;
  whereInClub: string;
  levels: Record<'ground' | 'upper', string>;
  levelsLabel: string;
}

type Phase = 'overview' | 'transitioning' | 'focused';
type View = 'map' | 'design';
interface State {
  zone: string | null;
  phase: Phase;
  view: View;
  /** After the map camera settles on a zone, switch to its design images. */
  pendingDesign: boolean;
  img: number;
  /** Level shown on the map. */
  level: 'ground' | 'upper';
  simple: boolean;
  failed: boolean;
  /**
   * Entrance animations run only for content swapped in after the first render.
   * The server-rendered image and panel must paint at once (the image is the LCP element).
   */
  animPhoto: boolean;
  animPanel: boolean;
}
type Action =
  | { type: 'select'; zone: string | null; level?: 'ground' | 'upper'; animate: boolean }
  | { type: 'level'; level: 'ground' | 'upper' }
  | { type: 'settled' }
  | { type: 'view'; view: View }
  | { type: 'img'; index: number }
  | { type: 'simple'; value: boolean }
  | { type: 'failed' };

function reducer(state: State, action: Action): State {
  const next = reduce(state, action);
  const zoneChanged = next.zone !== state.zone;
  const photoChanged = zoneChanged || next.img !== state.img || next.view !== state.view;
  if ((zoneChanged && !next.animPanel) || (photoChanged && !next.animPhoto))
    return { ...next, animPanel: next.animPanel || zoneChanged, animPhoto: next.animPhoto || photoChanged };
  return next;
}

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'select': {
      if (action.zone === state.zone) return state;
      // Newest intent always wins: a selection during a transition simply retargets it.
      const onMap = state.view === 'map' && !state.failed;
      const sweep = action.animate && onMap && !state.simple;
      if (!action.zone) return { ...state, zone: null, img: 0, view: 'map', pendingDesign: false, phase: sweep ? 'transitioning' : 'overview' };
      const level = action.level ?? state.level;
      if (sweep) return { ...state, zone: action.zone, level, img: 0, phase: 'transitioning', pendingDesign: true };
      return { ...state, zone: action.zone, level, img: 0, phase: 'focused', view: 'design', pendingDesign: false };
    }
    case 'level':
      // Switching level from the overview only; a selected zone fixes its own level.
      return state.zone ? state : { ...state, level: action.level };
    case 'settled':
      if (state.phase !== 'transitioning') return state;
      return { ...state, phase: state.zone ? 'focused' : 'overview', view: state.zone && state.pendingDesign ? 'design' : state.view, pendingDesign: false };
    case 'view':
      return { ...state, view: action.view, pendingDesign: false, phase: state.zone ? 'focused' : 'overview' };
    case 'img':
      return { ...state, img: action.index };
    case 'simple':
      return { ...state, simple: action.value, phase: state.zone ? 'focused' : 'overview', view: state.pendingDesign ? 'design' : state.view, pendingDesign: false };
    case 'failed':
      return { ...state, failed: true, view: state.zone ? 'design' : 'map', pendingDesign: false, phase: state.zone ? 'focused' : 'overview' };
  }
}

const SIMPLE_KEY = 'reshape.explorer.simple';

export function Explorer({
  zones,
  initialZone,
  meta,
  labels,
  locale,
}: {
  zones: ZoneView[];
  initialZone: string | null;
  meta: ExplorerMeta;
  labels: ExplorerLabels;
  locale: 'ar' | 'en';
}) {
  const [state, dispatch] = useReducer(reducer, {
    zone: initialZone,
    phase: initialZone ? 'focused' : 'overview',
    view: initialZone ? 'design' : 'map',
    pendingDesign: false,
    img: 0,
    level: zones.find((z) => z.id === initialZone)?.level ?? 'ground',
    simple: false,
    failed: false,
    animPhoto: false,
    animPanel: false,
  });
  const ids = zones.map((z) => z.id);
  const current = zones.find((z) => z.id === state.zone) ?? null;
  const image = current ? current.images[Math.min(state.img, current.images.length - 1)] : null;
  const opened = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  // Images can fail before React attaches onError (server-rendered markup); check once on mount.
  useEffect(() => {
    const imgs = viewportRef.current?.querySelectorAll('img') ?? [];
    for (const img of imgs) if (img.complete && img.naturalWidth === 0) dispatch({ type: 'failed' });
  }, []);

  // Restore the visitor's Simple-view preference (browser-only, no cookie).
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIMPLE_KEY) === '1') dispatch({ type: 'simple', value: true });
    } catch {
      /* storage unavailable — default view */
    }
    if (!opened.current) {
      opened.current = true;
      track('explorer_open', { locale });
    }
  }, [locale]);

  // Back/forward restores zone state. Only deliberate selections create history entries.
  useEffect(() => {
    const onPop = () => {
      const z = new URLSearchParams(window.location.search).get('zone');
      const valid = z && ids.includes(z) ? z : null;
      dispatch({ type: 'select', zone: valid, level: zones.find((x) => x.id === valid)?.level, animate: false });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net: leave "transitioning" even if transitionend never fires (hidden tab, interrupted sweep).
  useEffect(() => {
    if (state.phase !== 'transitioning') return;
    const id = window.setTimeout(() => dispatch({ type: 'settled' }), 900);
    return () => window.clearTimeout(id);
  }, [state.phase, state.zone]);

  const select = useCallback(
    (zone: string | null, e?: MouseEvent) => {
      if (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // let the browser open new tabs etc.
        e.preventDefault();
      }
      if (zone === state.zone) return;
      const url = new URL(window.location.href);
      if (zone) url.searchParams.set('zone', zone);
      else url.searchParams.delete('zone');
      window.history.pushState(null, '', url);
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      dispatch({ type: 'select', zone, level: zones.find((x) => x.id === zone)?.level, animate: !calm });
      if (zone) track('explorer_zone_select', { zoneId: zone, locale });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.zone, locale],
  );

  const toggleSimple = () => {
    const value = !state.simple;
    dispatch({ type: 'simple', value });
    try {
      window.localStorage.setItem(SIMPLE_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const step = (d: 1 | -1) => {
    const i = state.zone ? ids.indexOf(state.zone) : d === 1 ? -1 : 0;
    return ids[(i + d + ids.length) % ids.length];
  };

  const { portrait: P, landscape: L } = meta.layouts;
  const pc = state.zone ? P.cameras[state.zone] : null;
  const lc = state.zone ? L.cameras[state.zone] : null;
  const viewportVars = { '--p-ar': P.aspect, '--l-ar': L.aspect } as CSSProperties;
  const stageVars = (
    pc && lc ? { '--p-s': pc.s, '--p-tx': `${pc.tx}%`, '--p-ty': `${pc.ty}%`, '--l-s': lc.s, '--l-tx': `${lc.tx}%`, '--l-ty': `${lc.ty}%` } : {}
  ) as CSSProperties;
  const levelVars = (level: 'ground' | 'upper') =>
    ({
      '--p-l': `${P.levels[level].left}%`,
      '--p-t': `${P.levels[level].top}%`,
      '--p-w': `${P.levels[level].width}%`,
      '--p-h': `${P.levels[level].height}%`,
      '--l-l': `${L.levels[level].left}%`,
      '--l-t': `${L.levels[level].top}%`,
      '--l-w': `${L.levels[level].width}%`,
      '--l-h': `${L.levels[level].height}%`,
    }) as CSSProperties;

  const zoneHref = (id: string | null) => (id ? { pathname: '/explore' as const, query: { zone: id } } : '/explore');
  const announce = current ? labels.selected.replace('{zone}', current.title) : labels.overviewAnnounce;
  const count = current?.images.length ?? 0;
  const imgStep = (d: 1 | -1) => dispatch({ type: 'img', index: (state.img + d + count) % count });
  const arrowBack = (
    <span className="arrow" aria-hidden="true">
      ←
    </span>
  );
  const arrowFwd = (
    <span className="arrow" aria-hidden="true">
      →
    </span>
  );

  return (
    <div className="xp-root on-dark" data-simple={state.simple} data-phase={state.phase} data-zone={state.zone ?? ''} data-view={state.view}>
      <p className="sr-only" aria-live="polite" data-testid="xp-announce">
        {announce}
      </p>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        {/* Zone selector — the primary, always-available control */}
        <nav aria-label={labels.zonesNav} className="min-w-0 lg:col-span-12">
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:flex-wrap lg:overflow-visible">
            <li>
              <Link href={zoneHref(null)} scroll={false} prefetch={false} onClick={(e) => select(null, e)} aria-current={state.zone === null ? 'true' : undefined} className="xp-chip !ps-4" data-testid="chip-overview">
                {labels.overview}
              </Link>
            </li>
            {zones.map((z, i) => (
              <li key={z.id}>
                <Link href={zoneHref(z.id)} scroll={false} prefetch={false} onClick={(e) => select(z.id, e)} aria-current={state.zone === z.id ? 'true' : undefined} className="xp-chip" data-testid={`chip-${z.id}`}>
                  <span className="xp-chip-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  {z.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 lg:col-span-8">
          {/* ── Map ─────────────────────────────────────────────────────── */}
          <div hidden={state.view !== 'map'} data-testid="xp-map">
            {state.failed ? (
              <p role="status" className="rounded-lg border border-line-dark bg-coal p-6">
                {labels.failed}
              </p>
            ) : (
              <div ref={viewportRef} className="xp-viewport" style={viewportVars} role="group" aria-label={labels.sceneLabel} data-testid="xp-viewport">
                <div
                  className="xp-stage"
                  style={stageVars}
                  data-focused={state.zone ? 'true' : 'false'}
                  data-level={state.level}
                  data-testid="xp-stage"
                  onTransitionEnd={(e) => {
                    if (e.target === e.currentTarget && e.propertyName === 'transform') dispatch({ type: 'settled' });
                  }}
                >
                  {(['ground', 'upper'] as const).map((level) => (
                    <div key={level} className="xp-level" data-level={level} style={levelVars(level)}>
                      {/* Decorative: the adjacent HTML carries names, descriptions and actions. */}
                      <img src={`/assets/scenes/level-${level}-dark.svg`} alt="" draggable={false} loading={initialZone ? 'lazy' : 'eager'} onError={() => dispatch({ type: 'failed' })} />
                      {zones
                        .filter((z) => z.level === level)
                        .map((z) => {
                          const a = meta.zones[z.id].anchor;
                          return (
                            <Link
                              key={z.id}
                              href={zoneHref(z.id)}
                              scroll={false}
                              onClick={(e) => select(z.id, e)}
                              aria-current={state.zone === z.id ? 'true' : undefined}
                              className="xp-hot"
                              style={{ left: `${a[0]}%`, top: `${a[1]}%` }}
                              data-side={z.labelSide ?? (a[0] > 70 ? 'left' : 'right')}
                              data-testid={`hot-${z.id}`}
                            >
                              <span className="xp-hot-dot" aria-hidden="true">
                                {ids.indexOf(z.id) + 1}
                              </span>
                              <span className="xp-hot-label" dir={dir} lang={locale}>
                                {z.title}
                              </span>
                            </Link>
                          );
                        })}
                    </div>
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2" dir={dir}>
                  <div className="pointer-events-auto flex flex-wrap gap-2">
                    {state.zone && (
                      <Link href={zoneHref(null)} scroll={false} prefetch={false} onClick={(e) => select(null, e)} className="xp-ctrl" data-testid="xp-back">
                        {arrowBack}
                        {labels.back}
                      </Link>
                    )}
                    {current && (
                      <button type="button" onClick={() => dispatch({ type: 'view', view: 'design' })} className="xp-ctrl" data-testid="xp-view-design">
                        {labels.showDesign}
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={toggleSimple} aria-pressed={state.simple} className="xp-ctrl pointer-events-auto" data-testid="xp-simple">
                    {state.simple ? labels.simpleOff : labels.simpleOn}
                  </button>
                </div>
                {/* Level switch (overview only; a selected zone fixes its level) */}
                {!state.zone && (
                  <div className="xp-seg absolute bottom-3 z-10" dir={dir} role="group" aria-label={labels.levelsLabel}>
                    {(['ground', 'upper'] as const).map((lv) => (
                      <button key={lv} type="button" aria-pressed={state.level === lv} onClick={() => dispatch({ type: 'level', level: lv })} data-testid={`xp-level-${lv}`}>
                        {labels.levels[lv]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="concept-note mt-3">{labels.mapNote}</p>
          </div>

          {/* ── Design renders for the selected zone ────────────────────── */}
          {current && image && state.view === 'design' && (
            <figure data-testid="xp-photo" aria-label={`${labels.gallery}: ${current.title}`}>
              <div className="xp-photo-wrap">
                <div className="xp-photo-frame">
                  <DesignPicture key={image.id} image={image} alt={image.alt} sizes="(min-width: 1024px) 66vw, 100vw" priority className={`xp-photo-img${state.animPhoto ? ' xp-photo-in' : ''}`} />
                  <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2" dir={dir}>
                    <Link href={zoneHref(null)} scroll={false} prefetch={false} onClick={(e) => select(null, e)} className="xp-ctrl pointer-events-auto" data-testid="xp-photo-back">
                      {arrowBack}
                      <span className="max-sm:sr-only">{labels.back}</span>
                    </Link>
                    {!state.failed && (
                      <button type="button" onClick={() => dispatch({ type: 'view', view: 'map' })} className="xp-ctrl pointer-events-auto" data-testid="xp-view-map">
                        {labels.showMap}
                      </button>
                    )}
                  </div>
                </div>
                {/* Previous / counter / next: under the render on phones, over its lower edge from 640 px (see .xp-photo-nav). */}
                {count > 1 && (
                  <div className="xp-photo-nav" dir={dir}>
                    <button type="button" onClick={() => imgStep(-1)} className="xp-ctrl" aria-label={labels.prevImage} data-testid="xp-img-prev">
                      {arrowBack}
                    </button>
                    <span className="xp-count" data-testid="xp-img-count">
                      <bdi className="ltr">
                        {state.img + 1} / {count}
                      </bdi>
                    </span>
                    <button type="button" onClick={() => imgStep(1)} className="xp-ctrl" aria-label={labels.nextImage} data-testid="xp-img-next">
                      {arrowFwd}
                    </button>
                  </div>
                )}
              </div>
              <figcaption className="mt-3">
                <span className="block text-[0.98rem]" data-testid="xp-caption">
                  {image.alt}
                </span>
                <span className="concept-note mt-1">{labels.conceptNote}</span>
              </figcaption>
              {count > 1 && (
                <ul className="xp-thumbs mt-3" aria-label={labels.gallery}>
                  {current.images.map((im, i) => (
                    <li key={im.id}>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'img', index: i })}
                        aria-current={i === state.img ? 'true' : undefined}
                        aria-label={labels.imageOf.replace('{n}', String(i + 1)).replace('{total}', String(count))}
                        className="xp-thumb"
                        data-testid={`xp-thumb-${i}`}
                      >
                        <img src={`/assets/design/${im.id}-240.webp`} alt="" width={240} height={135} loading="lazy" decoding="async" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </figure>
          )}
        </div>

        {/* Contextual panel (non-modal: no focus trap) */}
        <section className="min-w-0 lg:col-span-4" aria-labelledby="xp-panel-h" data-testid="xp-panel">
          {current ? (
            <div key={current.id} className={`${state.animPanel ? 'xp-panel-anim ' : ''}rounded-lg border border-line-dark bg-coal p-5 sm:p-6`}>
              <p className="eyebrow">{current.levelLabel}</p>
              <h2 id="xp-panel-h" className="t-3 mt-1">
                {current.title}
              </h2>
              <p className="mt-3">{current.summary}</p>
              {current.programs.length > 0 && (
                <>
                  <h3 className="mt-5 !font-sans !text-[0.9rem] !normal-case !tracking-normal font-semibold text-mute-dark">{labels.programsHere}</h3>
                  <ul className="mt-2 divide-y divide-line-dark border-y border-line-dark">
                    {current.programs.map((p) => (
                      <li key={p.id}>
                        <Link href={p.href} className="group flex min-h-12 items-center justify-between gap-3 py-2.5 hover:text-accent">
                          <span>
                            <span className="block font-semibold leading-snug">{p.title}</span>
                            <span className="block text-[0.82rem] text-mute-dark">{p.status}</span>
                          </span>
                          {arrowFwd}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <Link href={current.cta.href} className="btn btn-primary mt-5 w-full" data-testid="xp-cta">
                {current.cta.label}
              </Link>

              {/* Where this zone sits in the club */}
              {state.view === 'design' && !state.failed && (
                <button type="button" onClick={() => dispatch({ type: 'view', view: 'map' })} className="xp-mini mt-5" data-testid="xp-mini">
                  <span className="xp-mini-map" dir="ltr">
                    <img src={`/assets/scenes/level-${current.level}-dark.svg`} alt="" loading="lazy" draggable={false} />
                    <span className="xp-mini-dot" style={{ left: `${meta.zones[current.id].anchor[0]}%`, top: `${meta.zones[current.id].anchor[1]}%` }} />
                  </span>
                  <span className="block text-start text-[0.9rem] font-semibold">
                    {labels.whereInClub} · <span className="underline decoration-dotted">{labels.showMap}</span>
                  </span>
                </button>
              )}

              <details className="mt-3 text-[0.9rem] text-mute-dark">
                <summary className="inline-flex min-h-11 items-center font-semibold underline decoration-dotted">{labels.basisLabel}</summary>
                <p className="mt-1">{current.basis}</p>
              </details>

              <div className="mt-3 flex justify-between gap-2 border-t border-line-dark pt-4">
                <Link href={zoneHref(step(-1))} scroll={false} prefetch={false} onClick={(e) => select(step(-1), e)} className="xp-ctrl xp-ctrl-dark" data-testid="xp-zone-prev">
                  {arrowBack}
                  {labels.prevZone}
                </Link>
                <Link href={zoneHref(step(1))} scroll={false} prefetch={false} onClick={(e) => select(step(1), e)} className="xp-ctrl xp-ctrl-dark" data-testid="xp-zone-next">
                  {labels.nextZone}
                  {arrowFwd}
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-line-dark bg-coal p-5 sm:p-6">
              <h2 id="xp-panel-h" className="t-3">
                {labels.promptTitle}
              </h2>
              <p className="mt-3">{labels.promptBody}</p>
              <Link href={zoneHref(ids[0])} scroll={false} prefetch={false} onClick={(e) => select(ids[0], e)} className="btn btn-primary mt-5 w-full" data-testid="xp-start">
                {zones[0].title} {arrowFwd}
              </Link>
              <Link href="/programs" className="btn btn-line mt-3 w-full">
                {labels.viewPrograms}
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
