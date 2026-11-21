const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

/** Convert Arabic-Indic and Persian digits to ASCII. */
export function toAsciiDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => {
    const a = ARABIC_INDIC.indexOf(ch);
    return String(a >= 0 ? a : PERSIAN.indexOf(ch));
  });
}

/**
 * Normalise a Saudi mobile number to E.164 (+9665XXXXXXXX) by shape only.
 * Accepts 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX, 009665XXXXXXXX, 9665XXXXXXXX,
 * with spaces, dashes, dots or parentheses. Returns null when the shape is wrong.
 * Light enough for the browser; the server additionally checks the current
 * numbering plan (see phone-strict.ts).
 */
export function normalizeSaudiMobileShape(raw: string): string | null {
  if (typeof raw !== 'string' || raw.length > 32) return null;
  let s = toAsciiDigits(raw).trim();
  if (/[^\d+\s\-().\u200e\u200f]/.test(s)) return null;
  const plus = s.startsWith('+');
  s = s.replace(/\D/g, '');
  if (plus) s = '+' + s;
  else if (s.startsWith('00')) s = '+' + s.slice(2);
  else if (s.startsWith('966')) s = '+' + s;
  else if (s.startsWith('05') && s.length === 10) s = '+966' + s.slice(1);
  else if (s.startsWith('5') && s.length === 9) s = '+966' + s;
  else return null;
  return /^\+9665\d{8}$/.test(s) ? s : null;
}
