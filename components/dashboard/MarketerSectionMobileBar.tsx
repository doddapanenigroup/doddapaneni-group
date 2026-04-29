'use client';

import { BookOpen, Image as ImageIcon, FileText } from 'lucide-react';
import { useMarketerNavOptional } from '@/components/dashboard/MarketerNavProvider';

function btnClass(active: boolean) {
  return [
    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
    active
      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm dark:border-indigo-500 dark:bg-indigo-500'
      : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ].join(' ');
}

export default function MarketerSectionMobileBar() {
  const nav = useMarketerNavOptional();
  if (!nav || (!nav.caps.canBlogs && !nav.caps.canPages)) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-wrap gap-2 px-4 pb-2 sm:px-6 lg:px-8 xl:hidden">
      {nav.caps.canBlogs ? (
        <button
          type="button"
          onClick={() => nav.setSection('blogs')}
          className={btnClass(nav.section === 'blogs')}
        >
          <BookOpen size={14} className="shrink-0 opacity-90" aria-hidden />
          Blogs
        </button>
      ) : null}
      {nav.caps.canBlogs || nav.caps.canPages ? (
        <button
          type="button"
          onClick={() => nav.setSection('media')}
          className={btnClass(nav.section === 'media')}
        >
          <ImageIcon size={14} className="shrink-0 opacity-90" aria-hidden />
          Media library
        </button>
      ) : null}
      {nav.caps.canPages ? (
        <button
          type="button"
          onClick={() => nav.setSection('pages')}
          className={btnClass(nav.section === 'pages')}
        >
          <FileText size={14} className="shrink-0 opacity-90" aria-hidden />
          Pages
        </button>
      ) : null}
    </div>
  );
}
