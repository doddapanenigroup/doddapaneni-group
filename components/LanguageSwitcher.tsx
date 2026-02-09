"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useTransition } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ isTransparent }: { isTransparent?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'es', name: 'Español' },
  ];

  const onSelectChange = (nextLocale: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };
  
  return (
    <div className="relative ml-4">
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 hover:backdrop-blur-md hover:scale-105 border border-transparent ${
                isTransparent 
                  ? 'text-white hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] hover:border-white/30' 
                  : 'text-blue-900 hover:bg-blue-500/10 hover:shadow-[0_8px_32px_0_rgba(30,58,138,0.1)] hover:border-blue-200/50'
              }`}
            aria-label="Select Language"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
        >
            <Globe size={18} />
            <span className="uppercase">{locale}</span>
        </button>
        
        {isOpen && (
            <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true"></div>
                <div 
                    className={`absolute right-0 mt-2 w-40 max-h-[70vh] overflow-y-auto rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] backdrop-blur-xl border overflow-x-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                        isTransparent
                            ? 'bg-slate-900/60 border-white/20'
                            : 'bg-white/90 border-slate-200'
                    }`}
                    role="listbox"
                    aria-label="Language options"
                >
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => onSelectChange(lang.code)}
                            className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                                isTransparent
                                    ? `text-white hover:bg-white/10 ${locale === lang.code ? 'font-bold bg-white/20' : ''}`
                                    : `text-slate-700 hover:bg-blue-50 hover:text-blue-900 ${locale === lang.code ? 'text-blue-700 font-bold bg-blue-50/50' : ''}`
                            }`}
                            disabled={isPending}
                            role="option"
                            aria-selected={locale === lang.code}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            </>
        )}
    </div>
  );
}
