import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { env } from '@/lib/env';
import { site } from '@/content';

type Props = { params: Promise<{ locale: Locale }> };

// Prerendered per locale. Environment flags are read at build time (see docs/deployment.md).
export const dynamic = 'error';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  const m = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/privacy', title: t('metaTitle'), description: t('metaDescription'), siteName: m('siteName') });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'privacy' });
  const e = env();
  const plain = ['s3', 's4', 's5', 's6'] as const;
  return (
    <section className="sec">
      <div className="wrap max-w-3xl">
        <h1 className="t-1">{t('title')}</h1>
        <p className="mute mt-3">
          {t('version', { version: e.privacyNoticeVersion })}
        </p>
        {!e.privacyNoticeFinal && (
          <p className="mt-6 rounded-lg border-2 border-steel bg-white p-4 font-semibold" data-testid="privacy-draft">
            {t('draft')}
          </p>
        )}
        <div className="mt-10 space-y-9">
          <div>
            <h2 className="t-3">{t('s1.t')}</h2>
            <p className="mt-2">{t('s1.p', { cr: site.commercialRegistration.value })}</p>
          </div>
          <div>
            <h2 className="t-3">{t('s2.t')}</h2>
            <ul className="mt-2 list-disc space-y-1 ps-6">
              {(['a', 'b', 'c', 'd'] as const).map((k) => (
                <li key={k}>{t(`s2.items.${k}`)}</li>
              ))}
            </ul>
          </div>
          {plain.map((k) => (
            <div key={k}>
              <h2 className="t-3">{t(`${k}.t`)}</h2>
              <p className="mt-2">{t(`${k}.p`)}</p>
            </div>
          ))}
          <div>
            <h2 className="t-3">{t('s7.t')}</h2>
            <p className="mt-2">{t('s7.p')}</p>
            <p className="mt-2 font-semibold">
              {e.privacyContact ? (
                <>
                  {t('s7contact', { contact: '' })}
                  <bdi className="ltr">{e.privacyContact}</bdi>
                </>
              ) : (
                t('s7pending')
              )}
            </p>
          </div>
          {(['s8', 's9'] as const).map((k) => (
            <div key={k}>
              <h2 className="t-3">{t(`${k}.t`)}</h2>
              <p className="mt-2">{t(`${k}.p`)}</p>
            </div>
          ))}
          <p className="mute border-t border-line pt-6 text-[0.92rem]">{t('legal')}</p>
        </div>
      </div>
    </section>
  );
}
