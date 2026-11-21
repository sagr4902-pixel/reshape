import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <section className="sec">
      <div className="wrap max-w-2xl">
        <p className="ltr font-[family-name:var(--font-latin)] text-5xl text-accent-ink">404</p>
        <h1 className="t-1 mt-2">{t('notFoundTitle')}</h1>
        <p className="lead mt-4">{t('notFoundBody')}</p>
        <Link href="/" className="btn btn-dark mt-8">
          {t('home')}
        </Link>
      </div>
    </section>
  );
}
