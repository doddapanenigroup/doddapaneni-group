'use client';

import { useTranslations, useAppLocale as useLocale } from '@/lib/dictionary-react';
import { Link } from '@/i18n/navigation';
import { AlertTriangle } from 'lucide-react';

export default function DisclaimerPageClient() {
  const locale = useLocale();
  const t = useTranslations('Disclaimer');

  const toc = [
    { id: 'section-general', label: t('tocGeneral') },
    { id: 'section-healthcare', label: t('tocHealthcare') },
    { id: 'section-realestate', label: t('tocRealEstate') },
    { id: 'section-warranty', label: t('tocNoWarranty') },
    { id: 'section-liability', label: t('tocLiability') },
    { id: 'section-links', label: t('tocLinks') },
    { id: 'section-business', label: t('tocBusiness') },
    { id: 'section-jurisdiction', label: t('tocJurisdiction') },
  ] as const;

  return (
      <article className="min-h-screen bg-white">
        <header className="bg-gradient-to-b from-blue-950 to-blue-900 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                <AlertTriangle className="text-white" size={32} aria-hidden />
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300 sm:text-xs">
              Doddapaneni Group
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">{t('title')}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">{t('subtitle')}</p>
            <p className="mt-3 text-xs text-blue-200/90 sm:text-sm">{t('lastUpdated')}</p>
          </div>
        </header>

        <div className="border-t border-blue-100/60 bg-slate-50 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="mb-8 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm leading-relaxed text-amber-950 shadow-sm md:p-5">
              {t('notLegalAdvice')}
            </p>

            <nav
              aria-label={t('tocAriaLabel')}
              className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('tocIntro')}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800 marker:font-semibold marker:text-blue-800">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-blue-800 underline-offset-2 hover:underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:space-y-12 md:p-10">
              <section id="section-general" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('general')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('generalDesc')}</p>
              </section>

              <section
                id="section-healthcare"
                className="scroll-mt-24 rounded-xl border border-slate-200 bg-slate-50/80 p-5 md:p-6"
              >
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('healthcareTitle')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('healthcareDesc')}</p>
              </section>

              <section
                id="section-realestate"
                className="scroll-mt-24 rounded-xl border border-slate-200 bg-slate-50/80 p-5 md:p-6"
              >
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('realEstateTitle')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('realEstateDesc')}</p>
              </section>

              <section id="section-warranty" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('noWarranty')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('noWarrantyDesc')}</p>
              </section>

              <section id="section-liability" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('limitation')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('limitationDesc')}</p>
              </section>

              <section id="section-links" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('externalLinks')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('externalLinksDesc')}</p>
              </section>

              <section id="section-business" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('businessDisclaimer')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('businessDisclaimerDesc')}</p>
              </section>

              <section id="section-jurisdiction" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('jurisdiction')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('jurisdictionDesc')}</p>
                <p className="mt-6 text-sm">
                  <Link href="/contact" locale={locale} className="font-semibold text-blue-800 hover:underline">
                    {t('contactPageLink')}
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      </article>
  );
}
