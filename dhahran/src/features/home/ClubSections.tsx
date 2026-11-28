import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { designImage, programById } from '@/content';
import { achievements, coaches, media, partners, schedule, stories } from '@/content/club';
import { Rail } from '@/components/ui/Rail';
import { DesignPicture } from '@/components/ui/DesignPicture';
import { GalleryReel } from '@/features/gallery/GalleryReel';

type P = { locale: Locale; no: string };
/** Sections that need real club material can be previewed empty, but never appear empty in production. */
type Gated = P & { preview: boolean };

async function tr(locale: Locale) {
  return getTranslations({ locale, namespace: 'home' });
}

/** Marked placeholder: tells the owner exactly what to send. Previews only. */
function Awaiting({ label, needs, dark = false }: { label: string; needs: string; dark?: boolean }) {
  return (
    <div className={`awaiting ${dark ? 'awaiting-dark' : ''}`} data-testid="awaiting">
      <p className="awaiting-label">{label}</p>
      <p className="mt-2">{needs}</p>
    </div>
  );
}

function Teaser({ id, locale, wide = false }: { id: string; locale: Locale; wide?: boolean }) {
  const img = designImage(id);
  return (
    <div className={`teaser ${wide ? 'teaser-wide' : ''}`}>
      <DesignPicture image={img} alt={img.alt[locale]} sizes="(min-width: 1024px) 44vw, 100vw" className="h-full w-full object-cover" />
    </div>
  );
}

const WORDS = ['build', 'create', 'shape', 'think', 'start', 'connect'] as const;

/** Identity: the "Re." vocabulary and what the club believes. */
export async function Identity({ locale, no }: P) {
  const t = await tr(locale);
  return (
    <section className="sec border-y border-line bg-sand/50" aria-labelledby="identity-h">
      <div className="wrap">
        <Rail no={no} label={t('identity.rail')} />
        <h2 id="identity-h" className="t-1 mt-8 max-w-4xl">
          {t('identity.title')}
        </h2>
        <p className="lead mt-5 max-w-3xl">{t('identity.body')}</p>
        <ul className="re-words mt-10">
          {WORDS.map((k) => (
            <li key={k}>
              <span className="re-word ltr" lang="en">
                {t(`identity.words.${k}.w`)}
              </span>
              <span className="mt-2 block text-[1.15rem] font-semibold">{t(`identity.words.${k}.t`)}</span>
              <span className="mute mt-1 block">{t(`identity.words.${k}.d`)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="wrap mt-16">
        <h3 className="t-2 max-w-3xl">{t('identity.philosophyTitle')}</h3>
        <p className="lead mt-4 max-w-3xl">{t('identity.philosophyBody')}</p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(['one', 'two', 'three', 'four'] as const).map((k, i) => (
            <li key={k} className="border-t-4 border-ink pt-4">
              <span className="ltr font-[family-name:var(--font-latin)] text-accent-ink">{`0${i + 1}`}</span>
              <p className="mt-1 text-[1.2rem] font-semibold">{t(`identity.pillars.${k}.t`)}</p>
              <p className="mute mt-2">{t(`identity.pillars.${k}.d`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** How a member is handled from the first day: never lost. */
export async function Method({ locale, no }: P) {
  const t = await tr(locale);
  return (
    <section className="sec" aria-labelledby="method-h">
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5">
          <Rail no={no} label={t('method.rail')} />
          <h2 id="method-h" className="t-1 mt-8">
            {t('method.title')}
          </h2>
          <p className="lead mt-5">{t('method.body')}</p>
          <div className="mt-8">
            <Teaser id="t-rig" locale={locale} />
          </div>
        </div>
        <ol className="steps lg:col-span-7">
          {(['one', 'two', 'three', 'four', 'five'] as const).map((k, i) => (
            <li key={k}>
              <span className="steps-no ltr" aria-hidden="true">{`0${i + 1}`}</span>
              <span>
                <span className="block text-[1.3rem] font-semibold">{t(`method.steps.${k}.t`)}</span>
                <span className="mute mt-1 block">{t(`method.steps.${k}.d`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const OUTCOMES = ['weight', 'age', 'strength', 'pullup', 'muscleup', 'lifestyle', 'confidence', 'joy', 'mindset'] as const;

/** What changes for members — and, once supplied with consent, their own stories. */
export async function Outcomes({ locale, no, preview }: Gated) {
  const t = await tr(locale);
  return (
    <section className="sec" aria-labelledby="outcomes-h">
      <div className="wrap">
        <Rail no={no} label={t('outcomes.rail')} />
        <h2 id="outcomes-h" className="t-1 mt-8 max-w-4xl">
          {t('outcomes.title')}
        </h2>
        <p className="lead mt-5 max-w-3xl">{t('outcomes.body')}</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((k, i) => (
            <li key={k} className="outcome">
              <span className="ltr font-[family-name:var(--font-latin)] text-accent-ink">{String(i + 1).padStart(2, '0')}</span>
              <span className="mt-1 block text-[1.25rem] font-semibold">{t(`outcomes.items.${k}.t`)}</span>
              <span className="mute mt-1 block">{t(`outcomes.items.${k}.d`)}</span>
            </li>
          ))}
        </ul>
      </div>
      {(stories.length > 0 || preview) && (
        <div className="wrap mt-16" id="stories">
          <h3 className="t-2">{t('stories.title')}</h3>
          <p className="lead mt-3 max-w-3xl">{t('stories.body')}</p>
          {stories.length === 0 ? (
            <div className="mt-6">
              <Awaiting label={t('awaiting.label')} needs={t('awaiting.stories')} />
            </div>
          ) : (
            <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((s) => (
                <li key={s.id} className="story">
                  {s.video ? (
                    <video controls preload="none" playsInline poster={s.photo} className="story-media">
                      <source src={s.start ? `${s.video}#t=${s.start}` : s.video} type="video/mp4" />
                    </video>
                  ) : (
                    s.photo && <img src={s.photo} alt="" loading="lazy" decoding="async" className="story-media" />
                  )}
                  <blockquote className="p-5">
                    <p className="text-[1.08rem]">{locale === 'ar' ? `«${s.quote.ar}»` : `“${s.quote.en}”`}</p>
                    <footer className="mt-4 font-semibold">
                      {s.name[locale]}
                      {s.result && <span className="mt-1 block font-normal text-accent-ink">{s.result[locale]}</span>}
                    </footer>
                  </blockquote>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/** Coaches: certificates and experience. Hidden in production until supplied. */
export async function Coaches({ locale, no, preview }: Gated) {
  if (coaches.length === 0 && !preview) return null;
  const t = await tr(locale);
  return (
    <section className="on-dark dark-sec sec" aria-labelledby="coaches-h">
      <div className="wrap">
        <Rail no={no} label={t('coaches.rail')} />
        <h2 id="coaches-h" className="t-1 mt-8">
          {t('coaches.title')}
        </h2>
        <p className="lead mt-5 max-w-3xl">{t('coaches.body')}</p>
        {coaches.length === 0 ? (
          <div className="mt-8">
            <Awaiting dark label={t('awaiting.label')} needs={t('awaiting.coaches')} />
          </div>
        ) : (
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...coaches]
              .sort((x, y) => Number(!!y.lead) - Number(!!x.lead))
              .map((c) => (
                <li key={c.id} className={`coach ${c.lead ? 'coach-lead md:col-span-2 lg:col-span-3' : ''}`} data-testid={`coach-${c.id}`}>
                  {c.photo && <img src={c.photo} alt={c.name[locale]} loading="lazy" decoding="async" className="coach-photo" />}
                  <div className="coach-body">
                    <p className="text-accent font-semibold">{c.role[locale]}</p>
                    <p className="display t-1 mt-1">{c.name[locale]}</p>
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      {c.credentials[locale].length > 0 && (
                        <div>
                          <p className="eyebrow">{t('coaches.credentials')}</p>
                          <ul className="mt-3 grid gap-3">
                            {c.credentials[locale].map((x) => (
                              <li key={x} className="coach-title">
                                <span aria-hidden="true">🏆</span>
                                {x}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {c.experience[locale].length > 0 && (
                        <div>
                          <p className="eyebrow">{t('coaches.experience')}</p>
                          <ul className="mt-3 grid gap-2 text-[#d8d1ca]">
                            {c.experience[locale].map((x) => (
                              <li key={x} className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.72em] h-[3px] w-4 flex-none bg-accent" />
                                {x}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {c.message && (
                      <figure className="coach-message mt-8">
                        <figcaption className="eyebrow">{t('coaches.message')}</figcaption>
                        <blockquote className="mt-3 text-[1.08rem] leading-[1.95]">{locale === 'ar' ? `«${c.message.ar}»` : `“${c.message.en}”`}</blockquote>
                      </figure>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** The competing team, sponsorships, local championships and guests — plus the list of titles when supplied. */
export async function Team({ locale, no, preview }: Gated) {
  const t = await tr(locale);
  return (
    <section className="sec" aria-labelledby="team-h">
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <Rail no={no} label={t('team.rail')} />
          <h2 id="team-h" className="t-1 mt-8">
            {t('team.title')}
          </h2>
          <p className="lead mt-5">{t('team.body')}</p>
        </div>
        <div className="lg:col-span-6">
          <Teaser id="t-strength" locale={locale} />
        </div>
      </div>
      <div className="wrap mt-10">
        <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {(['one', 'two', 'three', 'four'] as const).map((k) => (
            <li key={k} className="border-t-2 border-accent pt-4">
              <p className="text-[1.15rem] font-semibold">{t(`team.items.${k}.t`)}</p>
              <p className="mute mt-2">{t(`team.items.${k}.d`)}</p>
            </li>
          ))}
        </ul>
      </div>
      {(achievements.length > 0 || preview) && (
        <div className="wrap mt-14">
          <h3 className="t-2">{t('team.achievementsTitle')}</h3>
          {achievements.length === 0 ? (
            <div className="mt-6">
              <Awaiting label={t('awaiting.label')} needs={t('awaiting.achievements')} />
            </div>
          ) : (
            <ol className="mt-6">
              {[...achievements]
                .sort((a, b) => b.year - a.year)
                .map((a) => (
                  <li key={a.id} className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-line py-4">
                    <span className="ltr font-[family-name:var(--font-latin)] text-[1.4rem] font-bold text-accent-ink">{a.year}</span>
                    <span className="text-[1.15rem] font-semibold">{a.title[locale]}</span>
                    {a.detail && <span className="mute">{a.detail[locale]}</span>}
                  </li>
                ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

const GROUPS = ['sessions', 'championships', 'community', 'kids', 'interviews', 'workshops'] as const;

/** Live photos and clips. Hidden in production until supplied. */
export async function Gallery({ locale, no, preview }: Gated) {
  if (media.length === 0 && !preview) return null;
  const t = await tr(locale);
  return (
    <section id="gallery" className="on-dark dark-sec sec scroll-mt-16" aria-labelledby="gallery-h">
      <div className="wrap">
        <Rail no={no} label={t('gallery.rail')} />
        <h2 id="gallery-h" className="t-1 mt-8">
          {t('gallery.title')}
        </h2>
        <p className="lead mt-5 max-w-3xl">{t('gallery.body')}</p>
        {media.length === 0 ? (
          <>
            <ul className="mt-8 flex flex-wrap gap-2">
              {GROUPS.map((g) => (
                <li key={g} className="rounded-full border border-line-dark px-4 py-1.5 font-semibold">
                  {t(`gallery.groups.${g}`)}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Awaiting dark label={t('awaiting.label')} needs={t('awaiting.gallery')} />
            </div>
          </>
        ) : (
          <div className="mt-8">
            <GalleryReel
              items={media.filter((m) => m.kind === 'video').map((m) => ({ id: m.id, group: m.group, src: m.src, poster: m.poster, caption: m.caption[locale] }))}
              groups={GROUPS.filter((g) => media.some((m) => m.group === g)).map((g) => ({ id: g, label: t(`gallery.groups.${g}`) }))}
              labels={{
                all: t('gallery.all'),
                play: t('gallery.play'),
                close: t('gallery.close'),
                prev: t('gallery.prev'),
                next: t('gallery.next'),
                scrollPrev: t('gallery.scrollPrev'),
                scrollNext: t('gallery.scrollNext'),
                count: t('gallery.count'),
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/** Around the training: recovery, workshops, partners, belonging. */
export async function Beyond({ locale, no, preview }: Gated) {
  const t = await tr(locale);
  return (
    <section className="sec border-y border-line bg-sand/50" aria-labelledby="beyond-h">
      <div className="wrap">
        <Rail no={no} label={t('beyond.rail')} />
        <h2 id="beyond-h" className="t-1 mt-8">
          {t('beyond.title')}
        </h2>
        <p className="lead mt-5 max-w-3xl">{t('beyond.body')}</p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(['recovery', 'workshops', 'partners', 'merch'] as const).map((k) => (
            <li key={k} className="rounded-lg border border-line bg-panel p-5">
              <p className="text-[1.2rem] font-semibold">{t(`beyond.items.${k}.t`)}</p>
              <p className="mute mt-2">{t(`beyond.items.${k}.d`)}</p>
            </li>
          ))}
        </ul>
      </div>
      {(partners.length > 0 || preview) && (
        <div className="wrap mt-12">
          <h3 className="t-3">{t('beyond.partnersTitle')}</h3>
          {partners.length === 0 ? (
            <div className="mt-5">
              <Awaiting label={t('awaiting.label')} needs={t('awaiting.partners')} />
            </div>
          ) : (
            <ul className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-5">
              {partners.map((p) => (
                <li key={p.id} className="text-[1.1rem] font-semibold">
                  {p.logo ? <img src={p.logo} alt={p.name[locale]} loading="lazy" decoding="async" className="h-12 w-auto" /> : p.name[locale]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/** Class times and packages. The timetable appears when supplied. */
export async function Schedule({ locale, no, preview }: Gated) {
  const t = await tr(locale);
  const arrow = <span className="arrow" aria-hidden="true">→</span>;
  return (
    <section className="sec" aria-labelledby="schedule-h">
      <div className="wrap">
        <Rail no={no} label={t('schedule.rail')} />
        <h2 id="schedule-h" className="t-1 mt-8">
          {t('schedule.title')}
        </h2>
        <p className="lead mt-5 max-w-3xl">{t('schedule.body')}</p>
        {schedule.length === 0 ? (
          preview && (
            <div className="mt-8">
              <Awaiting label={t('awaiting.label')} needs={t('awaiting.schedule')} />
            </div>
          )
        ) : (
          <ul className="mt-8">
            {schedule.map((s) => (
              <li key={s.id} className="grid gap-x-6 gap-y-1 border-t border-line py-4 sm:grid-cols-4">
                <span className="text-[1.1rem] font-semibold">{programById(s.programId)?.shortTitle[locale] ?? s.programId}</span>
                <span>{s.days[locale]}</span>
                <span className="ltr font-[family-name:var(--font-latin)] font-semibold">
                  {s.start} – {s.end}
                </span>
                <span className="mute">{s.audience[locale]}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/memberships" className="btn btn-dark mt-8">
          {t('schedule.memberships')} {arrow}
        </Link>
      </div>
    </section>
  );
}
