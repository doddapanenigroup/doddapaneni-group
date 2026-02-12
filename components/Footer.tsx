'use client';

import {Link} from '@/i18n/routing';
import {useTranslations} from 'next-intl';
import Image from 'next/image';
import { Facebook, Linkedin, Instagram, Youtube, X, MessageCircle } from 'lucide-react';

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
    linkedin: "https://www.linkedin.com/company/doddapaneni-group",
    youtube: "https://www.youtube.com/@doddapanenigroup"
  };

  return (
    <footer className="bg-blue-900 text-white pt-3 pb-3 md:pt-8 md:pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-3 md:mb-6 px-4 sm:px-0">
        {/* Company Info */}
        <div>
          <div className="mb-2 md:mb-4">
            <Image 
              src="/logo.png" 
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
        <div className="pr-0 md:pr-4 sm:md:pr-6 lg:pr-8">
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
        <div className="pr-0 md:pr-4 sm:md:pr-6 lg:pr-8">
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
        <div className="pr-0 md:pr-4 sm:md:pr-6 lg:pr-8">
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
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} className="md:w-6 md:h-6" />
            </a>
            <a
              href={socialLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-white transition-colors"
              aria-label="YouTube"
            >
              <Youtube size={16} className="md:w-6 md:h-6" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-blue-800 pt-2 md:pt-6 px-4 sm:px-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-1.5 md:gap-3 pr-0 md:pr-4 sm:md:pr-6 lg:pr-8">
          <p className="text-blue-400 text-xs md:text-sm text-center md:text-left">
            &copy; {currentYear} {companyName}. {t('rights')}
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
    </footer>
  );
}
