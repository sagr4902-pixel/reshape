import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { env } from '@/lib/env';
import { programById, programIds, programs, site, zoneIds } from '@/content';
import { INTENTS, SOURCES, type Intent } from '@/lib/catalog/types';
import { HELP_ME_CHOOSE } from '@/features/leads/constants';
import { LeadForm, type LeadFormLabels } from '@/features/leads/LeadForm';
import { ExternalLink } from '@/components/ui/ExternalLink';

type SP = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'register' });
  const m = await getTranslations({ locale, namespace: 'meta' });
  // Context query strings never create new indexable documents.
  return pageMetadata({ locale, path: '/register', title: t('metaTitle'), description: t('metaDescription'), siteName: m('siteName'), noindex: true });
}

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const e = env();
  const t = await getTranslations({ locale, namespace: 'register' });
  const c = await getTranslations({ locale, namespace: 'contact' });

  // Context arrives as IDs only and is checked against allow-lists; unknown values are ignored.
  const qp = one(sp.program);
  const programId = qp && programIds.includes(qp) ? qp : HELP_ME_CHOOSE;
  const program = programById(programId);
  const qi = one(sp.intent);
  const intent: Intent = qi && (INTENTS as readonly string[]).includes(qi) ? (qi as Intent) : (program?.ctaIntent ?? (e.launchStage === 'preopening' ? 'preopening-updates' : 'general-interest'));
  const qz = one(sp.zone);
  const zoneId = qz && zoneIds.includes(qz) ? qz : undefined;
  const qs = one(sp.src);
  const source = qs && (SOURCES as readonly string[]).includes(qs) ? qs : undefined;

  const labels: LeadFormLabels = {
    requiredNote: t('requiredNote'),
    required: t('required'),
    optional: t('optional'),
    name: t('name.label'),
    nameGuardian: t('name.labelGuardian'),
    nameHint: t('name.hint'),
    phone: t('phone.label'),
    phoneHint: t('phone.hint'),
    program: t('program.label'),
    programHelp: t('program.help'),
    intent: t('intent.label'),
    intents: Object.fromEntries(INTENTS.map((i) => [i, t(`intent.${i}`)])),
    trialNote: t('trialNote'),
    comment: t('comment.label'),
    commentHint: t('comment.hint'),
    privacy: t('privacy.label'),
    privacyLink: t('privacy.link'),
    marketing: t('marketing.label'),
    honeypot: t('honeypot'),
    submit: t('submit'),
    submitting: t('submitting'),
    errors: {
      summary: t('errors.summary'),
      name: t('errors.name'),
      phone: t('errors.phone'),
      program: t('errors.program'),
      intent: t('errors.intent'),
      comment: t('errors.comment'),
      privacy: t('errors.privacy'),
      network: t('errors.network'),
      unavailable: t('errors.unavailable'),
      rate: t('errors.rate'),
      conflict: t('errors.conflict'),
      generic: t('errors.generic'),
    },
    successTitle: t('success.title'),
    successBody: t('success.body'),
    again: t('success.again'),
    explore: t('success.explore'),
  };

  const whatsapp = (
    <ExternalLink href={site.channels.whatsapp.url} event="contact_click" location="register" className="btn btn-dark">
      {c('whatsapp')} <bdi className="ltr">{site.channels.whatsapp.e164}</bdi>
    </ExternalLink>
  );

  return (
    <section className="sec">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="t-1">{t('title')}</h1>
          <div className="bar mt-6 w-[min(100%,300px)]" aria-hidden="true" />
          <p className="lead mt-9">{t('intro')}</p>
          {program && (
            <p className="mt-6 rounded-lg bg-sand/70 p-4" data-testid="register-context">
              <span className="font-semibold">{t('contextProgram', { program: program.title[locale] })}</span>
              <span className="mute block text-[0.92rem]">{t('contextChange')}</span>
            </p>
          )}
        </div>
        <div className="lg:col-span-7">
          {e.leadsEnabled ? (
            <div className="rounded-lg border border-line bg-panel p-5 sm:p-8">
              {!e.privacyNoticeFinal && (
                <p className="mb-6 rounded border border-steel bg-white px-3 py-2 text-[0.9rem]" data-testid="draft-notice">
                  {t('draftNotice')}
                </p>
              )}
              <LeadForm
                locale={locale}
                labels={labels}
                programs={programs.map((p) => ({ id: p.id, title: p.title[locale], guardian: p.audiences.includes('guardian') && !p.audiences.includes('adult') && p.id !== 'football-performance' }))}
                intents={INTENTS}
                initial={{ programId, intent, zoneId, source }}
                noticeVersion={e.privacyNoticeVersion}
              />
              <noscript>
                <p className="mt-6 rounded border-2 border-ink p-4">{t('noscript')}</p>
                <p className="mt-3">{whatsapp}</p>
              </noscript>
            </div>
          ) : (
            // Honest unavailable state: no form, no fake success.
            <div className="rounded-lg border-2 border-ink bg-panel p-6 sm:p-8" data-testid="lead-unavailable">
              <h2 className="t-3">{t('unavailable.title')}</h2>
              <p className="mt-3">{t('unavailable.body')}</p>
              <div className="mt-6">{whatsapp}</div>
              {e.appEnv !== 'production' && <p className="mute mt-6 text-[0.85rem]">{t('unavailable.previewNote')}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
