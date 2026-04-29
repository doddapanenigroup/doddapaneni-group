'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BlogPostClient from '@/app/[locale]/news/[slug]/BlogPostClient';
import {
  blogLivePreviewChannelName,
  normalizeBlogPreviewImage,
  type BlogLivePreviewMessage,
  type BlogLivePreviewPayload,
} from '@/lib/blog-live-preview';

const emptyPayload: BlogLivePreviewPayload = {
  title: 'Live preview',
  content: '<p>Waiting for the editor…</p>',
  featuredImage: null,
  slug: '',
};

function BlogLivePreviewInner({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('ch')?.trim() ?? '';
  const [payload, setPayload] = useState<BlogLivePreviewPayload>(emptyPayload);

  useEffect(() => {
    if (!channelId) return;
    const name = blogLivePreviewChannelName(channelId);
    const bc = new BroadcastChannel(name);
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as BlogLivePreviewMessage | undefined;
      if (!data || data.v !== 1 || !data.payload) return;
      setPayload(data.payload);
    };
    bc.addEventListener('message', onMessage);
    return () => {
      bc.removeEventListener('message', onMessage);
      bc.close();
    };
  }, [channelId]);

  const image = useMemo(() => normalizeBlogPreviewImage(payload.featuredImage), [payload.featuredImage]);

  const plain = payload.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const readMinutes = Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 220));

  const slugSegment = payload.slug.trim() || 'draft';

  if (!channelId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-center text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <p className="text-sm font-medium">Missing preview session</p>
        <p className="mt-2 text-xs text-slate-500">Open Preview from the blog editor again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-amber-200/80 bg-amber-50/95 px-4 py-2 text-center text-xs font-medium text-amber-950 backdrop-blur-sm dark:border-amber-900/50 dark:bg-amber-950/90 dark:text-amber-100">
        Live preview — updates as you edit in the dashboard. Save or publish when ready.
      </div>
      <BlogPostClient
        locale={locale}
        blogContent={payload.content}
        backToBlog="Back to News"
        title={payload.title.trim() || 'Untitled'}
        category="News"
        readTime={`${readMinutes} min read`}
        image={image}
        publishedAt={null}
        articlePathname={`/news/${slugSegment}`}
        articleSlug={slugSegment}
        showEngagement={false}
      />
    </div>
  );
}

export default function BlogLivePreviewClient({ locale }: { locale: string }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-16 text-center text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
          Loading preview…
        </div>
      }
    >
      <BlogLivePreviewInner locale={locale} />
    </Suspense>
  );
}
