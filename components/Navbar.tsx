'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { useTranslations } from '@/lib/dictionary-react';
import LanguageSwitcher from './LanguageSwitcher';
import {
  COMPANY_DIVISION_SLUGS,
  activeCompanyDivisionSlugFromPathname,
  type CompanyDivisionSlug,
} from '@/lib/company-divisions';
import { stripLocalePrefixFromPathname } from '@/lib/locale-from-path';
import { EMPTY_SECTOR_LIVE_MAP, sectorLiveMapFromApiPayload } from '@/lib/sector-live-shared';
import {
  BRAND_LOGO_INTRINSIC,
  brandLogoSrc,
  brandLogoSrcSet,
} from '@/lib/brand-logo';

/** Align with `/api/public/sectors` short HTTP cache — avoids hammering the origin and inflating “fully loaded” metrics. */
const SECTOR_POLL_MS = 60_000;

/** Tailwind `md:` breakpoint — must match `hidden md:flex` / `md:hidden` usage for nav. */
const MD_MIN_WIDTH_QUERY = '(min-width: 768px)';

function subscribeMdMq(onChange: () => void) {
  const mq = window.matchMedia(MD_MIN_WIDTH_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getMdMqSnapshot() {
  return window.matchMedia(MD_MIN_WIDTH_QUERY).matches;
}

/** Avoid hydration mismatch: assume mobile until client subscribes. */
function getMdMqServerSnapshot() {
  return false;
}

function useMdNavBreakpoint() {
  return useSyncExternalStore(subscribeMdMq, getMdMqSnapshot, getMdMqServerSnapshot);
}

/** Viewport-fixed mega menu: anchored to the trigger’s left edge and opens toward the right, clamped to the viewport. */
function megaMenuPositionFromButton(buttonEl: HTMLElement) {
  const r = buttonEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const margin = 16;
  const maxW =
    vw >= 640 ? Math.min(34 * 16, vw - margin * 2) : Math.min(28 * 16, vw - margin * 2);
  const width = maxW;
  let left = r.left;
  left = Math.max(margin, Math.min(left, vw - width - margin));
  return { top: r.bottom, left, width };
}

export default function Navbar() {
  const isMdUp = useMdNavBreakpoint();
  const [isOpen, setIsOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [mobileCompaniesOpen, setMobileCompaniesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sectorLive, setSectorLive] = useState<Record<string, boolean>>(() => ({ ...EMPTY_SECTOR_LIVE_MAP }));
  /** False until first sectors fetch attempt finishes — avoids flashing “Coming soon” before we know live flags. */
  const [sectorLiveReady, setSectorLiveReady] = useState(false);
  const thresholdRef = useRef(300);
  const companiesRef = useRef<HTMLDivElement>(null);
  const companiesButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [megaMenuBox, setMegaMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const t = useTranslations('Navbar');
  const tDivision = useTranslations('DivisionLabels');
  const companyName = 'Doddapaneni Group';
  const pathname = usePathname();
  /**
   * Routes whose first hero band is light (not dark blue) under the fixed bar — white “transparent”
   * nav text would disappear. `/careers` uses a dark blue hero to the top; keep default transparent nav.
   */
  const strippedPath = stripLocalePrefixFromPathname(pathname);
  const lightHeroUnderNav = strippedPath === '/team';

  const activeDivisionSlug = useMemo(
    () => activeCompanyDivisionSlugFromPathname(pathname),
    [pathname],
  );
  const isOnGroupCompany = activeDivisionSlug !== null;

  const loadLatestSectors = useCallback(async () => {
    try {
      const r = await fetch('/api/public/sectors');
      if (!r.ok) throw new Error('sectors');
      const d = (await r.json()) as { sectors?: unknown };
      setSectorLive(sectorLiveMapFromApiPayload(d));
    } catch {
      /* keep last good map; do not flip everything to “coming soon” on a transient error */
    } finally {
      setSectorLiveReady(true);
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

  /** Never leave the desktop mega-menu portal open on mobile — it can sit at (0,0) and block all taps. */
  useEffect(() => {
    if (!isMdUp) {
      setCompaniesOpen(false);
      if (closeMenuTimerRef.current) {
        clearTimeout(closeMenuTimerRef.current);
        closeMenuTimerRef.current = null;
      }
    }
  }, [isMdUp]);

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

  const updateMegaMenuPosition = useCallback(() => {
    const btn = companiesButtonRef.current;
    if (!btn) return;
    setMegaMenuBox(megaMenuPositionFromButton(btn));
  }, []);

  useLayoutEffect(() => {
    if (!companiesOpen) {
      setMegaMenuBox(null);
      return;
    }
    updateMegaMenuPosition();
  }, [companiesOpen, updateMegaMenuPosition]);

  useEffect(() => {
    if (!companiesOpen) return;
    const onScrollOrResize = () => updateMegaMenuPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [companiesOpen, updateMegaMenuPosition]);

  const isTransparent = !scrolled && !lightHeroUnderNav;
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
    { href: '/team', label: t('team') },
    { href: '/careers', label: t('careers') },
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

  const inset = 'pl-3 pr-5 sm:px-5 md:px-8 lg:px-12 xl:px-16';

  const renderCompanyRows = (onNavigate?: () => void, mobile = false) => {
    if (!sectorLiveReady) {
      return (
        <div
          className={
            mobile ? 'py-4 px-3 text-center text-sm text-slate-500' : 'py-6 px-4 text-center text-sm text-slate-500'
          }
        >
          {t('sectorLiveLoading')}
        </div>
      );
    }

    return (
      <ul
        className={
          mobile
            ? 'space-y-0 py-0.5'
            : 'flex flex-col gap-0.5 py-2 px-2 sm:px-3'
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
                  className={`flex items-center gap-2 px-2 py-2 text-sm transition-colors rounded-md sm:gap-3 sm:px-3 sm:py-2.5 ${
                    isActiveHere
                      ? 'bg-blue-600 font-semibold text-white'
                      : 'text-slate-800 hover:bg-slate-100'
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
                className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2 py-2 text-sm rounded-md sm:px-3 sm:py-2.5 ${
                  isActiveHere ? 'border-l-2 border-blue-600 bg-blue-50 text-slate-800' : 'text-slate-500'
                }`}
              >
                <span
                  className={`min-w-0 flex-1 break-words leading-snug ${
                    isActiveHere ? 'font-semibold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
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
    <nav className={`fixed top-0 inset-x-0 z-50 overflow-visible transition-all duration-300 ${navbarClasses}`}>
      <div className={`flex h-16 w-full items-center justify-between gap-2 md:h-20 md:gap-3 ${inset}`}>
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            className="group flex h-16 shrink-0 items-center md:h-20"
            onClick={handleLogoClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- public brandmark; `h-14`–`h-20` by breakpoint (see HomeHero). */}
            <img
              src={brandLogoSrc(640)}
              srcSet={brandLogoSrcSet}
              sizes="(max-width: 768px) min(calc(100vw - 8rem), 220px), 360px"
              alt={companyName}
              width={BRAND_LOGO_INTRINSIC.width}
              height={BRAND_LOGO_INTRINSIC.height}
              decoding="async"
              fetchPriority="low"
              className="block h-14 w-auto max-w-[calc(100vw-7.5rem)] shrink-0 object-contain object-left sm:h-16 sm:max-w-[calc(100vw-9rem)] md:h-20 md:max-w-[min(92vw,42rem)] lg:max-w-[52rem]"
            />
          </Link>
        </div>
        <div className="hidden shrink-0 items-center space-x-6 overflow-visible md:flex md:space-x-8">
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
              ref={companiesButtonRef}
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
            {companiesOpen && megaMenuBox && isMdUp ? (
              <div
                className="fixed z-[60] pt-1"
                style={{
                  top: megaMenuBox.top,
                  left: megaMenuBox.left,
                  width: megaMenuBox.width,
                }}
                role="region"
                aria-label={t('ourCompanies')}
              >
                <div className="max-h-[min(32rem,calc(100vh-8rem))] w-full overflow-y-auto overscroll-contain">
                  <div className="rounded-lg border border-slate-200 bg-white shadow-lg">
                    {renderCompanyRows(undefined, false)}
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
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:hidden">
          <LanguageSwitcher isTransparent={isTransparent} />
          <button
            type="button"
            onClick={() => {
              setIsOpen((open) => {
                if (open) setMobileCompaniesOpen(false);
                return !open;
              });
            }}
            className={`inline-flex items-center justify-center rounded-md p-1.5 transition-colors focus:outline-none sm:p-2 ${mobileButtonClass}`}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-gray-100 md:hidden">
          <div className={`${inset} space-y-0.5 bg-white/95 py-1.5 pb-3 pt-1.5 backdrop-blur-lg`}>
            {navBeforeMega
              .filter((link) => link.href !== pathname)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-900 sm:px-3 sm:py-2.5 sm:text-base"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            <div className="border-t border-slate-100 pt-0.5">
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-slate-50 sm:px-3 sm:py-2.5 sm:text-base ${
                  isOnGroupCompany ? 'bg-blue-50 text-blue-950' : 'text-slate-800'
                }`}
                onClick={() => {
                  setMobileCompaniesOpen((o) => {
                    const next = !o;
                    if (next) void loadLatestSectors();
                    return next;
                  });
                }}
                aria-expanded={mobileCompaniesOpen}
              >
                {t('ourCompanies')}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform sm:h-5 sm:w-5 ${mobileCompaniesOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {mobileCompaniesOpen ? (
                <div className="max-h-[min(55vh,22rem)] overflow-y-auto overscroll-contain border-l-2 border-blue-100 bg-slate-50/80 pl-2 [-webkit-overflow-scrolling:touch] sm:max-h-[min(70vh,28rem)]">
                  {renderCompanyRows(() => {
                    setIsOpen(false);
                    setMobileCompaniesOpen(false);
                  }, true)}
                </div>
              ) : null}
            </div>
            {navAfterMega
              .filter((link) => link.href !== pathname)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-900 sm:px-3 sm:py-2.5 sm:text-base"
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
