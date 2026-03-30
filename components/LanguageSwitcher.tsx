'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

/**
 * Locale-stripped pathname from next-intl (e.g. /about). Default locale has no URL prefix,
 * so this must stay in sync with router Link locale switching.
 */
function normalizedHref(pathname: string | null): string {
  if (!pathname || pathname.length === 0) return '/';
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export default function LanguageSwitcher({ isTransparent }: { isTransparent?: boolean }) {
  const pathname = usePathname();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const href = normalizedHref(pathname);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const languages = [
    { code: 'en' as const, name: 'English' },
    { code: 'hi' as const, name: 'हिंदी' },
    { code: 'te' as const, name: 'తెలుగు' },
    { code: 'es' as const, name: 'Español' },
  ];

  return (
    <div className="relative ml-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-2xl border border-transparent px-4 py-2 text-sm font-medium transition-all duration-200 hover:backdrop-blur-md hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100 ${
          isTransparent
            ? 'text-white hover:border-white/30 hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]'
            : 'text-blue-900 hover:border-blue-200/50 hover:bg-blue-500/10 hover:shadow-[0_8px_32px_0_rgba(30,58,138,0.1)]'
        }`}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe size={18} aria-hidden />
        <span className="uppercase">{locale}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            className={`absolute right-0 z-50 mt-2 max-h-[70vh] w-40 overflow-x-hidden overflow-y-auto rounded-2xl border shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] backdrop-blur-xl motion-reduce:animate-none animate-in fade-in slide-in-from-top-2 duration-200 ${
              isTransparent ? 'border-white/20 bg-slate-900/60' : 'border-slate-200 bg-white/90'
            }`}
            role="listbox"
            aria-label="Language options"
          >
            {languages.map((lang) =>
              locale === lang.code ? (
                <span
                  key={lang.code}
                  className={`block w-full px-4 py-3 text-sm font-bold ${
                    isTransparent ? 'bg-white/20 text-white' : 'bg-blue-50/50 text-blue-700'
                  }`}
                  role="option"
                  aria-selected
                >
                  {lang.name}
                </span>
              ) : (
                <Link
                  key={lang.code}
                  href={href}
                  locale={lang.code}
                  prefetch={false}
                  scroll={false}
                  replace
                  onClick={() => setIsOpen(false)}
                  className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                    isTransparent
                      ? 'text-white hover:bg-white/10'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900'
                  }`}
                  role="option"
                  aria-selected={false}
                >
                  {lang.name}
                </Link>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
