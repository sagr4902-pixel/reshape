import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { registerHref, type PublicMembership } from '@/content';
import { formatPrice } from '@/lib/catalog/resolve';
import { ExternalLink } from '@/components/ui/ExternalLink';

/**
 * Renders whatever resolveMembershipAction() decided. No component decides
 * eligibility or price visibility on its own.
 */
export async function MembershipCta({
  membership,
  locale,
  programId,
  source,
  compact = false,
}: {
  membership: PublicMembership;
  locale: Locale;
  programId?: string;
  source: string;
  compact?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'memberships' });
  const a = membership.action;
  let price: string;
  if (a.kind === 'purchase' && a.price.kind === 'exact') {
    const tax = a.price.taxDisplay === 'included' ? ` · ${t('price.taxIncluded')}` : a.price.taxDisplay === 'excluded' ? ` · ${t('price.taxExcluded')}` : '';
    price = formatPrice(a.price.amountMinor, locale) + tax;
  } else if (a.kind === 'purchase') price = t('price.seeStore');
  else if (a.kind === 'unavailable') price = t('action.unavailable');
  else price = t('price.pending');

  return (
    <div data-testid={`membership-${membership.id}`} data-action={a.kind}>
      <p className={compact ? 'font-semibold' : 'text-[1.3rem] font-semibold leading-snug'}>{membership.title}</p>
      <p className={compact ? 'text-[0.92rem] text-mute-dark' : 'mute mt-1'}>{price}</p>
      {!compact &&
        (a.kind === 'purchase' ? (
          <ExternalLink href={a.url} event="membership_outbound_click" location={source} programId={programId} className="btn btn-primary mt-5">
            {t('action.purchase')}
            <span className="sr-only"> ({(await getTranslations({ locale, namespace: 'common' }))('opensNewTab')})</span>
          </ExternalLink>
        ) : (
          <Link href={registerHref({ program: programId, intent: 'membership-consultation', src: source })} className="btn btn-dark mt-5">
            {t('action.interest')}
          </Link>
        ))}
    </div>
  );
}
