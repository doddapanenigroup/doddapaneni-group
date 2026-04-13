/** Public site path with mandatory `/{locale}` prefix (SEO static routes). */
export function publicPathWithLocale(locale: string, ...segments: string[]): string {
  const path = `/${segments.filter(Boolean).join('/')}`;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}
