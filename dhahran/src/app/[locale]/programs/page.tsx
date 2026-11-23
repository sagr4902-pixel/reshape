import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { designImage, programs, registerHref } from '@/content';
import { DesignPicture } from '@/components/ui/DesignPicture';

type Props = { params: Promise<{ locale: Locale }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'programs' });
  const m = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/programs', title: t('metaTitle'), description: t('metaDescription'), siteName: m('siteName') });
}

export default async function ProgramsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'programs' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const [cal, kids, ...rest] = programs;

  return (
    <>
      <section className="on-dark dark-sec blueprint">
        <div className="wrap pb-10 pt-10 lg:pt-14">
          <h1 className="t-1">{t('title')}</h1>
          <p className="lead mt-4 max-w-2xl">{t('intro')}</p>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          {/* Flagship + Kids lead; the rest follow at a smaller scale */}
          <div className="grid gap-6 lg:grid-cols-12">
            <Link href={cal.route} className="on-dark group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-lg bg-ink p-7 text-paper lg:col-span-7">
              <span className="absolute inset-0">
                {/* On phones the card (420 px tall) crops the 16:9 render, which is drawn about 750 px wide. */}
                <DesignPicture image={designImage(cal.imageId)} alt="" sizes="(max-width: 759px) and (min-resolution: 2.5dppx) 400px, (max-width: 759px) 600px, (min-width: 1024px) 58vw, 100vw" priority className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
              <span className="relative">
                <span className="tag text-accent">{t('flagship')}</span>
                <span className="display t-2 mt-3 block">{cal.title[locale]}</span>
                <span className="mt-2 block max-w-xl">{cal.summary[locale]}</span>
              </span>
            </Link>
            <Link href={kids.route} className="group flex flex-col overflow-hidden rounded-[28px] bg-white ring-1 ring-line hover:ring-ink lg:col-span-5">
              <span className="block aspect-video overflow-hidden">
                <DesignPicture image={designImage(kids.imageId)} alt="" sizes="(min-width: 1024px) 40vw, 100vw" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </span>
              <span className="mt-auto block p-6">
                <span className="text-[0.85rem] font-semibold text-mute">{c(`availability.${kids.availability}`)}</span>
                <span className="display t-3 mt-1 block">{kids.title[locale]}</span>
                <span className="mute mt-2 block">{kids.summary[locale]}</span>
              </span>
            </Link>
          </div>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {rest.map((p) => (
              <li key={p.id}>
                <Link href={p.route} className="group flex h-full flex-col rounded-lg border border-line bg-panel p-6 hover:border-ink">
                  <span className="text-[0.85rem] font-semibold text-mute">{c(`availability.${p.availability}`)}</span>
                  <span className="mt-1 text-[1.35rem] font-semibold leading-snug">{p.title[locale]}</span>
                  <span className="mute mt-2">{p.summary[locale]}</span>
                  <span className="link-arrow mt-auto pt-4">{c('viewProgram')}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href={registerHref({ src: 'program' })} className="btn btn-primary">
              {c('registerInterest')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
