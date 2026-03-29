import type { NewsArticle, NewsSector } from '@/lib/doddapaneni-news';
import LeadForm from './LeadForm';
import ContactForm from './ContactForm';

type Props = {
  sector: NewsSector;
  article: NewsArticle;
  articlePath: string;
};

export default function NewsDetail({ sector, article, articlePath }: Props) {
  return (
    <div className="bg-white">
      <section className="bg-blue-950 px-4 py-12 text-white sm:px-6 md:py-14 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">{sector.name}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{article.title}</h1>
          <p className="mt-3 text-sm text-blue-200">{article.readTime}</p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <article className="prose prose-slate mx-auto max-w-4xl prose-headings:tracking-tight prose-h2:mt-8 prose-h2:text-2xl prose-p:leading-relaxed">
          <p>{article.contentIntro}</p>
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
        </article>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
            <LeadForm
              sector={sector}
              articleTitle={article.title}
              articleSlug={article.slug}
              articlePath={articlePath}
            />
            <div className="hidden w-px bg-slate-300 lg:block" aria-hidden />
            <ContactForm
              sector={sector}
              articleTitle={article.title}
              articleSlug={article.slug}
              articlePath={articlePath}
            />
          </div>

          <div className="mt-6 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-6">
            <p className="rounded-full bg-white px-3 py-1.5 shadow-sm">We respect your privacy</p>
            <p className="rounded-full bg-white px-3 py-1.5 shadow-sm">No spam guarantee</p>
          </div>
        </div>
      </section>
    </div>
  );
}
