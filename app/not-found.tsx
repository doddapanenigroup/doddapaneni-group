import Link from 'next/link';
import { fontBodyClassNames } from '@/app/fonts';
import { publicPathWithLocale } from '@/lib/sector-landing';
import { routing } from '@/i18n/routing';

/**
 * Global fallback when `notFound()` is invoked outside the `[locale]` segment tree,
 * or for unknown paths (e.g. removed `/sitemap.xml`). Must not render `<html>` / `<body>` —
 * `app/layout.tsx` already provides the document shell.
 */
export default function GlobalNotFound() {
  const home = publicPathWithLocale(routing.defaultLocale);

  return (
    <div
      className={`${fontBodyClassNames} flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center text-slate-800 antialiased`}
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Page not found</h1>
      <p className="mt-3 max-w-md text-slate-600">
        The link may be broken or the page may have been moved. Try the homepage or check the URL.
      </p>
      <Link
        href={home}
        className="mt-8 inline-flex rounded-lg bg-blue-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        Go to homepage
      </Link>
    </div>
  );
}
