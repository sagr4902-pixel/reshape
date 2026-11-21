import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { designImage, programsForZone, registerHref, scene, sceneMeta, zoneIds } from '@/content';
import { Explorer, type ExplorerMeta, type ZoneView } from '@/features/explorer/Explorer';
import { DesignPicture } from '@/components/ui/DesignPicture';

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ zone?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explore' });
  const m = await getTranslations({ locale, namespace: 'meta' });
  // ?zone= variants are the same document: canonical is always /explore.
  return pageMetadata({ locale, path: '/explore', title: t('metaTitle'), description: t('metaDescription'), siteName: m('siteName') });
}

export default async function ExplorePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  // Deep link: only an allow-listed zone id is honoured; anything else opens the overview.
  const requested = typeof sp.zone === 'string' ? sp.zone : undefined;
  const initialZone = requested && zoneIds.includes(requested) ? requested : null;

  const t = await getTranslations({ locale, namespace: 'explore' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const zones: ZoneView[] = scene.zones.map((z) => {
    const linked = programsForZone(z.id);
    const primary = linked[0];
    return {
      id: z.id,
      level: z.level,
      levelLabel: c(`levels.${z.level}`),
      title: z.title[locale],
      summary: z.summary[locale],
      basis: z.basis[locale],
      labelSide: z.labelSide,
      images: z.imageIds.map((id) => {
        const im = designImage(id);
        return { id: im.id, w: im.w, h: im.h, widths: im.widths, webp: im.webp, alt: im.alt[locale] };
      }),
      programs: linked.map((p) => ({ id: p.id, title: p.title[locale], href: p.route, status: c(`availability.${p.availability}`) })),
      // Same program record and CTA policy as the conventional pages; only IDs travel in the URL.
      cta: primary
        ? { label: t('registerFor', { program: primary.shortTitle[locale] }), href: registerHref({ program: primary.id, zone: z.id, intent: primary.ctaIntent, src: 'explorer' }) }
        : { label: t('registerGeneral'), href: registerHref({ zone: z.id, src: 'explorer' }) },
    };
  });

  const labels = {
    zonesNav: t('zonesNav'),
    overview: t('overview'),
    back: t('back'),
    nextZone: t('nextZone'),
    prevZone: t('prevZone'),
    simpleOn: t('simpleOn'),
    simpleOff: t('simpleOff'),
    selected: t.raw('selected') as string,
    overviewAnnounce: t('overviewAnnounce'),
    promptTitle: t('promptTitle'),
    promptBody: t('promptBody'),
    programsHere: t('programsHere'),
    basisLabel: t('basisLabel'),
    failed: t('failed'),
    sceneLabel: t('sceneLabel'),
    conceptNote: c('conceptNote'),
    mapNote: t('mapNote'),
    viewPrograms: c('viewPrograms'),
    showMap: t('showMap'),
    showDesign: t('showDesign'),
    nextImage: t('nextImage'),
    prevImage: t('prevImage'),
    imageOf: t.raw('imageOf') as string,
    gallery: t('gallery'),
    whereInClub: t('whereInClub'),
    levels: { ground: t('levels.ground'), upper: t('levels.upper') },
    levelsLabel: t('levelsLabel'),
  };

  return (
    <>
      <section className="on-dark dark-sec pb-12 pt-8 lg:pt-10">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <h1 className="t-2">{t('title')}</h1>
              <p className="mute mt-2 max-w-xl">{t('intro')}</p>
            </div>
            <Link href="/programs" className="btn btn-line !min-h-11">
              {c('viewPrograms')}
            </Link>
          </div>
          <div className="mt-6">
            <Explorer zones={zones} initialZone={initialZone} meta={sceneMeta as unknown as ExplorerMeta} labels={labels} locale={locale} />
          </div>
          <p className="mute mt-4 max-w-3xl text-[0.9rem]">{t('conceptLong')}</p>
        </div>
      </section>

      {/* Server-rendered equivalent: works with no JavaScript, failed assets, or reduced motion. */}
      <section className="sec" aria-labelledby="zones-list-h">
        <div className="wrap">
          <h2 id="zones-list-h" className="t-2">
            {t('listTitle')}
          </h2>
          <p className="mute mt-2">{t('listIntro')}</p>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {zones.map((z, i) => (
              <li key={z.id} id={`zone-${z.id}`} className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel">
                <div className="aspect-video bg-ink">
                  <DesignPicture image={z.images[0]} alt={z.images[0].alt} sizes="(min-width: 1280px) 32vw, (min-width: 768px) 48vw, 100vw" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[0.85rem] font-semibold text-mute">
                    <span className="ltr">{String(i + 1).padStart(2, '0')}</span> · {z.levelLabel}
                  </p>
                  <h3 className="mt-1 !font-sans !text-[1.25rem] !normal-case !tracking-normal font-semibold">{z.title}</h3>
                  <p className="mt-2">{z.summary}</p>
                  <p className="concept-note mt-3">{z.basis}</p>
                  {z.programs.length > 0 && (
                    <ul className="mt-4 border-t border-line pt-3">
                      {z.programs.map((p) => (
                        <li key={p.id}>
                          <Link href={p.href} className="link-arrow inline-flex min-h-10 items-center">
                            {p.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto pt-4">
                    <Link href={z.cta.href} className="btn btn-dark w-full">
                      {z.cta.label}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
