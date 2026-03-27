'use client';

import { Link, usePathname } from '@/i18n/routing';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import { mediaUrl } from '@/lib/media';
import {
  getCompanyDivisionNavItems,
  activeCompanyDivisionSlugFromPathname,
} from '@/lib/company-divisions';

const COMPANIES_NAV = getCompanyDivisionNavItems();

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [mobileCompaniesOpen, setMobileCompaniesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const thresholdRef = useRef(300);
  const companiesRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('Navbar');
  const companyName = 'Doddapaneni Group';
  const pathname = usePathname();
  const locale = useLocale();

  const activeDivisionSlug = useMemo(
    () => activeCompanyDivisionSlugFromPathname(pathname),
    [pathname],
  );
  const isOnGroupCompany = activeDivisionSlug !== null;

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

    const close = () => setCompaniesOpen(false);

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = companiesRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
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
    { href: '/services', label: t('services') },
    { href: '/blog', label: t('blog') },
    { href: '/contact', label: t('contact') },
  ];
  const navBeforeCompanies = navLinks.slice(0, 3);
  const navAfterCompanies = navLinks.slice(3);

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

  const renderCompanyRows = (onNavigate?: () => void, mobile = false) => (
    <ul className={mobile ? 'space-y-0.5 py-1' : 'max-h-[min(28rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain py-2'}>
      {COMPANIES_NAV.map((item) => {
        const isActiveHere = activeDivisionSlug === item.slug;

        if (item.active) {
          return (
            <li key={item.slug}>
              <Link
                href={`/${item.slug}`}
                locale={locale}
                onClick={() => {
                  setCompaniesOpen(false);
                  onNavigate?.();
                }}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                  mobile ? 'rounded-lg' : ''
                } ${
                  isActiveHere
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0 leading-snug">{item.label}</span>
              </Link>
            </li>
          );
        }

        return (
          <li key={item.slug}>
            <div
              className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm ${
                isActiveHere
                  ? 'border-l-2 border-blue-600 bg-blue-50/90 text-slate-800'
                  : 'text-slate-400'
              } ${mobile ? 'rounded-r-lg' : ''}`}
            >
              <span
                className={`min-w-0 leading-snug ${isActiveHere ? 'font-semibold text-slate-900' : 'text-slate-500'}`}
              >
                {item.label}
              </span>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t('comingSoonNav')}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navbarClasses}`}>
      <div className={`flex h-16 w-full items-center justify-between ${inset}`}>
        <div className="flex min-w-0 items-center">
          <Link
            href="/"
            locale={locale}
            className="group flex flex-shrink-0 items-center gap-2"
            onClick={handleLogoClick}
          >
            <Image
              src={mediaUrl('logo.webp')}
              alt={companyName}
              width={200}
              height={80}
              className="h-16 w-auto object-contain"
              sizes="(max-width: 768px) 140px, 200px"
              priority
            />
          </Link>
        </div>
        <div className="hidden shrink-0 items-center space-x-6 md:flex md:space-x-8">
          {navBeforeCompanies
            .filter((link) => link.href !== pathname)
            .map((link) => (
              <Link key={link.href} href={link.href} locale={locale} className={linkBaseClass}>
                {link.label}
              </Link>
            ))}
          <div className="relative" ref={companiesRef}>
            <button
              type="button"
              className={companiesTriggerClass}
              aria-expanded={companiesOpen}
              aria-haspopup="menu"
              onClick={() => setCompaniesOpen((o) => !o)}
            >
              {t('ourCompanies')}
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${companiesOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {companiesOpen ? (
              <div
                className="absolute left-0 top-full z-[60] mt-2 w-80 max-w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5"
                role="menu"
              >
                {renderCompanyRows()}
              </div>
            ) : null}
          </div>
          {navAfterCompanies
            .filter((link) => link.href !== pathname)
            .map((link) => (
              <Link key={link.href} href={link.href} locale={locale} className={linkBaseClass}>
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
            {navBeforeCompanies
              .filter((link) => link.href !== pathname)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  locale={locale}
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
            {navAfterCompanies
              .filter((link) => link.href !== pathname)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  locale={locale}
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
