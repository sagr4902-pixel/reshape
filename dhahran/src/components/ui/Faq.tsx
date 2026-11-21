import type { Locale } from '@/i18n/routing';
import type { Program } from '@/lib/catalog/types';

export function FaqList({ faqs, locale, dark = false }: { faqs: Program['faqs']; locale: Locale; dark?: boolean }) {
  return (
    <div className={`divide-y ${dark ? 'divide-line-dark border-line-dark' : 'divide-line border-line'} border-y`}>
      {faqs.map((f) => (
        <details key={f.q.en} className="group">
          <summary className="flex min-h-14 list-none items-center justify-between gap-4 py-3 text-[1.08rem] font-semibold [&::-webkit-details-marker]:hidden">
            <span>{f.q[locale]}</span>
            <span aria-hidden="true" className="grid h-8 w-8 flex-none place-items-center rounded-full border-2 border-current text-lg leading-none transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="pb-5 pe-12">{f.a[locale]}</p>
        </details>
      ))}
    </div>
  );
}
