import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';

function disallowPathsForIndexing(): string[] {
  const out = new Set<string>(['/api/', '/private/']);

  /** Prefixed locale URLs plus legacy `/en/…` paths; English canonical paths are unprefixed (`/login`, …). */
  for (const locale of routing.locales) {
    out.add(`/${locale}/dashboard`);
    out.add(`/${locale}/login`);
    out.add(`/${locale}/preview`);
    out.add(`/${locale}/invite`);
  }

  /** Proxy may redirect these to `/{defaultLocale}/…`; disallow to avoid indexing duplicate paths. */
  out.add('/dashboard');
  out.add('/login');
  out.add('/preview');
  out.add('/invite');

  return [...out].sort((a, b) => a.localeCompare(b));
}

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: disallowPathsForIndexing(),
    },
    sitemap: `${origin}/sitemap.xml`,
    host: new URL(origin).host,
  };
}
