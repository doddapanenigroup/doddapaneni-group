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
        className="group relative flex h-16 w-16 shrink-0 items-center justify-center md:h-20 md:w-20"
        onClick={handleLogoClick}
      >
        <Image
          src={mediaUrl('logo.webp')}
          alt={companyName}
          fill
          className="object-contain transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 64px, 80px"
          priority
        />
      </Link>
    </aside>
  );
}
