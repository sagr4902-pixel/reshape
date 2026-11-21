'use client';

import { useParams } from 'next/navigation';

const COPY = {
  ar: { title: 'حدث خطأ', body: 'لم نتمكّن من عرض هذه الصفحة. حاول مرة أخرى.', retry: 'إعادة المحاولة', home: 'العودة إلى الرئيسية' },
  en: { title: 'Something went wrong', body: 'We could not display this page. Please try again.', retry: 'Try again', home: 'Back to home' },
};

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const locale = useParams()?.locale === 'en' ? 'en' : 'ar';
  const t = COPY[locale];
  return (
    <section className="sec">
      <div className="wrap max-w-2xl" role="alert">
        <h1 className="t-1">{t.title}</h1>
        <p className="lead mt-4">{t.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-dark">
            {t.retry}
          </button>
          <a href={`/${locale}`} className="btn btn-line">
            {t.home}
          </a>
        </div>
      </div>
    </section>
  );
}
