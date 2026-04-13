'use client';

import { useTranslations, useAppLocale as useLocale } from '@/lib/dictionary-react';
import { Link } from '@/i18n/navigation';
import { FileText } from 'lucide-react';

export default function TermsPageClient() {
  const locale = useLocale();
  const t = useTranslations('TermsConditions');

  const toc = [
    { id: 'section-acceptance', label: t('tocAcceptance') },
    { id: 'section-license', label: t('tocLicense') },
    { id: 'section-ip', label: t('tocIp') },
    { id: 'section-disclaimer', label: t('tocDisclaimer') },
    { id: 'section-law', label: t('tocLaw') },
    { id: 'section-changes', label: t('tocChanges') },
  ] as const;

  return (
      <article className="min-h-screen bg-white">
        <header className="bg-gradient-to-b from-blue-950 to-blue-900 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                <FileText className="text-white" size={32} aria-hidden />
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
            <p className="mb-8 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600 shadow-sm md:p-5">
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
              <section id="section-acceptance" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('acceptance')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('acceptanceDesc')}</p>
                <h3 className="mt-8 text-base font-bold text-slate-900">{t('eligibilityTitle')}</h3>
                <p className="mt-2 leading-relaxed text-slate-700">{t('eligibilityDesc')}</p>
              </section>

              <section id="section-license" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('useLicense')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('useLicenseDesc')}</p>
                <h3 className="mt-8 text-base font-bold text-slate-900">{t('restrictions')}</h3>
                <p className="mt-2 leading-relaxed text-slate-700">{t('restrictionsDesc')}</p>
              </section>

              <section id="section-ip" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('ipTitle')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('ipDesc')}</p>
                <h3 className="mt-8 text-base font-bold text-slate-900">{t('userContentTitle')}</h3>
                <p className="mt-2 leading-relaxed text-slate-700">{t('userContentDesc')}</p>
                <h3 className="mt-8 text-base font-bold text-slate-900">{t('links')}</h3>
                <p className="mt-2 leading-relaxed text-slate-700">{t('linksDesc')}</p>
              </section>

              <section id="section-disclaimer" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('disclaimer')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('disclaimerDesc')}</p>
                <h3 className="mt-8 text-base font-bold text-slate-900">{t('limitations')}</h3>
                <p className="mt-2 leading-relaxed text-slate-700">{t('limitationsDesc')}</p>
                <h3 className="mt-8 text-base font-bold text-slate-900">{t('indemnityTitle')}</h3>
                <p className="mt-2 leading-relaxed text-slate-700">{t('indemnityDesc')}</p>
              </section>

              <section id="section-law" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('governingLawTitle')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('governingLawDesc')}</p>
              </section>

              <section id="section-changes" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('revisions')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('revisionsDesc')}</p>
                <h3 className="mt-8 text-base font-bold text-slate-900">{t('contactClosingTitle')}</h3>
                <p className="mt-2 leading-relaxed text-slate-700">{t('contactClosingDesc')}</p>
                <p className="mt-4 text-sm">
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
