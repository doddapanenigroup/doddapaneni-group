"use client";

import {Link, usePathname} from '@/i18n/routing';
import { Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import { mediaUrl } from '@/lib/media';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const thresholdRef = useRef(300);
  const t = useTranslations('Navbar');
  const companyName = "Doddapaneni Group";
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    const updateThreshold = () => {
      // Find the first section (usually the Hero)
      const heroSection = document.querySelector('section');
      if (heroSection) {
        // Calculate threshold based on hero height
        // Navbar bottom is approx 96px (top-4 + h-20)
        // We want to switch when the white content scrolls under the navbar
        thresholdRef.current = heroSection.offsetHeight - 90;
      } else {
        // Fallback for pages without standard hero sections (e.g. 404)
        // Immediate switch ensures visibility on white backgrounds
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

  // Navbar style logic
  const isTransparent = !scrolled;
  const navbarClasses = isTransparent 
    ? 'bg-transparent border-transparent' 
    : 'bg-transparent backdrop-blur-xl shadow-none';
  
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

  const inset = 'px-5 sm:px-8 lg:px-12 xl:px-16';

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navbarClasses}`}>
      <div className={`w-full flex justify-between h-16 items-center ${inset}`}>
        <div className="flex items-center min-w-0">
          <Link 
            href="/" 
            locale={useLocale()} 
            className="flex-shrink-0 flex items-center gap-2 group"
            onClick={handleLogoClick}
          >
            <Image
              src={mediaUrl('logo.webp')}
              alt={companyName}
              width={200}
              height={80}
              className="h-16 w-auto object-contain"
              priority
            />
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-8 shrink-0">
          {navLinks.filter(link => link.href !== pathname).map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 hover:backdrop-blur-md hover:scale-105 border border-transparent ${
                isTransparent 
                  ? 'text-white hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] hover:border-white/30' 
                  : 'text-blue-900 hover:bg-blue-100 hover:shadow-[0_8px_32px_0_rgba(30,58,138,0.1)] hover:border-blue-200/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher isTransparent={isTransparent} />
        </div>
        <div className="flex md:hidden items-center gap-3 sm:gap-4 shrink-0">
           <LanguageSwitcher isTransparent={isTransparent} />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none transition-colors ${mobileButtonClass}`}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100">
          <div className={`${inset} pt-2 pb-4 space-y-1 bg-white/95 backdrop-blur-lg`}>
            {navLinks.filter(link => link.href !== pathname).map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="block text-slate-700 hover:text-blue-900 hover:bg-slate-50 px-3 py-3 rounded-md text-base font-medium transition-colors" 
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
