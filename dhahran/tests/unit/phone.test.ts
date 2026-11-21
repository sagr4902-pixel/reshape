import { describe, expect, it } from 'vitest';
import { normalizeSaudiMobileShape, toAsciiDigits } from '@/lib/phone';
import { normalizeSaudiMobile } from '@/lib/phone-strict';

describe('Saudi mobile normalisation', () => {
  const E164 = '+966512345678';
  it.each([
    ['0512345678'],
    ['512345678'],
    ['+966512345678'],
    ['00966512345678'],
    ['966512345678'],
    ['051 234 5678'],
    ['051-234-5678'],
    ['+966 (51) 234 5678'],
    ['٠٥١٢٣٤٥٦٧٨'], // Arabic-Indic digits
    ['۰۵۱۲۳۴۵۶۷۸'], // Persian digits
    ['+٩٦٦٥١٢٣٤٥٦٧٨'],
  ])('accepts %s', (input) => {
    expect(normalizeSaudiMobileShape(input)).toBe(E164);
    expect(normalizeSaudiMobile(input)).toBe(E164);
  });

  it.each([
    [''],
    ['12345'],
    ['0412345678'], // not a mobile prefix
    ['05123456789'], // too long
    ['051234567'], // too short
    ['+971512345678'], // other country
    ['0512345678; drop table'],
    ['05١٢٣٤٥٦٧٨x'],
    ['+966112345678'], // landline
    ['a'.repeat(40)],
  ])('rejects %s', (input) => {
    expect(normalizeSaudiMobileShape(input)).toBeNull();
    expect(normalizeSaudiMobile(input)).toBeNull();
  });

  it('converts digits without touching other characters', () => {
    expect(toAsciiDigits('٠١٢٣٤٥٦٧٨٩-۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789-0123456789');
  });
});
