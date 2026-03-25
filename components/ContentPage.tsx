'use client';

import { useState, useEffect } from 'react';

type ContentPageProps = {
  pageKey: string;
  locale: string;
  children: React.ReactNode;
};

export default function ContentPage({ pageKey, locale, children }: ContentPageProps) {
  const [content, setContent] = useState<{ title: string; body: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Show children immediately, fetch content in background
    setLoading(false);
    
    (async () => {
      try {
        const res = await fetch(`/api/content/${pageKey}?locale=${encodeURIComponent(locale)}`, {
          // Use cache for faster loads
          cache: 'force-cache',
          next: { revalidate: 60 },
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        if (!cancelled && data && (data.title !== undefined || data.body !== undefined)) {
          setContent({ title: data.title ?? '', body: data.body ?? '' });
        }
      } catch {
        if (!cancelled) setContent(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pageKey, locale]);

  // Show children immediately, don't block rendering
  if (content && (content.title || content.body)) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          {content.title && (
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
              {content.title}
            </h1>
          )}
          {content.body && (
            <div
              className="prose prose-slate max-w-none prose-sm sm:prose-base lg:prose-lg"
              dangerouslySetInnerHTML={{ __html: content.body }}
            />
          )}
        </article>
      </div>
    );
  }

  return <>{children}</>;
}
