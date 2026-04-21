'use client';

export default function GoogleSnippetPreview({
  title,
  description,
  url,
  ogImage,
}: {
  title: string;
  description: string;
  url: string;
  ogImage?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Google preview
      </p>
      <p className="truncate text-sm text-emerald-700 dark:text-emerald-400">{url || 'https://example.com/page-url'}</p>
      <p className="truncate text-[18px] leading-6 text-blue-700 hover:underline dark:text-blue-400">
        {title || 'Your page title appears here'}
      </p>
      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
        {description || 'Your meta description appears here for search users.'}
      </p>
      {ogImage ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ogImage} alt="OG preview" className="h-28 w-full bg-slate-100 object-cover dark:bg-slate-800" />
        </div>
      ) : null}
    </div>
  );
}
