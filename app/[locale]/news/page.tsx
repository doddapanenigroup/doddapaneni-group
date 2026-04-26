import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { DEFAULT_LOCALE } from '@/i18n/locales';
import { localeFromRouteParam } from '@/lib/locale-from-path';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import { getSiteOrigin } from '@/lib/site-origin';
import { normalizeStoredImage } from '@/lib/sector-landing';
import { alternateLanguagesNewsCanonicalOnly } from '@/lib/sitemap-build';
import { canonicalDivisionDisplayName, orderedCompanyDivisionSlugsForBlogHub } from '@/lib/company-divisions';
import { getCompanyDivisionSectorsMap } from '@/lib/data/sector-repository';
import { listPublishedBlogsForSectorPage } from '@/lib/data/sector-blog-repository';
import { connectDb } from '@/lib/db';
import { publishScheduledContent } from '@/lib/publish-scheduled';
import NewsBlogsHubSections from '@/components/news/NewsBlogsHubSections';
import type { NewsHubSectionPayload } from '@/components/news/NewsBlogsHubSections';
import type { NewsSectorPostItem } from '@/components/news/NewsSectorBlogList';

export const revalidate = 120;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: paramLocale } = await params;
  const locale = routing.locales.includes(paramLocale as (typeof routing.locales)[number])
    ? paramLocale
    : routing.defaultLocale;
  const t = createTranslator(getDictionary(locale), 'Blog');
  const title = `${t('title')} | Doddapaneni Group`;
  const description = t('subtitle');
  const origin = getSiteOrigin();
  const path = publicPathForLocale(DEFAULT_LOCALE, '/news');
  const canonical = `${origin}${path}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: alternateLanguagesNewsCanonicalOnly(origin, '/news'),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Doddapaneni Group',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function NewsHubPage({ params }: Props) {
  const { locale: paramLocale } = await params;
  const locale = localeFromRouteParam(paramLocale);

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const t = createTranslator(getDictionary(locale), 'Blog');

  await connectDb();
  const now = new Date();
  if (process.env.NODE_ENV === 'production') {
    await publishScheduledContent(now);
  }

  const bySlug = await getCompanyDivisionSectorsMap();
  const ordered = orderedCompanyDivisionSlugsForBlogHub();

  const sections: NewsHubSectionPayload[] = [];

  for (const slug of ordered) {
    const sector = bySlug.get(slug);
    if (!sector?.isLive) continue;

    const label = canonicalDivisionDisplayName(sector.slug, sector.name);
    const { rows } = await listPublishedBlogsForSectorPage({
      sector,
      page: 1,
      pageSize: 4,
      now,
      locale,
    });

    const posts: NewsSectorPostItem[] = rows.map((r) => {
      const raw = (r.metaDescription?.trim() || r.ogDescription?.trim()) ?? '';
      const excerpt = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw || r.title;
      const readMinutes = Math.max(1, Math.ceil(excerpt.split(/\s+/).filter(Boolean).length / 220));
      return {
        slug: r.slug,
        title: r.title,
        excerpt,
        image: normalizeStoredImage(r.featuredImage),
        publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
        readTime: t('minReadMinutes', { minutes: readMinutes }),
      };
    });

    sections.push({ slug, label, posts });
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="relative overflow-hidden border-b border-blue-950/20 bg-blue-900 px-4 pt-20 pb-6 sm:px-6 sm:pt-20 sm:pb-8 md:pt-20 md:pb-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {t('title')}
          </h1>
        </div>
      </header>
      <div className="mt-6 border-t border-blue-100/80 sm:mt-8">
        <NewsBlogsHubSections locale={locale} sections={sections} t={t} />
      </div>
    </div>
  );
}
