import { mediaUrl } from '@/lib/media';

export const BLOG_LIVE_PREVIEW_MSG_V = 1 as const;

export function blogLivePreviewChannelName(channelId: string): string {
  return `blog-live-preview:${channelId}`;
}

export type BlogLivePreviewPayload = {
  title: string;
  content: string;
  featuredImage: string | null;
  slug: string;
};

export type BlogLivePreviewMessage = {
  v: typeof BLOG_LIVE_PREVIEW_MSG_V;
  payload: BlogLivePreviewPayload;
};

export function normalizeBlogPreviewImage(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;
  if (s.startsWith('/api/media/')) return s;
  if (s.startsWith('api/media/')) return `/${s}`;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s);
      if (u.pathname.startsWith('/api/media/')) return u.pathname;
    } catch {
      // ignore
    }
    return s;
  }
  return mediaUrl(s.startsWith('/') ? s.slice(1) : s);
}
