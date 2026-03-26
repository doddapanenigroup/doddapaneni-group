'use client';

import {Link} from '@/i18n/routing';
import {useTranslations} from 'next-intl';
import Image from 'next/image';
import { Facebook, Instagram, X, MessageCircle } from 'lucide-react';
import { mediaUrl } from '@/lib/media';

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

export default function Footer() {
  const t = useTranslations('Footer');
  const navT = useTranslations('Navbar');
  const currentYear = new Date().getFullYear();
  const companyName = "Doddapaneni Group";
  
  const contact = {
    email: "info@doddapanenigroup.net",
    locations: [
      {
        phone: "+91 814 224 6666",
        address: "Plot No 22,23,41,42 & 43, Sri Krishna Avenue, Venkataramana Colony, Gokul Plots, Vasanth Nagar, Ranga Reddy District, 500085"
      },
      {
        phone: "+1 (352)230-8586",
        address: "5052 SW 40th PL, Ocala, Florida, 34474"
      }
    ]
  };

  const socialLinks = {
    facebook: "https://www.facebook.com/profile.php?id=61588007971937",
    twitter: "https://x.com/DoddapanenGroup",
    instagram: "https://www.instagram.com/doddapanrnigroup/",
    whatsapp: "https://whatsapp.com/channel/0029VbCMxCGKmCPKKsU0zo33",
    pinterest: "https://www.pinterest.com/doddapanenigroup/",
  };

  return (
    <footer className="bg-blue-900 text-white pt-3 pb-3 md:pt-8 md:pb-6 w-full">
      <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-3 md:mb-6">
        {/* Company Info */}
        <div>
          <div className="mb-2 md:mb-4">
            <Image 
              src={mediaUrl('logo.webp')} 
              alt={companyName} 
              width={280} 
              height={112} 
              className="h-8 md:h-16 w-auto object-contain"
            />
          </div>
          <p className="text-blue-400 text-xs md:text-sm leading-relaxed mb-2 md:mb-4">
            {t('tagline')}
          </p>
        </div>

        {/* Quick Links & Legal */}
        <div className="pr-0 md:pr-4 lg:pr-8">
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div>
              <h3 className="text-xs md:text-lg font-semibold mb-1 md:mb-3">{t('quickLinks')}</h3>
              <ul className="space-y-0.5 md:space-y-1.5">
                <li><Link href="/" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{navT('home')}</Link></li>
                <li><Link href="/about" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{navT('about')}</Link></li>
                <li><Link href="/services" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{navT('services')}</Link></li>
                <li><Link href="/blog" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{navT('blog')}</Link></li>
                <li><Link href="/contact" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{navT('contact')}</Link></li>
                <li><Link href="/faq" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{t('faq')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xs md:text-lg font-semibold mb-1 md:mb-3">{t('legal')}</h3>
              <ul className="space-y-0.5 md:space-y-1.5">
                <li><Link href="/privacy-policy" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{t('privacyPolicy')}</Link></li>
                <li><Link href="/terms-conditions" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{t('termsConditions')}</Link></li>
                <li><Link href="/disclaimer" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{t('disclaimer')}</Link></li>
                <li><a href="/sitemap.xml" className="text-blue-300 hover:text-white text-xs md:text-sm transition-colors">{t('sitemap')}</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="pr-0 md:pr-4 lg:pr-8">
          <h3 className="text-xs md:text-lg font-semibold mb-1 md:mb-3">{t('contact')}</h3>
          <div className="text-blue-400 text-xs md:text-sm space-y-1.5 md:space-y-4">
            {contact.locations.map((location, index) => {
              // Shorten address on mobile - show only city/state or key part
              const addressParts = location.address.split(',');
              const shortAddress = addressParts.length > 2 
                ? `${addressParts[addressParts.length - 2]}, ${addressParts[addressParts.length - 1]}`
                : location.address;
              
              return (
                <div key={index} className="space-y-0.5 md:space-y-2">
                  <p className="break-words">
                    <span className="text-white font-medium mr-1 md:mr-2 text-xs">{t('phone')}:</span>
                    <a href={`tel:${location.phone.replace(/[^\d+]/g, '')}`} className="hover:text-white transition-colors break-all text-xs">
                      {location.phone}
                    </a>
                  </p>
                  <div className="flex items-start">
                    <span className="text-white font-medium mr-1 md:mr-2 shrink-0 text-xs">{t('address')}:</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors break-words text-xs leading-tight"
                      title={location.address}
                    >
                      <span className="md:hidden">{shortAddress}</span>
                      <span className="hidden md:inline">{location.address}</span>
                    </a>
                  </div>
                </div>
              );
            })}
            {contact.email && (
              <p className="break-words mt-1 md:mt-0">
                <span className="text-white font-medium mr-1 md:mr-2 text-xs">{t('email')}:</span>
                <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors break-all text-xs">
                  {contact.email}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Social Media */}
        <div className="pr-0 md:pr-4 lg:pr-8">
          <h3 className="text-xs md:text-lg font-semibold mb-1 md:mb-3">{t('followUs')}</h3>
          <div className="flex flex-wrap gap-2 md:gap-4">
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={16} className="md:w-6 md:h-6" />
            </a>
            <a
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <X size={16} className="md:w-6 md:h-6" />
            </a>
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={16} className="md:w-6 md:h-6" />
            </a>
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-white transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle size={16} className="md:w-6 md:h-6" />
            </a>
            <a
              href={socialLinks.pinterest}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-white transition-colors"
              aria-label="Pinterest"
            >
              <PinterestIcon className="w-4 h-4 md:w-6 md:h-6" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar - inset from wrapper above */}
      <div className="border-t border-blue-800 pt-2 md:pt-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-1.5 md:gap-3">
          <p className="text-blue-400 text-xs md:text-sm text-center md:text-left">
            © {currentYear} {companyName}. {t('rights')}
          </p>
          <div className="flex flex-wrap justify-center gap-1 md:gap-4 text-blue-400 text-xs md:text-sm">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">{t('privacyPolicy')}</Link>
            <span className="hidden md:inline">|</span>
            <Link href="/terms-conditions" className="hover:text-white transition-colors">{t('termsConditions')}</Link>
            <span className="hidden md:inline">|</span>
            <Link href="/disclaimer" className="hover:text-white transition-colors">{t('disclaimer')}</Link>
            <span className="hidden md:inline">|</span>
            <a href="/sitemap.xml" className="hover:text-white transition-colors">{t('sitemap')}</a>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
