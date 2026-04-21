import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getSiteOrigin } from '@/lib/site-origin';

/**
 * Disallow paths aligned with public `robots.txt` policy (dashboard, auth, API, previews).
 * Order is stable for readability; crawlers treat these as a set of rules, not sequence-sensitive.
 */
function disallowPathsForIndexing(): string[] {
  const localeDisallows: string[] = [];
  for (const locale of routing.locales) {
    localeDisallows.push(
      `/${locale}/dashboard`,
      `/${locale}/login`,
      `/${locale}/invite`,
      `/${locale}/preview`,
    );
  }

  return [
    '/api/',
    '/private/',
    '/dashboard',
    '/login',
    '/invite',
    '/preview',
    ...localeDisallows,
  ];
}

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/*.js$', '/*.css$'],
      disallow: disallowPathsForIndexing(),
    },
    sitemap: `${origin}/sitemap.xml`,
    host: new URL(origin).host,
  };
}
