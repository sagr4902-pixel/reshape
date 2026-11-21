import type { ReactNode } from 'react';
import { designImage } from '@/content';
import { DesignPicture } from '@/components/ui/DesignPicture';
import { EnterLink } from './EnterLink';

/**
 * Homepage hero: the club facade exactly as designed (owner's facade render).
 *
 * The image sits on a "plate" with the render's own aspect ratio. The view
 * crops the plate per breakpoint by sliding it horizontally, and every overlay
 * (hotspots, wall lettering) is positioned in percent of the plate, so
 * overlays stay registered to the facade at any size without JavaScript.
 *
 * Hotspot coordinates are fractions of the render (u = x / width, v = y / height).
 */
export interface FacadeHotspot {
  id: string;
  label: string;
  href: string;
  u: number;
  v: number;
  primary?: boolean;
}

const HERO_MIN_WIDTH = 1100;

export function FacadeHero({
  alt,
  facadeLabel,
  hotspotsLabel,
  hotspots,
  note,
  children,
}: {
  alt: string;
  facadeLabel: string;
  hotspotsLabel: string;
  hotspots: FacadeHotspot[];
  note: string;
  children: ReactNode;
}) {
  const facade = designImage('facade');
  // The hero plate is wider than the viewport on phones, so it never uses the tile/thumbnail sizes.
  const img = { ...facade, widths: facade.widths.filter((w) => w >= HERO_MIN_WIDTH), webp: facade.webp.filter((w) => w >= HERO_MIN_WIDTH) };
  return (
    <section className="facade on-dark" aria-label={facadeLabel}>
      <div className="facade-view" dir="ltr">
        <div className="facade-plate">
          <DesignPicture image={img} alt={alt} sizes="(min-width: 1100px) 100vw, (min-width: 640px) 134vw, 105vw" priority className="facade-img" />
          <div className="facade-scrim" aria-hidden="true" />
          <nav aria-label={hotspotsLabel}>
            <ul>
              {hotspots.map((h) => (
                <li key={h.id}>
                  <EnterLink
                    href={h.href}
                    className={`facade-hot${h.primary ? ' is-primary' : ''}`}
                    style={{ left: `${h.u * 100}%`, top: `${h.v * 100}%` }}
                    testId={`facade-hot-${h.id}`}
                  >
                    <span className="facade-hot-ring" aria-hidden="true" />
                    <span className="facade-hot-label">{h.label}</span>
                  </EnterLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="facade-fade" aria-hidden="true" />
        <p className="facade-note">{note}</p>
      </div>
      <div className="facade-copy">{children}</div>
    </section>
  );
}
