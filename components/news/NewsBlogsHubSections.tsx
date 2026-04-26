import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import type { TranslateValues } from '@/lib/translation-format';
import { newsArticlePath, newsSectorListPath } from '@/lib/news-paths';
import { NEWS_PUBLIC_LINK_LOCALE } from '@/lib/news-ui-locale';
import type { NewsSectorPostItem } from '@/components/news/NewsSectorBlogList';

export type NewsHubSectionPayload = {
  slug: string;
  label: string;
  posts: NewsSectorPostItem[];
};

type TBlog = (key: string, values?: TranslateValues) => string;

type Props = {
  locale: string;
  sections: NewsHubSectionPayload[];
  t: TBlog;
};

function HubPostCard({
  locale,
  sectorSlug,
  sectorLabel,
  post,
  t,
}: {
  locale: string;
  sectorSlug: string;
  sectorLabel: string;
  post: NewsSectorPostItem;
  t: TBlog;
}) {
  const dateLine = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md">
      <Link
        href={newsArticlePath(sectorSlug, post.slug)}
        locale={NEWS_PUBLIC_LINK_LOCALE}
        className="flex h-full flex-col"
      >
        <div className="flex w-full shrink-0 justify-center bg-slate-100 leading-none">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              width={1200}
              height={800}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="h-auto w-full max-h-48 max-w-full object-contain object-center transition duration-300 group-hover:opacity-95 sm:max-h-52"
            />
          ) : (
            <div className="flex min-h-32 w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 sm:min-h-36">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90">{sectorLabel}</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{sectorLabel}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-blue-800 sm:text-base">
            {post.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{post.excerpt}</p>
          <p className="mt-2 text-xs font-semibold text-blue-800 sm:text-sm">{t('hubReadMore')}</p>
          <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-500 sm:text-xs">
            {dateLine ? <span>{dateLine}</span> : null}
            {dateLine ? <span className="mx-2 text-slate-300">·</span> : null}
            <span>{t('hubNoComments')}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}

export default function NewsBlogsHubSections({ locale, sections, t }: Props) {
  if (sections.length === 0) {
    return (
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center sm:px-5">
          <p className="text-base font-semibold text-slate-800">{t('emptySectorTitle')}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{t('emptySectorBody')}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-white">
      {sections.map((section, sectionIndex) => (
        <section
          key={section.slug}
          className={`border-b border-slate-200 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${
            sectionIndex % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
          }`}
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{section.label}</h2>
            {section.posts.length === 0 ? (
              <p className="mt-3 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">{t('emptySectorBody')}</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-4">
                {section.posts.map((post) => (
                  <HubPostCard
                    key={post.slug}
                    locale={locale}
                    sectorSlug={section.slug}
                    sectorLabel={section.label}
                    post={post}
                    t={t}
                  />
                ))}
              </div>
            )}
            <div className="mt-5">
              <Link
                href={newsSectorListPath(section.slug)}
                locale={NEWS_PUBLIC_LINK_LOCALE}
                className="inline-flex text-xs font-semibold text-blue-800 underline decoration-2 underline-offset-4 transition hover:text-blue-950 sm:text-sm"
              >
                {t('hubViewAll', { label: section.label })}
              </Link>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
