'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { mediaUrl } from '@/lib/media';

export default function LeftSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const companyName = "Doddapaneni Group";

  const handleLogoClick = () => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-24 md:w-32 z-40 flex flex-col items-center justify-start pt-6 bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-lg">
      <Link 
        href="/" 
        locale={locale} 
        className="flex-shrink-0 flex items-center justify-center group"
        onClick={handleLogoClick}
      >
        <Image
          src={mediaUrl('logo.webp')}
          alt={companyName}
          width={120}
          height={120}
          className="w-16 h-16 md:w-20 md:h-20 object-contain transition-transform group-hover:scale-105"
          priority
        />
      </Link>
    </aside>
  );
}
