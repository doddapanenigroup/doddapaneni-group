import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isFeatureEnabledSync } from '@/lib/features';
import BlogLivePreviewClient from '@/components/preview/BlogLivePreviewClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

export default async function BlogLivePreviewPage({ params }: Props) {
  if (!isFeatureEnabledSync('previewSharing')) {
    notFound();
  }
  const { locale } = await params;
  return <BlogLivePreviewClient locale={locale} />;
}
