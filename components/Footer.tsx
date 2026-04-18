'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from '@/lib/dictionary-react';
import Image from 'next/image';
import { Facebook, Instagram, X, MessageCircle } from 'lucide-react';
function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="currentColor"
    >
      <path d="M12 2a10 10 0 0 0-3.64 19.31 9.3 9.3 0 0 1 .08-2.68l1.01-4.3s-.25-.5-.25-1.25c0-1.17.68-2.05 1.53-2.05.72 0 1.06.54 1.06 1.18 0 .72-.46 1.8-.7 2.8-.2.83.42 1.5 1.24 1.5 1.49 0 2.64-1.57 2.64-3.84 0-2.01-1.45-3.42-3.51-3.42-2.39 0-3.79 1.79-3.79 3.64 0 .72.28 1.5.63 1.92a.26.26 0 0 1 .06.25l-.25 1.02c-.04.17-.14.21-.33.13-1.22-.57-1.98-2.34-1.98-3.76 0-3.06 2.22-5.87 6.41-5.87 3.36 0 5.98 2.4 5.98 5.61 0 3.35-2.11 6.05-5.04 6.05-.98 0-1.9-.51-2.22-1.11l-.61 2.3a10.1 10.1 0 0 1-.91 2.14A10 10 0 1 0 12 2z" />
    </svg>
  );
}

const COMPANY_NAME = 'Doddapaneni Group';

export default function Footer() {
  const t = useTranslations('Footer');
  const navT = useTranslations('Navbar');
  const currentYear = new Date().getFullYear();

  const contact = {
    email: 'doddapanenigroup@yahoo.com',
    locations: [
      {
        phone: '+91 814 224 6666',
        address:
          'Plot No 22,23,41,42 & 43, Sri Krishna Avenue, Venkataramana Colony, Gokul Plots, Vasanth Nagar, Ranga Reddy District, 500085',
      },
      {
        phone: '+1 (352)230-8586',
        address: '5052 SW 40th PL, Ocala, Florida, 34474',
      },
    ],
  };

  const socialLinks = {
    facebook: 'https://www.facebook.com/profile.php?id=61588007971937',
    twitter: 'https://x.com/DoddapanenGroup',
    instagram: 'https://www.instagram.com/doddapanrnigroup/',
    whatsapp: 'https://whatsapp.com/channel/0029VbCMxCGKmCPKKsU0zo33',
    pinterest: 'https://www.pinterest.com/doddapanenigroup/',
  };

  const legalLinkClass =
    'text-blue-200 hover:text-white text-xs sm:text-sm transition-colors underline-offset-2 hover:underline';

  return (
    <footer className="mt-auto w-full bg-blue-900 text-white">
      <div className="w-full px-5 pt-6 pb-4 sm:px-8 md:pt-10 md:pb-6 lg:px-12 xl:px-16">
        <nav
          aria-label={t('companyLegalNavAria')}
          className="border-b border-blue-700/80 pb-5 md:pb-6"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-blue-300 sm:text-xs">
            {t('companyLegalNav')}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:gap-x-8">
            <li>
              <Link href="/about" className={legalLinkClass}>
                {navT('about')}
              </Link>
            </li>
            <li>
              <Link href="/team" className={legalLinkClass}>
                {navT('team')}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={legalLinkClass}>
                {navT('contact')}
              </Link>
            </li>
            <li>
              <Link href="/careers" className={legalLinkClass}>
                {navT('careers')}
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className={legalLinkClass}>
                {t('privacyPolicy')}
              </Link>
            </li>
            <li>
              <Link href="/terms" className={legalLinkClass}>
                {t('termsShort')}
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className={legalLinkClass}>
                {t('disclaimer')}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-2 md:gap-10 lg:grid-cols-4 lg:gap-8 xl:gap-10">
          <div className="lg:max-w-md">
            <div className="relative mb-3 h-16 w-[160px] md:mb-4 md:h-20 md:w-[200px]">
              <Image
                src="/logo.webp"
                alt={COMPANY_NAME}
                fill
                className="object-contain object-left"
                sizes="(max-width: 768px) 160px, 200px"
                loading="lazy"
              />
            </div>
            <p className="text-base font-semibold text-white">{COMPANY_NAME}</p>
            <p className="mt-2 text-xs leading-relaxed text-blue-300 md:text-sm">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white md:text-base">{t('quickLinks')}</h3>
            <ul className="space-y-1.5 md:space-y-2">
              <li>
                <Link href="/" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">
                  {navT('home')}
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">
                  {navT('blog')}
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">
                  {navT('team')}
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">
                  {navT('careers')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">
                  {t('faq')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white md:text-base">{t('contact')}</h3>
            <div className="text-xs text-blue-300 md:text-sm space-y-3 md:space-y-4">
              {contact.locations.map((location, index) => {
                const addressParts = location.address.split(',');
                const shortAddress =
                  addressParts.length > 2
                    ? `${addressParts[addressParts.length - 2]}, ${addressParts[addressParts.length - 1]}`
                    : location.address;

                return (
                  <div key={index} className="space-y-1 md:space-y-2">
                    <p className="break-words">
                      <span className="mr-1 font-medium text-white md:mr-2">{t('phone')}:</span>
                      <a
                        href={`tel:${location.phone.replace(/[^\d+]/g, '')}`}
                        className="break-all text-blue-200 transition-colors hover:text-white"
                      >
                        {location.phone}
                      </a>
                    </p>
                    <div className="flex items-start">
                      <span className="mr-1 shrink-0 font-medium text-white md:mr-2">{t('address')}:</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-200 transition-colors hover:text-white break-words leading-snug"
                        title={location.address}
                      >
                        <span className="md:hidden">{shortAddress}</span>
                        <span className="hidden md:inline">{location.address}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
              {contact.email ? (
                <p className="break-words">
                  <span className="mr-1 font-medium text-white md:mr-2">{t('email')}:</span>
                  <a href={`mailto:${contact.email}`} className="break-all text-blue-200 transition-colors hover:text-white">
                    {contact.email}
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white md:text-base">{t('followUs')}</h3>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 transition-colors hover:text-white"
                aria-label="Facebook"
              >
                <Facebook size={18} className="md:h-6 md:w-6" />
              </a>
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 transition-colors hover:text-white"
                aria-label="Twitter"
              >
                <X size={18} className="md:h-6 md:w-6" />
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 transition-colors hover:text-white"
                aria-label="Instagram"
              >
                <Instagram size={18} className="md:h-6 md:w-6" />
              </a>
              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 transition-colors hover:text-white"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} className="md:h-6 md:w-6" />
              </a>
              <a
                href={socialLinks.pinterest}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 transition-colors hover:text-white"
                aria-label="Pinterest"
              >
                <PinterestIcon className="h-[18px] w-[18px] md:h-6 md:w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-4 md:pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-center text-xs text-blue-300 md:text-left md:text-sm">
              © {currentYear} <span className="font-semibold text-white">{COMPANY_NAME}</span>. {t('rights')}
            </p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-blue-300 sm:text-sm md:justify-end">
              <Link href="/about" className="hover:text-white transition-colors">
                {navT('about')}
              </Link>
              <span className="text-blue-600" aria-hidden>
                |
              </span>
              <Link href="/team" className="hover:text-white transition-colors">
                {navT('team')}
              </Link>
              <span className="text-blue-600" aria-hidden>
                |
              </span>
              <Link href="/careers" className="hover:text-white transition-colors">
                {navT('careers')}
              </Link>
              <span className="text-blue-600" aria-hidden>
                |
              </span>
              <Link href="/contact" className="hover:text-white transition-colors">
                {navT('contact')}
              </Link>
              <span className="text-blue-600" aria-hidden>
                |
              </span>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                {t('privacyPolicy')}
              </Link>
              <span className="text-blue-600" aria-hidden>
                |
              </span>
              <Link href="/terms" className="hover:text-white transition-colors">
                {t('termsShort')}
              </Link>
              <span className="text-blue-600" aria-hidden>
                |
              </span>
              <Link href="/disclaimer" className="hover:text-white transition-colors">
                {t('disclaimer')}
              </Link>
              <span className="text-blue-600" aria-hidden>
                |
              </span>
              <a href="/sitemap.xml" className="hover:text-white transition-colors">
                {t('sitemap')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
