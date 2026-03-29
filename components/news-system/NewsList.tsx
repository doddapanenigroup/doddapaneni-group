import { Link } from '@/i18n/routing';
import type { NewsArticle, NewsSector } from '@/lib/doddapaneni-news';

type Props = {
  locale: string;
  sector: NewsSector;
  articles: NewsArticle[];
};

export default function NewsList({ locale, sector, articles }: Props) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-200">
          {articles.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/doddapaneni/${sector.slug}/news/${post.slug}`}
                locale={locale}
                className="block px-5 py-5 transition-colors hover:bg-slate-50 sm:px-6"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-blue-800">{post.readTime}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
