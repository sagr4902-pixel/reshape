import type { Evidence } from '@/lib/catalog/types';

/**
 * Site-level facts. Only verified channels are shown publicly.
 * Not known (and therefore absent): Dhahran address, opening date, opening
 * hours, email, a Dhahran-specific phone number.
 */
const STORE_CHECK: Evidence = {
  status: 'verified',
  sourceUrl: 'https://reshape-sa.com/',
  verifiedAt: '2026-11-21T07:28:00Z',
  note: 'Shown in the official store footer. General RESHAPE channel — not confirmed as a Dhahran-specific line.',
};

export const site = {
  name: { ar: 'ريشيب الظهران', en: 'RESHAPE Dhahran' },
  fullName: { ar: 'نادي ريشيب الظهران', en: 'RESHAPE Dhahran' },
  city: { ar: 'الظهران، المملكة العربية السعودية', en: 'Dhahran, Saudi Arabia' },
  channels: {
    whatsapp: { e164: '+966575954545', url: 'https://wa.me/966575954545', evidence: STORE_CHECK },
    instagram: { handle: '@reshape.sa', url: 'https://www.instagram.com/reshape.sa', evidence: STORE_CHECK },
    store: { url: 'https://reshape-sa.com/', evidence: STORE_CHECK },
  },
  /** Commercial registration as displayed on the official store. */
  commercialRegistration: { value: '2050201542', evidence: STORE_CHECK },
  developer: {
    url: 'https://hija-tech-sa.com/',
    label: { ar: 'تطوير وتنفيذ مركز حِجَا', en: 'Designed & Developed by HIJA' },
  },
  /** Allow-list for outbound links rendered from content. */
  outboundHosts: ['reshape-sa.com', 'wa.me', 'www.instagram.com', 'hija-tech-sa.com'],
} as const;
