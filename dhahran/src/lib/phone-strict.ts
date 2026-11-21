import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile';
import { normalizeSaudiMobileShape } from './phone';

/**
 * Authoritative Saudi mobile normalisation: shape check plus validation
 * against the maintained numbering-plan metadata. Returns E.164 or null.
 * A syntactically valid number is not proof of ownership or reachability.
 */
export function normalizeSaudiMobile(raw: string): string | null {
  const shaped = normalizeSaudiMobileShape(raw);
  if (!shaped) return null;
  const parsed = parsePhoneNumberFromString(shaped, 'SA');
  if (!parsed || parsed.country !== 'SA' || !parsed.isValid()) return null;
  return parsed.number;
}
