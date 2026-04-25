import type { ReactNode } from 'react';
import { findPublishedPageContent } from '@/lib/public-page-content';

export type PublishedPageSnapshot = Awaited<ReturnType<typeof findPublishedPageContent>>;

type Props = {
  pageKey: string;
  locale: string;
  children: ReactNode;
  /** When provided (including `null`), skips a duplicate CMS lookup — use after parallel fetch on hot paths. */
  cms?: PublishedPageSnapshot;
  /** Rendered below the CMS article when published body replaces default children (e.g. sector companies list). */
  belowPublishedBody?: ReactNode;
  /**
   * Division URLs already use `CompanyDivisionShell` top offset — avoid stacking a second tall hero
   * on about / services / contact / companies CMS pages.
   */
  underDivisionShell?: boolean;
};

export default async function ContentPageBoundary({
  pageKey,
  locale,
  children,
  cms,
  belowPublishedBody,
  underDivisionShell = false,
}: Props) {
  const content = cms !== undefined ? cms : await findPublishedPageContent(pageKey, locale);
  if (content && (content.title || content.body)) {
    const articlePad = underDivisionShell
      ? 'px-4 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-8 lg:px-8 lg:pb-10 lg:pt-6'
      : 'px-4 pt-20 pb-8 sm:px-6 sm:pt-20 sm:pb-10 lg:px-8 lg:pb-14 lg:pt-20';
    const titleClass = underDivisionShell
      ? 'mb-2 text-lg font-bold text-slate-900 sm:mb-3 sm:text-xl lg:text-2xl'
      : 'mb-3 text-xl font-bold text-slate-900 sm:mb-4 sm:text-2xl lg:text-3xl';
    return (
      <div className="min-h-screen bg-slate-50">
        <article className={`mx-auto max-w-4xl ${articlePad}`}>
          {content.title ? (
            <h1 className={titleClass}>
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
        {belowPublishedBody}
      </div>
    );
  }

  return <>{children}</>;
}
