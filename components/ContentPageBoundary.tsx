import type { ReactNode } from 'react';
import { findPublishedPageContent } from '@/lib/public-page-content';

type Props = {
  pageKey: string;
  locale: string;
  children: ReactNode;
};

export default async function ContentPageBoundary({ pageKey, locale, children }: Props) {
  const content = await findPublishedPageContent(pageKey, locale);
  if (content && (content.title || content.body)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          {content.title ? (
            <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:mb-6 sm:text-3xl lg:text-4xl">
              {content.title}
            </h1>
          ) : null}
          {content.body ? (
            <div
              className="prose prose-slate max-w-none prose-sm sm:prose-base lg:prose-lg"
              dangerouslySetInnerHTML={{ __html: content.body }}
            />
          ) : null}
        </article>
      </div>
    );
  }

  return <>{children}</>;
}
