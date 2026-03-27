import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';

function disallowPathsForIndexing(): string[] {
  const out = new Set<string>([
    '/api/',
    '/dashboard',
    '/login',
    '/preview',
    '/invite',
    '/private/',
  ]);

  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    out.add(`/${locale}/dashboard`);
    out.add(`/${locale}/login`);
    out.add(`/${locale}/preview`);
    out.add(`/${locale}/invite`);
  }

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
