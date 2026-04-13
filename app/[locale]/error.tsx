'use client';

import { useTranslations } from '@/lib/dictionary-react';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Error');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="bg-red-50 p-6 rounded-full mb-6 animate-pulse">
        <AlertTriangle className="h-16 w-16 text-red-500" />
      </div>
      
      <h2 className="text-3xl font-bold text-slate-900 mb-4">
        {t('title')}
      </h2>
      
      <p className="text-lg text-slate-600 max-w-md mb-8 leading-relaxed">
        {t('description')}
      </p>
      
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:-translate-y-1"
      >
        <RefreshCcw className="mr-2 h-5 w-5" />
        {t('retry')}
      </button>
    </div>
  );
}
