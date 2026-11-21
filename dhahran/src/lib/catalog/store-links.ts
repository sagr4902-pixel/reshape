/**
 * Official-store destinations. Only exact approved hostnames over HTTPS pass.
 * Parsed with URL — never string-prefix matching — so look-alikes such as
 * "reshape-sa.com.evil.example" or "reshape-sa.com@evil.example" fail.
 */
export const OFFICIAL_STORE_HOSTS = ['reshape-sa.com'] as const;
export const OFFICIAL_STORE_HOME = 'https://reshape-sa.com/';

export function isOfficialStoreUrl(input: unknown): boolean {
  if (typeof input !== 'string' || input.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.username === '' &&
    url.password === '' &&
    url.port === '' &&
    (OFFICIAL_STORE_HOSTS as readonly string[]).includes(url.hostname.toLowerCase())
  );
}
