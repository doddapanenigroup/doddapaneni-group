'use client';

import { Link, usePathname } from '@/i18n/routing';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import {
  COMPANY_DIVISION_SLUGS,
  activeCompanyDivisionSlugFromPathname,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';

const EMPTY_SECTOR_LIVE: Record<string, boolean> = Object.fromEntries(
  COMPANY_DIVISION_SLUGS.map((slug) => [slug, false]),
);

function sectorLiveMapFromApiPayload(d: { sectors?: unknown }): Record<string, boolean> {
  const rows = Array.isArray(d?.sectors) ? d.sectors : [];
  const map: Record<string, boolean> = { ...EMPTY_SECTOR_LIVE };
  for (const s of rows) {
    if (s && typeof s === 'object' && typeof (s as { slug?: unknown }).slug === 'string') {
      const key = String((s as { slug: string }).slug)
        .trim()
        .toLowerCase();
      if (key in map) {
        map[key] = Boolean((s as { isLive?: unknown }).isLive);
      }
    }
  }
  return map;
}

const SECTOR_POLL_MS = 5000;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [mobileCompaniesOpen, setMobileCompaniesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sectorLive, setSectorLive] = useState<Record<string, boolean>>(() => ({ ...EMPTY_SECTOR_LIVE }));
  /** False until first successful fetch — avoids showing every sector as “Coming soon” while data loads. */
  const [sectorLiveReady, setSectorLiveReady] = useState(false);
  const thresholdRef = useRef(300);
  const companiesRef = useRef<HTMLDivElement>(null);
  const closeMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations('Navbar');
  const tDivision = useTranslations('DivisionLabels');
  const companyName = 'Doddapaneni Group';
  const pathname = usePathname();

  const activeDivisionSlug = useMemo(
    () => activeCompanyDivisionSlugFromPathname(pathname),
    [pathname],
  );
  const isOnGroupCompany = activeDivisionSlug !== null;

  const loadLatestSectors = useCallback(async () => {
    try {
      const r = await fetch('/api/public/sectors', { cache: 'no-store' });
      if (!r.ok) throw new Error('sectors');
      const d = (await r.json()) as { sectors?: unknown };
      setSectorLive(sectorLiveMapFromApiPayload(d));
      setSectorLiveReady(true);
    } catch {
      /* keep last good map; do not flip everything to “coming soon” on a transient error */
    }
  }, []);

  useEffect(() => {
    void loadLatestSectors();
    const id = window.setInterval(() => void loadLatestSectors(), SECTOR_POLL_MS);
    return () => window.clearInterval(id);
  }, [loadLatestSectors]);

  const openCompaniesMenu = () => {
    void loadLatestSectors();
    if (closeMenuTimerRef.current) {
      clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
    setCompaniesOpen(true);
  };

  const scheduleCloseCompaniesMenu = () => {
    if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
    closeMenuTimerRef.current = setTimeout(() => {
      setCompaniesOpen(false);
      closeMenuTimerRef.current = null;
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const updateThreshold = () => {
      const heroSection = document.querySelector('section');
      if (heroSection) {
        thresholdRef.current = heroSection.offsetHeight - 90;
      } else {
        thresholdRef.current = 0;
      }
    };

    updateThreshold();
    window.addEventListener('resize', updateThreshold);

    const handleScroll = () => {
      setScrolled(window.scrollY > thresholdRef.current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateThreshold);
    };
  }, []);

  useEffect(() => {
    if (!companiesOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCompaniesOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [companiesOpen]);

  const isTransparent = !scrolled;
  const navbarClasses = isTransparent ? 'bg-transparent border-transparent' : 'bg-transparent backdrop-blur-xl shadow-none';

  const mobileButtonClass = isTransparent
    ? 'text-white hover:bg-white/10'
    : 'text-blue-900 hover:bg-blue-100';

  const handleLogoClick = () => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/about', label: t('about') },
    { href: '/news', label: t('blog') },
    { href: '/contact', label: t('contact') },
  ];
  const navBeforeMega = navLinks.slice(0, 2);
  const navAfterMega = navLinks.slice(2);

  const linkBaseClass = `px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 hover:backdrop-blur-md hover:scale-105 border border-transparent ${
    isTransparent
      ? 'text-white hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] hover:border-white/30'
      : 'text-blue-900 hover:bg-blue-100 hover:shadow-[0_8px_32px_0_rgba(30,58,138,0.1)] hover:border-blue-200/50'
  }`;

  const companiesTriggerClass = `${linkBaseClass} inline-flex items-center gap-1 ${
    isOnGroupCompany
      ? isTransparent
        ? 'bg-white/15 border-white/25 shadow-[0_4px_24px_rgba(255,255,255,0.12)]'
        : 'bg-blue-50 border-blue-200/60 shadow-sm'
      : ''
  } ${companiesOpen ? (isTransparent ? 'bg-white/20 border-white/30' : 'bg-blue-100/90 border-blue-200') : ''}`;

  const inset = 'px-5 sm:px-8 lg:px-12 xl:px-16';

  const renderCompanyRows = (onNavigate?: () => void, mobile = false) => {
    if (!sectorLiveReady) {
      return (
        <div className={mobile ? 'py-6 px-3 text-center text-sm text-slate-500' : 'py-8 px-4 text-center text-sm text-slate-500'}>
          {t('sectorLiveLoading')}
        </div>
      );
    }

    return (
      <ul
        className={
          mobile
            ? 'space-y-0.5 py-1'
            : 'grid grid-cols-1 gap-0.5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-0.5 sm:items-start py-3 px-3 sm:px-4'
        }
      >
        {COMPANY_DIVISION_SLUGS.map((slug) => {
          const isActiveHere = activeDivisionSlug === slug;
          const isLive = sectorLive[slug] ?? false;
          const label = tDivision(slug as CompanyDivisionSlug);

          if (isLive) {
            return (
              <li key={slug} className={mobile ? undefined : 'min-w-0'}>
                <Link
                  href={`/${slug}`}
                  onClick={() => {
                    setCompaniesOpen(false);
                    onNavigate?.();
                  }}
                  className={`flex items-start gap-3 px-3 py-2.5 text-sm transition-colors ${
                    mobile ? 'rounded-lg' : 'rounded-lg'
                  } ${
                    isActiveHere
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="min-w-0 flex-1 break-words leading-snug">{label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={slug}>
              <div
                className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2.5 text-sm rounded-lg ${
                  isActiveHere
                    ? 'border-l-2 border-blue-600 bg-blue-50/90 text-slate-800'
                    : 'text-slate-400'
                } ${mobile ? '' : ''}`}
              >
                <span
                  className={`min-w-0 flex-1 break-words leading-snug ${isActiveHere ? 'font-semibold text-slate-900' : 'text-slate-500'}`}
                >
                  {label}
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('comingSoonNav')}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navbarClasses}`}>
      <div className={`flex h-16 w-full items-center justify-between ${inset}`}>
        <div className="flex min-w-0 items-center">
          <Link
            href="/"
            className="group relative flex h-16 w-[160px] shrink-0 items-center"
            onClick={handleLogoClick}
          >
            <Image
              src="/logo.webp"
              alt={companyName}
              width={160}
              height={64}
              className="h-16 w-[160px] object-contain object-left"
              sizes="(max-width: 640px) 160px, 160px"
              priority
            />
          </Link>
        </div>
        <div className="hidden shrink-0 items-center space-x-6 md:flex md:space-x-8">
          {navBeforeMega
            .filter((link) => link.href !== pathname)
            .map((link) => (
              <Link key={link.href} href={link.href} className={linkBaseClass}>
                {link.label}
              </Link>
            ))}
          <div
            className="relative"
            ref={companiesRef}
            onMouseEnter={openCompaniesMenu}
            onMouseLeave={scheduleCloseCompaniesMenu}
          >
            <button
              type="button"
              className={companiesTriggerClass}
              aria-expanded={companiesOpen}
              aria-haspopup="true"
              onFocus={openCompaniesMenu}
              onClick={(e) => {
                e.preventDefault();
                openCompaniesMenu();
              }}
            >
              {t('ourCompanies')}
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${companiesOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {companiesOpen ? (
              <div
                className={`fixed inset-x-0 top-16 z-[60] ${inset} pt-2`}
                role="region"
                aria-label={t('ourCompanies')}
                onMouseEnter={openCompaniesMenu}
                onMouseLeave={scheduleCloseCompaniesMenu}
              >
                <div className="ml-auto max-h-[min(32rem,calc(100vh-8rem))] w-[min(36rem,calc(100%-0.5rem))] sm:w-[min(42rem,calc(100%-1rem))] lg:w-[min(56rem,calc(100%-1.5rem))] overflow-y-auto overscroll-contain">
                  <div className="rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5">
                    {renderCompanyRows()}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          {navAfterMega
            .filter((link) => link.href !== pathname)
            .map((link) => (
              <Link key={link.href} href={link.href} className={linkBaseClass}>
                {link.label}
              </Link>
            ))}
          <LanguageSwitcher isTransparent={isTransparent} />
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4 md:hidden">
          <LanguageSwitcher isTransparent={isTransparent} />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center justify-center rounded-md p-2 transition-colors focus:outline-none ${mobileButtonClass}`}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-gray-100 md:hidden">
          <div className={`${inset} space-y-1 bg-white/95 py-2 pb-4 pt-2 backdrop-blur-lg`}>
            {navBeforeMega
              .filter((link) => link.href !== pathname)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-900"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            <div className="border-t border-slate-100 pt-1">
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-base font-medium hover:bg-slate-50 ${
                  isOnGroupCompany ? 'bg-blue-50 text-blue-950' : 'text-slate-800'
                }`}
                onClick={() => setMobileCompaniesOpen((o) => !o)}
                aria-expanded={mobileCompaniesOpen}
              >
                {t('ourCompanies')}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${mobileCompaniesOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {mobileCompaniesOpen ? (
                <div className="border-l-2 border-blue-100 bg-slate-50/80 pl-2">
                  {renderCompanyRows(() => setIsOpen(false), true)}
                </div>
              ) : null}
            </div>
            {navAfterMega
              .filter((link) => link.href !== pathname)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-900"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
