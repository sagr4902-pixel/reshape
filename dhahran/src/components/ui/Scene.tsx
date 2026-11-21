import sceneMeta from '@/content/generated/scene-meta.json';

type Theme = 'dark' | 'light';

/** Whole-club exploded drawing. Portrait composite on phones, landscape from 800 px. */
export function ClubScene({ theme = 'dark', alt, priority = false, className }: { theme?: Theme; alt: string; priority?: boolean; className?: string }) {
  const p = sceneMeta.layouts.portrait.aspect;
  const l = sceneMeta.layouts.landscape.aspect;
  return (
    <picture>
      <source media="(min-width: 800px)" srcSet={`/assets/scenes/club-landscape-${theme}.svg`} width={Math.round(1000 * l)} height={1000} />
      <img
        src={`/assets/scenes/club-portrait-${theme}.svg`}
        alt={alt}
        width={Math.round(1000 * p)}
        height={1000}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  );
}

/** 4:3 crop of a single zone. */
export function ZoneScene({ zoneId, theme = 'dark', alt, className }: { zoneId: string; theme?: Theme; alt: string; className?: string }) {
  return (
    <img
      src={`/assets/scenes/zone-${zoneId}-${theme}.svg`}
      alt={alt}
      width={800}
      height={600}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
