'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-blue-900 mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">{t('title')}</h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        {t('description')}
      </p>
      <Link href="/" className="bg-blue-900 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-800 transition duration-300">
        {t('homeButton')}
      </Link>
    </div>
  );
}
